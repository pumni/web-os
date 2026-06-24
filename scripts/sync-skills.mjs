/**
 * sync-skills — generate the .claude/skills shims from the canonical
 * .agents/skills bodies.
 *
 * The canonical, tool-agnostic skill body lives in
 * .agents/skills/<name>/SKILL.md. Claude Code discovers skills from
 * .claude/skills/<name>/SKILL.md, so each canonical skill needs a thin shim
 * carrying the *same* `name` + `description` frontmatter (the model's
 * invocation surface) plus a pointer back to the canonical file.
 *
 * Hand-syncing two copies of every description drifts. This script makes the
 * canonical the single source of truth and regenerates the shims from it.
 *
 *   bun scripts/sync-skills.mjs           # write/refresh shims
 *   bun scripts/sync-skills.mjs --check   # fail if any shim is missing/stale/orphan
 *
 * The --check form is wired into `bun run ai:check`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CANONICAL_DIR = path.join(ROOT, '.agents', 'skills');
const SHIM_DIR = path.join(ROOT, '.claude', 'skills');

const checkOnly = process.argv.includes('--check');

function fail(message) {
  console.error(`[ERROR] ${message}`);
}

/** Parse a SKILL.md into { name, description, title }. Returns null on malformed input. */
function parseCanonical(content) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return null;
  const end = content.indexOf('\n---', 4);
  if (end === -1) return null;
  const frontmatter = content.slice(4, end);
  const body = content.slice(end + 4);

  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  // description may wrap across lines until the next `key:` or end of frontmatter.
  const descMatch = frontmatter.match(/^description:\s*([\s\S]*?)(?:\n[a-z][\w-]*:|\s*$)/m);
  const titleMatch = body.match(/^#\s+(.+)$/m);

  if (!nameMatch || !descMatch || !titleMatch) return null;
  return {
    name: nameMatch[1].trim(),
    description: descMatch[1].replace(/\s+/g, ' ').trim(),
    title: titleMatch[1].trim(),
  };
}

/** Render the canonical shim content for a given skill directory. */
function renderShim(dir, parsed) {
  const canonicalPath = `.agents/skills/${dir}/SKILL.md`;
  return `---
name: ${parsed.name}
description: ${parsed.description}
---

# ${parsed.title} (pointer)

Canonical, tool-agnostic procedure — read it before acting:
[${canonicalPath}](/${canonicalPath})
`;
}

function listSkillDirs(baseDir) {
  if (!fs.existsSync(baseDir)) return [];
  return fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

let drift = 0;
let written = 0;

const canonicalDirs = listSkillDirs(CANONICAL_DIR);
if (canonicalDirs.length === 0) {
  fail('No skills found under .agents/skills.');
  process.exit(1);
}

const expectedShimDirs = new Set();

for (const dir of canonicalDirs) {
  const canonicalPath = path.join(CANONICAL_DIR, dir, 'SKILL.md');
  if (!fs.existsSync(canonicalPath)) {
    fail(`.agents/skills/${dir} has no SKILL.md.`);
    drift++;
    continue;
  }
  const parsed = parseCanonical(fs.readFileSync(canonicalPath, 'utf8'));
  if (!parsed) {
    fail(`.agents/skills/${dir}/SKILL.md frontmatter (name/description) or H1 title is malformed.`);
    drift++;
    continue;
  }

  expectedShimDirs.add(dir);
  const expected = renderShim(dir, parsed);
  const shimPath = path.join(SHIM_DIR, dir, 'SKILL.md');
  const current = fs.existsSync(shimPath) ? fs.readFileSync(shimPath, 'utf8') : null;

  if (current === expected) continue;

  if (checkOnly) {
    fail(
      current === null
        ? `Missing shim: .claude/skills/${dir}/SKILL.md`
        : `Stale shim: .claude/skills/${dir}/SKILL.md does not match canonical .agents/skills/${dir}.`,
    );
    drift++;
  } else {
    fs.mkdirSync(path.dirname(shimPath), { recursive: true });
    fs.writeFileSync(shimPath, expected);
    console.log(`wrote .claude/skills/${dir}/SKILL.md`);
    written++;
  }
}

// Orphan shims (no canonical body) drift the discovery surface — flag them.
for (const dir of listSkillDirs(SHIM_DIR)) {
  if (expectedShimDirs.has(dir)) continue;
  if (checkOnly) {
    fail(`Orphan shim: .claude/skills/${dir} has no canonical .agents/skills/${dir}.`);
    drift++;
  } else {
    fs.rmSync(path.join(SHIM_DIR, dir), { recursive: true, force: true });
    console.log(`removed orphan .claude/skills/${dir}`);
    written++;
  }
}

if (checkOnly) {
  if (drift > 0) {
    console.error(`\n${drift} skill shim(s) out of sync. Run \`bun run ai:skills:sync\` and commit.`);
    process.exit(1);
  }
  console.log('Skill shims are in sync with .agents/skills.');
} else {
  console.log(written > 0 ? `\nSynced ${written} shim change(s).` : 'Skill shims already in sync.');
}
