import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let errors = 0;
let warnings = 0;
function reportError(msg) {
  console.error(`[ERROR] ${msg}`);
  errors++;
}

function resolveRel(relativePath) {
  return path.join(ROOT, relativePath);
}

const REQUIRED_ENTRYPOINTS = [
  'AGENTS.md',
  'CLAUDE.md',
  '.mcp.json',
  '.github/copilot-instructions.md',
  'scripts/context-lint.mjs',
  'scripts/policy-check.mjs',
  'scripts/sync-skills.mjs',
];

function checkRequiredFiles() {
  for (const rel of REQUIRED_ENTRYPOINTS) {
    const full = resolveRel(rel);
    if (!fs.existsSync(full)) {
      reportError(`Required entrypoint missing: ${rel}`);
    }
  }
}

function checkAlwaysLoadedSize() {
  const rootAgents = resolveRel('AGENTS.md');
  if (fs.existsSync(rootAgents)) {
    const stat = fs.statSync(rootAgents);
    if (stat.size > 8000) {
      reportError(`AGENTS.md size (${stat.size}B) exceeds maximum budget of 8000B.`);
    }
  }
}

function checkSkillShimsSync() {
  const syncScript = path.join(__dirname, 'sync-skills.mjs');
  if (fs.existsSync(syncScript)) {
    try {
      execFileSync(process.execPath, [syncScript, '--check'], { stdio: 'inherit', cwd: ROOT });
    } catch {
      reportError('.claude/skills shims are out of sync with .agents/skills. Run `bun run skills:sync`.');
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

function collectActiveContextFiles() {
  const files = new Set([
    'AGENTS.md',
    'CLAUDE.md',
    '.github/copilot-instructions.md',
    'docs/ai/mcp.md',
  ]);

  // Discover all AGENTS.md dynamically
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.turbo') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name === 'AGENTS.md') {
        files.add(path.relative(ROOT, fullPath).replaceAll(path.sep, '/'));
      }
    }
  }
  scanDir(ROOT);

  // Add active skills
  const agentsSkillsDir = resolveRel('.agents/skills');
  if (fs.existsSync(agentsSkillsDir)) {
    for (const entry of fs.readdirSync(agentsSkillsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const skillFile = `.agents/skills/${entry.name}/SKILL.md`;
        if (fs.existsSync(resolveRel(skillFile))) {
          files.add(skillFile);
        }
      }
    }
  }

  // Add convention docs
  const convDir = resolveRel('docs/conventions');
  if (fs.existsSync(convDir)) {
    for (const entry of fs.readdirSync(convDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.add(`docs/conventions/${entry.name}`);
      }
    }
  }

  return Array.from(files);
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
    const nameMatch = frontmatter.match(/^\s*name:\s*(\S+)/m);
    const descMatch = frontmatter.match(/^\s*description:\s*(.+)$/m);

    if (!nameMatch) {
      reportError(`.agents/skills/${entry.name}/SKILL.md frontmatter missing 'name:'`);
    } else {
      const name = nameMatch[1];
      if (name !== entry.name) {
        reportError(`.agents/skills/${entry.name}/SKILL.md 'name: ${name}' does not match directory name '${entry.name}'`);
      }
      if (!/^[a-z0-9-]+$/.test(name)) {
        reportError(`.agents/skills/${entry.name}/SKILL.md 'name: ${name}' must be lowercase kebab-case.`);
      }
    }

    if (!descMatch || !descMatch[1].trim()) {
      reportError(`.agents/skills/${entry.name}/SKILL.md frontmatter missing non-empty 'description:'`);
    } else if (descMatch[1].trim().length > 500) {
      reportError(`.agents/skills/${entry.name}/SKILL.md description is too long (>500 chars).`);
    }
  }
}

function checkActiveContextCommandsAndLinks(contextFiles) {
  const pkgPath = resolveRel('package.json');
  const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : {};
  const rootScripts = new Set(Object.keys(pkg.scripts ?? {}));

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const commandRegex = /bun\s+run\s+([a-z0-9:-]+)/g;

  for (const relDoc of contextFiles) {
    const fullDoc = resolveRel(relDoc);
    if (!fs.existsSync(fullDoc)) continue;
    const content = fs.readFileSync(fullDoc, 'utf8');
    const docDir = path.dirname(fullDoc);

    // 1. Check referenced bun run commands
    let cmdMatch;
    while ((cmdMatch = commandRegex.exec(content)) !== null) {
      const scriptName = cmdMatch[1];
      if (!rootScripts.has(scriptName)) {
        reportError(`Active context file '${relDoc}' references non-existent command 'bun run ${scriptName}'`);
      }
    }

    // 2. Check relative markdown links
    let linkMatch;
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      const href = linkMatch[2].trim();
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

function checkEncodingHygiene(contextFiles) {
  for (const rel of contextFiles) {
    const full = resolveRel(rel);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, 'utf8');
    if (content.includes('\uFFFD')) {
      reportError(`Encoding corruption (U+FFFD replacement char) found in ${rel}`);
    }
  }
}

console.log('Running AI context linting...');

const activeFiles = collectActiveContextFiles();

checkRequiredFiles();
checkAlwaysLoadedSize();
checkSkillShimsSync();
checkClaudeShims();
checkSkillFrontmatter();
checkActiveContextCommandsAndLinks(activeFiles);
checkEncodingHygiene(activeFiles);

if (errors > 0) {
  console.error(`\nContext lint failed with ${errors} error(s) and ${warnings} warning(s).`);
  process.exit(1);
}

console.log(`AI context linting passed with ${warnings} warning(s).`);
