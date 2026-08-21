import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let errors = 0;

function error(message) {
  console.error(`[ERROR] ${message}`);
  errors += 1;
}

function absolute(relativePath) {
  return path.join(ROOT, relativePath);
}

function relative(fullPath) {
  return path.relative(ROOT, fullPath).replaceAll(path.sep, '/');
}

function walk(dir, visit) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', '.next', '.turbo', 'node_modules'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, visit);
    else visit(fullPath, entry.name);
  }
}

function read(relativePath) {
  return fs.readFileSync(absolute(relativePath), 'utf8');
}

function checkRequiredFiles() {
  for (const file of [
    'AGENTS.md',
    'CLAUDE.md',
    'scripts/context-lint.mjs',
    'scripts/sync-claude-shims.mjs',
    'scripts/sync-skills.mjs',
  ]) {
    if (!fs.existsSync(absolute(file))) error(`Required context file missing: ${file}`);
  }
}

function checkRootShim() {
  if (!fs.existsSync(absolute('CLAUDE.md'))) return;
  if (read('CLAUDE.md') !== '@AGENTS.md\n') {
    error("Root CLAUDE.md must contain exactly '@AGENTS.md'.");
  }
}

function runShimCheck(script, label) {
  if (!fs.existsSync(absolute(script))) return;
  try {
    execFileSync(process.execPath, [absolute(script), '--check'], {
      cwd: ROOT,
      stdio: 'inherit',
    });
  } catch {
    error(`${label} are missing or out of sync.`);
  }
}

function contextFiles() {
  const files = new Set(['AGENTS.md', 'CLAUDE.md', '.github/copilot-instructions.md']);

  walk(ROOT, (fullPath, name) => {
    const file = relative(fullPath);
    if (name === 'AGENTS.md' || (file.startsWith('.github/') && name.endsWith('.md'))) files.add(file);
    if (file.startsWith('.agents/skills/') && name === 'SKILL.md') files.add(file);
    if (file.startsWith('.claude/skills/') && name === 'SKILL.md') files.add(file);
  });

  return [...files].filter((file) => fs.existsSync(absolute(file)));
}

function parseSkillFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return null;
  const frontmatter = match[1];
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const rawDescription = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  const description = rawDescription?.replace(/^(['"])(.*)\1$/, '$2');
  return { name, description };
}

function checkSkills() {
  const skillsDir = absolute('.agents/skills');
  if (!fs.existsSync(skillsDir)) {
    error('.agents/skills is missing.');
    return;
  }

  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    const skillFile = `.agents/skills/${name}/SKILL.md`;
    if (!fs.existsSync(absolute(skillFile))) {
      error(`Skill directory missing SKILL.md: ${skillFile}`);
      continue;
    }

    const parsed = parseSkillFrontmatter(read(skillFile));
    if (!parsed?.name) error(`${skillFile} is missing frontmatter name.`);
    if (!parsed?.description) error(`${skillFile} is missing frontmatter description.`);
    if (parsed?.name && parsed.name !== name) error(`${skillFile} name must match its directory.`);
    if (parsed?.name && (parsed.name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parsed.name))) {
      error(`${skillFile} name must be 1-64 chars, lowercase, and kebab-case without leading/trailing or repeated hyphens.`);
    }
    if (parsed?.description && parsed.description.length > 1024) {
      error(`${skillFile} description exceeds the 1024-character Agent Skills limit.`);
    }
  }
}

function checkEncoding(files) {
  for (const file of files) {
    const content = read(file);
    if (content.includes('\uFFFD')) error(`Encoding corruption found in ${file}`);
  }
}

console.log('Running context integrity linting...');
checkRequiredFiles();
if (fs.existsSync(absolute('AGENTS.md'))) checkRootShim();
runShimCheck('scripts/sync-claude-shims.mjs', 'Claude shims');
runShimCheck('scripts/sync-skills.mjs', 'Skill shims');
checkSkills();
checkEncoding(contextFiles());

if (errors > 0) {
  console.error(`\nContext lint failed with ${errors} error(s).`);
  process.exit(1);
}
console.log('Context integrity linting passed.');
