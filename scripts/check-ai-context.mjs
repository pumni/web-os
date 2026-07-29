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
  const syncScript = path.join(__dirname, 'sync-skills.mjs');
  if (fs.existsSync(syncScript)) {
    try {
      execFileSync(process.execPath, [syncScript, '--check'], { stdio: 'inherit', cwd: ROOT });
    } catch {
      reportError('.claude/skills shims are out of sync with .agents/skills. Run `bun run ai:skills:sync`.');
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
    'apps/web/AGENTS.md',
    'apps/catalog/AGENTS.md',
    'packages/ui/AGENTS.md',
    'packages/supabase/AGENTS.md',
    'packages/auth/AGENTS.md',
    'packages/config/AGENTS.md',
    'packages/env/AGENTS.md',
    'packages/test-utils/AGENTS.md',
    'packages/validators/AGENTS.md',
    'docs/ai/golden-examples.md',
    'docs/ai/mcp.md',
    '.agents/skills/README.md',
  ]);

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

  // Add referenced convention/architecture docs
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

console.log('Running AI context validation...');

const activeFiles = collectActiveContextFiles();

checkRequiredFiles();
checkPackageScripts();
checkAlwaysLoadedSize();
checkSkillShimsSync();
checkClaudeShims();
checkSkillFrontmatter();
checkActiveContextCommandsAndLinks(activeFiles);
checkEncodingHygiene(activeFiles);

if (errors > 0) {
  console.error(`\nValidation failed with ${errors} error(s) and ${warnings} warning(s).`);
  process.exit(1);
}

console.log(`AI context validation passed with ${warnings} warning(s).`);
