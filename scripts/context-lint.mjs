import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', '.next', '.turbo', 'dist', 'node_modules']);
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
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
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

function agentFiles() {
  const files = new Set();

  walk(ROOT, (fullPath, name) => {
    const file = relative(fullPath);
    if (name === 'AGENTS.md' || name === 'CLAUDE.md') files.add(file);
    if (file === '.github/copilot-instructions.md') files.add(file);
    if (file.startsWith('.agents/skills/') && name === 'SKILL.md') files.add(file);
    if (file.startsWith('.claude/skills/') && name === 'SKILL.md') files.add(file);
  });

  return [...files].sort();
}

function checkBudgets(files) {
  for (const file of files) {
    if (path.basename(file) !== 'AGENTS.md') continue;
    const size = fs.statSync(absolute(file)).size;
    const budget = 4096;
    if (size > budget) error(`${file} size (${size}B) exceeds ${budget}B.`);
  }
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
      error(`${skillFile} name must be 1-64 chars, lowercase, and kebab-case.`);
    }
    if (parsed?.description && parsed.description.length > 1024) {
      error(`${skillFile} description exceeds the 1024-character Agent Skills limit.`);
    }
  }
}

function isRepositoryPath(value) {
  const candidate = value.replaceAll('\\', '/');
  if (!candidate || /\s|[*<>|]/.test(candidate)) return false;
  return /^(?:\.agents|\.claude|\.github|apps|docs|packages|scripts|supabase)(?:\/|$)/.test(candidate)
    || /^(?:AGENTS|CLAUDE|package\.json|\.mcp\.json)(?:$|\/)/.test(candidate);
}

function checkInstructionReferences(files) {
  const packageJson = JSON.parse(read('package.json'));
  const scripts = new Set(Object.keys(packageJson.scripts ?? {}));
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  const commandPattern = /\bbun\s+run\s+([a-z0-9][a-z0-9:_-]*)/gi;
  const inlinePattern = /`([^`\r\n]+)`/g;

  for (const file of files) {
    const content = read(file);
    const dir = path.dirname(absolute(file));
    let match;

    while ((match = commandPattern.exec(content))) {
      const command = match[1];
      if (!scripts.has(command)) error(`${file} references missing command: bun run ${command}`);
    }

    while ((match = linkPattern.exec(content))) {
      const href = match[1].trim().split('#')[0];
      if (!href || /^(?:https?:|mailto:|file:|#)/.test(href)) continue;
      const target = path.resolve(dir, href);
      if (!fs.existsSync(target)) error(`Broken link in ${file}: ${href}`);
    }

    while ((match = inlinePattern.exec(content))) {
      const candidate = match[1].trim();
      if (!isRepositoryPath(candidate)) continue;
      if (!fs.existsSync(absolute(candidate))) error(`Broken repository path in ${file}: ${candidate}`);
    }

    if (content.includes('\uFFFD')) error(`Encoding corruption found in ${file}`);
  }
}

console.log('Running agent context linting...');
checkRequiredFiles();

const files = agentFiles();
if (fs.existsSync(absolute('AGENTS.md'))) {
  checkRootShim();
  checkBudgets(files);
}

runShimCheck('scripts/sync-claude-shims.mjs', 'Claude shims');
runShimCheck('scripts/sync-skills.mjs', 'Skill shims');
checkSkills();
checkInstructionReferences(files);

if (errors > 0) {
  console.error(`\nContext lint failed with ${errors} error(s).`);
  process.exit(1);
}

console.log(`Agent context linting passed (${files.length} active instruction files).`);
