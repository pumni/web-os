import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let errors = 0;
let warnings = 0;

function reportError(msg) {
  console.error(`[ERROR] ${msg}`);
  errors++;
}

function reportWarn(msg) {
  console.warn(`[WARN] ${msg}`);
  warnings++;
}

function relPath(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, '/');
}

function resolveRel(relativePath) {
  return path.join(ROOT, relativePath);
}

const MANIFEST_PATH = path.resolve(ROOT, 'scripts', 'ai-context.manifest.json');
let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
} catch (err) {
  console.error(`[ERROR] Failed to load ai-context.manifest.json: ${err.message}`);
  process.exit(1);
}

function checkRequiredFiles() {
  for (const rel of manifest.requiredFiles ?? []) {
    const full = resolveRel(rel);
    if (!fs.existsSync(full)) {
      reportError(`Required context file missing: ${rel}`);
    }
  }
}

function checkPackageScripts() {
  const pkgPath = resolveRel('package.json');
  if (!fs.existsSync(pkgPath)) return;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const scripts = pkg.scripts ?? {};
  for (const s of manifest.requiredPackageScripts ?? []) {
    if (!scripts[s]) {
      reportError(`Missing required package.json script: "${s}"`);
    }
  }
}

function checkAlwaysLoadedSize() {
  for (const budget of manifest.sizeBudgets ?? []) {
    const fullPath = resolveRel(budget.path);
    if (!fs.existsSync(fullPath)) continue;
    const stat = fs.statSync(fullPath);
    if (stat.size > budget.maxBytes) {
      reportError(`${budget.path} size (${stat.size}B) exceeds max budget of ${budget.maxBytes}B.`);
    }
  }
}

function checkSkillShimsSync() {
  const agentsSkillsDir = resolveRel('.agents/skills');
  if (!fs.existsSync(agentsSkillsDir)) return;

  const entries = fs.readdirSync(agentsSkillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const canonicalPath = path.join(agentsSkillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(canonicalPath)) continue;

    const shimPath = resolveRel(`.claude/skills/${entry.name}/SKILL.md`);
    if (!fs.existsSync(shimPath)) {
      reportError(`Missing Claude skill shim: .claude/skills/${entry.name}/SKILL.md (run bun run ai:skills:sync)`);
      continue;
    }

    const canonical = fs.readFileSync(canonicalPath, 'utf8');
    const shim = fs.readFileSync(shimPath, 'utf8');

    const canonicalDescMatch = canonical.match(/^description:\s*(.+)$/m);
    const shimDescMatch = shim.match(/^description:\s*(.+)$/m);

    if (canonicalDescMatch && shimDescMatch) {
      if (canonicalDescMatch[1].trim() !== shimDescMatch[1].trim()) {
        reportError(`Skill shim description mismatch for '${entry.name}'. Run 'bun run ai:skills:sync'.`);
      }
    }
  }
}

function checkClaudeShims() {
  const rootClaude = resolveRel('CLAUDE.md');
  if (fs.existsSync(rootClaude)) {
    const content = fs.readFileSync(rootClaude, 'utf8').trim();
    if (!content.includes('@AGENTS.md')) {
      reportError("Root CLAUDE.md must point to '@AGENTS.md'.");
    }
  }
}

function checkSkillFrontmatter() {
  const agentsSkillsDir = resolveRel('.agents/skills');
  if (!fs.existsSync(agentsSkillsDir)) return;

  const entries = fs.readdirSync(agentsSkillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(agentsSkillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      reportError(`Skill directory missing SKILL.md: .agents/skills/${entry.name}`);
      continue;
    }

    const content = fs.readFileSync(skillPath, 'utf8');
    if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
      reportError(`.agents/skills/${entry.name}/SKILL.md is missing YAML frontmatter.`);
      continue;
    }

    const end = content.indexOf('\n---', 4);
    if (end === -1) {
      reportError(`.agents/skills/${entry.name}/SKILL.md has unterminated frontmatter.`);
      continue;
    }

    const frontmatter = content.slice(4, end);
    if (!/^\s*name:\s*\S+/m.test(frontmatter)) {
      reportError(`.agents/skills/${entry.name}/SKILL.md frontmatter missing 'name:'`);
    }
    if (!/^\s*description:\s*\S+/m.test(frontmatter)) {
      reportError(`.agents/skills/${entry.name}/SKILL.md frontmatter missing 'description:'`);
    }
  }
}

function checkMarkdownLinks() {
  const docFiles = [
    'AGENTS.md',
    'apps/web/AGENTS.md',
    'packages/ui/AGENTS.md',
    'packages/supabase/AGENTS.md',
    'docs/ai/golden-examples.md',
    'docs/ai/mcp.md',
    '.agents/skills/README.md',
  ];

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  for (const relDoc of docFiles) {
    const fullDoc = resolveRel(relDoc);
    if (!fs.existsSync(fullDoc)) continue;
    const content = fs.readFileSync(fullDoc, 'utf8');
    const docDir = path.dirname(fullDoc);

    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[2].trim();
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#') || href.startsWith('file://')) {
        continue;
      }
      const cleanPath = href.split('#')[0];
      if (!cleanPath) continue;

      const targetPath = path.resolve(docDir, cleanPath);
      if (!fs.existsSync(targetPath)) {
        reportError(`Broken relative link in ${relDoc}: ${href} -> file not found.`);
      }
    }
  }
}

function checkEncodingHygiene() {
  const checkFiles = [
    'AGENTS.md',
    'CLAUDE.md',
    'apps/web/AGENTS.md',
    'packages/ui/AGENTS.md',
  ];
  for (const rel of checkFiles) {
    const full = resolveRel(rel);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, 'utf8');
    if (content.includes('\uFFFD')) {
      reportError(`Encoding corruption (U+FFFD replacement char) found in ${rel}`);
    }
  }
}

console.log('Running AI context validation...');

checkRequiredFiles();
checkPackageScripts();
checkAlwaysLoadedSize();
checkSkillShimsSync();
checkClaudeShims();
checkSkillFrontmatter();
checkMarkdownLinks();
checkEncodingHygiene();

if (errors > 0) {
  console.error(`\nValidation failed with ${errors} error(s) and ${warnings} warning(s).`);
  process.exit(1);
}

console.log(`AI context validation passed with ${warnings} warning(s).`);
