import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { RULES } from './review-gate-rules.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DOCS_AI = path.join(ROOT, 'docs', 'ai');

let errors = 0;
let warnings = 0;

const MANIFEST_PATH = path.resolve(ROOT, 'scripts', 'ai-context.manifest.json');
let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
} catch (err) {
  console.error(`[ERROR] Failed to load ai-context.manifest.json: ${err.message}`);
  process.exit(1);
}

const REQUIRED_FILES = manifest.requiredFiles ?? [];
const THIN_WRAPPERS = manifest.thinWrappers ?? [];
const REQUIRED_PACKAGE_SCRIPTS = manifest.requiredPackageScripts ?? [];
const REQUIRED_AIIGNORE_PATTERNS = manifest.requiredAiIgnorePatterns ?? [];
const FRONTMATTER_REQUIRED = manifest.frontmatterRequired ?? [];
const INDEX_REQUIRED_REFERENCES = manifest.indexRequiredReferences ?? [];
const SKILL_VALIDATION = manifest.skillValidation ?? { yamlRequiredFields: [], markdownRequiredSections: [] };
const EVAL_VALIDATION = manifest.evalValidation ?? { yamlRequiredFields: [], markdownRequiredSections: [] };

function relPath(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, '/');
}

function resolveRel(relativePath) {
  return path.join(ROOT, relativePath);
}

function readFile(relativePath) {
  return fs.readFileSync(resolveRel(relativePath), 'utf8');
}

function parseFrontmatter(relativePath) {
  const content = readFile(relativePath);
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return null;
  const end = content.indexOf('\n---', 4);
  if (end === -1) return null;

  const frontmatter = {};
  for (const rawLine of content.slice(4, end).split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(rawLine);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.trim();
    if (value === 'true') {
      frontmatter[key] = true;
    } else if (value === 'false') {
      frontmatter[key] = false;
    } else if (value.startsWith('[') && value.endsWith(']')) {
      frontmatter[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

function reportError(message) {
  console.error(`[ERROR] ${message}`);
  errors++;
}

function reportWarn(message) {
  console.warn(`[WARN] ${message}`);
  warnings++;
}

function lineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function collectMarkdownFiles(relativeDir) {
  const dir = resolveRel(relativeDir);
  if (!fs.existsSync(dir)) return [];

  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    const entryRelativePath = relPath(entryPath);

    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(entryRelativePath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(entryRelativePath);
    }
  }

  return results;
}

function getMarkdownLinkFiles() {
  return [
    'AGENTS.md',
    'CLAUDE.md',
    'GEMINI.md',
    'llms.txt',
    ...collectMarkdownFiles('docs'),
    ...collectMarkdownFiles('.agents'),
    ...collectMarkdownFiles('.github'),
    ...collectMarkdownFiles('.claude'),
  ].filter((relativePath) => !/(^|\/)PLAN_[^/]*\.md$/.test(relativePath));
  // PLAN_*.md are meta/historical planning docs that intentionally reference
  // example or not-yet-created paths; exclude them from link-rot checks.
}

function checkRequiredFiles() {
  for (const relativePath of REQUIRED_FILES) {
    if (!fs.existsSync(resolveRel(relativePath))) {
      reportError(`Required AI context file is missing: ${relativePath}`);
    }
  }
}

function checkAiDocSizes() {
  if (!fs.existsSync(DOCS_AI)) return;
  const limit = 5000;
  for (const fileName of fs.readdirSync(DOCS_AI)) {
    if (!fileName.endsWith('.md')) continue;
    const filePath = path.join(DOCS_AI, fileName);
    const stats = fs.statSync(filePath);
    if (stats.size > limit) {
      reportWarn(`AI context file is large (${stats.size} bytes): ${relPath(filePath)}`);
    }
  }
}

function checkEntrypointSizes() {
  const agentPath = resolveRel('AGENTS.md');
  if (!fs.existsSync(agentPath)) return;
  const stats = fs.statSync(agentPath);
  if (stats.size > 6500) {
    reportWarn(`AGENTS.md is large (${stats.size} bytes). Keep detailed guidance in docs/.`);
  }
}

function checkThinWrappers() {
  for (const wrapper of THIN_WRAPPERS) {
    const filePath = resolveRel(wrapper.path);
    if (!fs.existsSync(filePath)) continue;

    const stats = fs.statSync(filePath);
    if (stats.size > wrapper.maxBytes) {
      reportError(`Compatibility wrapper is too large (${stats.size} bytes): ${wrapper.path}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    for (const requiredText of wrapper.requiredText) {
      if (!content.includes(requiredText)) {
        reportError(`${wrapper.path} must route to ${requiredText}`);
      }
    }
  }
}

function normalizeMarkdownTarget(target) {
  const cleanTarget = target.trim().replace(/^<|>$/g, '').split('#')[0];
  return cleanTarget.replaceAll('\\', '/');
}

function isExternalOrAnchor(target) {
  return (
    target.startsWith('#') ||
    /^[a-z][a-z0-9+.-]*:/i.test(target) ||
    target.startsWith('@')
  );
}

function checkMarkdownLinks() {
  const markdownLinkRegex = /(?<!!)\[[^\]]+\]\(([^)]+)\)/g;

  for (const relativePath of getMarkdownLinkFiles()) {
    const sourcePath = resolveRel(relativePath);
    if (!fs.existsSync(sourcePath)) continue;

    const content = fs.readFileSync(sourcePath, 'utf8');
    let match;

    while ((match = markdownLinkRegex.exec(content)) !== null) {
      const rawTarget = match[1];
      if (isExternalOrAnchor(rawTarget)) continue;

      const normalizedTarget = normalizeMarkdownTarget(rawTarget);
      if (!normalizedTarget) continue;

      const resolvedTarget = normalizedTarget.startsWith('/')
        ? path.join(ROOT, normalizedTarget.slice(1))
        : path.resolve(path.dirname(sourcePath), normalizedTarget);

      if (!resolvedTarget.startsWith(ROOT) || !fs.existsSync(resolvedTarget)) {
        reportError(
          `Markdown link target does not exist in ${relativePath}:${lineNumber(content, match.index)} -> ${rawTarget}`,
        );
      }
    }
  }
}

function checkDocPathReferences() {
  // Catch dangling backtick-quoted repo doc paths in prose (renamed/deleted docs)
  // that the markdown-link checker misses. Globbed paths (containing '*') are skipped.
  const pathRegex = /`((?:\.agents|\.claude|docs\/ai|docs\/adr|docs\/conventions|docs\/architecture)\/[^`]+\.md)`/g;
  const checked = new Set();

  for (const relativePath of getMarkdownLinkFiles()) {
    const sourcePath = resolveRel(relativePath);
    if (!fs.existsSync(sourcePath)) continue;

    const content = fs.readFileSync(sourcePath, 'utf8');
    let match;

    while ((match = pathRegex.exec(content)) !== null) {
      const candidate = match[1].split('#')[0];
      if (candidate.includes('*') || candidate.includes('<')) continue;

      const key = `${relativePath}::${candidate}`;
      if (checked.has(key)) continue;
      checked.add(key);

      if (!fs.existsSync(resolveRel(candidate))) {
        reportError(
          `Doc path reference does not exist in ${relativePath}:${lineNumber(content, match.index)} -> ${candidate}`,
        );
      }
    }
  }
}

function checkPackageScripts() {
  const packageJson = JSON.parse(readFile('package.json'));
  const scripts = packageJson.scripts ?? {};

  for (const scriptName of REQUIRED_PACKAGE_SCRIPTS) {
    if (!Object.hasOwn(scripts, scriptName)) {
      reportError(`package.json is missing documented script: ${scriptName}`);
    }
  }
}

function checkAiIgnoreCoverage() {
  const lines = readFile('.aiignore')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  const patterns = new Set(lines);

  for (const requiredPattern of REQUIRED_AIIGNORE_PATTERNS) {
    if (!patterns.has(requiredPattern)) {
      reportError(`.aiignore is missing required pattern: ${requiredPattern}`);
    }
  }
}

function checkFrontmatter() {
  for (const relativePath of FRONTMATTER_REQUIRED) {
    const filePath = resolveRel(relativePath);
    if (!fs.existsSync(filePath)) {
      reportError(`Frontmatter check references a missing file: ${relativePath}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
      reportError(`${relativePath} is missing YAML frontmatter (must start with '---').`);
      continue;
    }
    const end = content.indexOf('\n---', 4);
    if (end === -1) {
      reportError(`${relativePath} has an unterminated frontmatter block.`);
      continue;
    }
    const frontmatter = content.slice(4, end);
    if (!/^\s*description:\s*\S+/m.test(frontmatter)) {
      reportError(`${relativePath} frontmatter is missing 'description:'`);
    }
    if (!/^\s*when-to-load:\s*\S+/m.test(frontmatter)) {
      reportError(`${relativePath} frontmatter is missing 'when-to-load:'`);
    }
  }
}

function checkContextIndexCoverage() {
  const index = readFile('docs/ai/index.md');
  for (const reference of INDEX_REQUIRED_REFERENCES) {
    if (!index.includes(reference)) {
      reportError(`docs/ai/index.md is missing canonical reference: ${reference}`);
    }
  }
}

function checkTaskRoutes() {
  // Task routes are optional (added on demand). Validate only those that exist.
  const routesDir = resolveRel('docs/ai/task-routes');
  if (!fs.existsSync(routesDir)) return;

  const index = readFile('docs/ai/index.md');
  for (const fileName of fs.readdirSync(routesDir)) {
    if (!fileName.endsWith('.md')) continue;
    const route = `docs/ai/task-routes/${fileName}`;
    if (!index.includes('docs/ai/task-routes')) {
      reportError(`docs/ai/index.md must reference docs/ai/task-routes when routes exist.`);
    }
    const content = readFile(route);
    if (content.length > 4000) {
      reportError(`${route} is too large; route to canonical docs instead of duplicating them.`);
    }
  }
}

function checkSecretsIntegration() {
  const secretsScript = path.join(__dirname, 'check-secrets.mjs');
  if (!fs.existsSync(secretsScript)) {
    reportWarn('check-secrets.mjs not found — skipping secrets scan.');
    return;
  }
  try {
    execFileSync(process.execPath, [secretsScript], { stdio: 'inherit', cwd: ROOT });
  } catch {
    reportError('check-secrets.mjs reported one or more findings — fix before proceeding.');
  }
}

function checkStructuredMarkdown({ dir, kind, validation, isFileEntry }) {
  const baseDir = resolveRel(dir);
  if (!fs.existsSync(baseDir)) return;

  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    let filePath;
    if (isFileEntry) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      filePath = path.join(baseDir, entry.name);
    } else {
      if (!entry.isDirectory()) continue;
      filePath = path.join(baseDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(filePath)) {
        reportError(`${kind} is missing SKILL.md in ${relPath(path.join(baseDir, entry.name))}`);
        continue;
      }
    }

    const relativePath = relPath(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
      reportError(`${relativePath} is missing YAML frontmatter (must start with '---').`);
      continue;
    }
    const end = content.indexOf('\n---', 4);
    if (end === -1) {
      reportError(`${relativePath} has an unterminated frontmatter block.`);
      continue;
    }

    const frontmatter = content.slice(4, end);
    for (const field of validation.yamlRequiredFields ?? []) {
      if (!new RegExp(`^\\s*${field}:\\s*\\S+`, 'm').test(frontmatter)) {
        reportError(`${relativePath} frontmatter is missing required field '${field}:'`);
      }
    }
    if (!/^\s*#\s+\S+/m.test(content.slice(end + 4))) {
      reportError(`${relativePath} is missing a main title (H1 header '# <Title>').`);
    }
    for (const section of validation.markdownRequiredSections ?? []) {
      if (!new RegExp(`^\\s*##\\s+${section}\\b`, 'm').test(content)) {
        reportError(`${relativePath} is missing required section '## ${section}'`);
      }
    }
  }
}

function collectEvalFiles() {
  const evalDir = resolveRel('.agents/evals');
  if (!fs.existsSync(evalDir)) return [];
  return fs.readdirSync(evalDir)
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => `.agents/evals/${fileName}`)
    .sort();
}

function checkEvalRuleMapping() {
  const ruleIds = new Set(Object.values(RULES));

  for (const relativePath of collectEvalFiles()) {
    const frontmatter = parseFrontmatter(relativePath);
    if (!frontmatter) continue;

    const automatedRule = frontmatter['automated-rule'];
    const isManual = frontmatter.manual === true;
    if (!automatedRule && !isManual) {
      reportError(`${relativePath} must declare automated-rule: <rule-id> or manual: true.`);
    }
    if (automatedRule && !ruleIds.has(automatedRule)) {
      reportError(`${relativePath} automated-rule references unknown static rule: ${automatedRule}`);
    }

    const coveredRules = frontmatter['covered-rules'] ?? [];
    if (!Array.isArray(coveredRules)) {
      reportError(`${relativePath} covered-rules must be an inline YAML array.`);
      continue;
    }
    for (const ruleId of coveredRules) {
      if (!ruleIds.has(ruleId)) {
        reportError(`${relativePath} covered-rules references unknown static rule: ${ruleId}`);
      }
    }
  }
}

function checkRuleInventory() {
  const inventoryPath = '.agents/workflows/review-gate.md';
  const content = readFile(inventoryPath);
  const headingIndex = content.indexOf('## Static Rule Inventory');
  if (headingIndex < 0) {
    reportError(`${inventoryPath} is missing ## Static Rule Inventory.`);
    return;
  }

  const inventory = content.slice(headingIndex);
  for (const ruleId of Object.values(RULES)) {
    if (!inventory.includes(`\`${ruleId}\``)) {
      reportError(`${inventoryPath} Static Rule Inventory is missing rule id: ${ruleId}`);
    }
  }
}

function checkGoldenExamplePaths() {
  const relativePath = 'docs/ai/golden-examples.md';
  const content = readFile(relativePath);
  const pathRegex = /`([^`]+)`/g;
  const checked = new Set();
  let match;

  while ((match = pathRegex.exec(content)) !== null) {
    const candidate = match[1].trim().split('#')[0];
    if (!/^(?:apps|packages|supabase|docs|\.agents)\//.test(candidate)) continue;
    if (candidate.includes('*') || candidate.includes('<')) continue;
    if (checked.has(candidate)) continue;
    checked.add(candidate);

    if (!fs.existsSync(resolveRel(candidate))) {
      reportError(
        `Golden example path does not exist in ${relativePath}:${lineNumber(content, match.index)} -> ${candidate}`,
      );
    }
  }
}

function checkLlmsTxt() {
  const llmsPath = resolveRel('llms.txt');
  if (!fs.existsSync(llmsPath)) {
    reportError('llms.txt is missing from root.');
    return;
  }
  const content = fs.readFileSync(llmsPath, 'utf8');
  const pathRegex = /(?:\s|^)(\/[\w.-]+(?:\/[\w.-]+)*\/?)/g;
  let match;
  while ((match = pathRegex.exec(content)) !== null) {
    const candidate = match[1];
    const relativePath = candidate.slice(1);
    if (!fs.existsSync(resolveRel(relativePath))) {
      reportError(`llms.txt references a missing path: ${candidate} at line ${lineNumber(content, match.index)}`);
    }
  }
}

console.log('Running AI context validation...');

checkRequiredFiles();
checkFrontmatter();
checkStructuredMarkdown({ dir: '.agents/skills', kind: 'Skill', validation: SKILL_VALIDATION, isFileEntry: false });
checkStructuredMarkdown({ dir: '.agents/evals', kind: 'Eval', validation: EVAL_VALIDATION, isFileEntry: true });
checkEvalRuleMapping();
checkAiDocSizes();
checkEntrypointSizes();
checkThinWrappers();
checkMarkdownLinks();
checkDocPathReferences();
checkGoldenExamplePaths();
checkContextIndexCoverage();
checkTaskRoutes();
checkRuleInventory();
checkPackageScripts();
checkAiIgnoreCoverage();
checkLlmsTxt();
checkSecretsIntegration();

if (errors > 0) {
  console.error(`\nValidation failed with ${errors} error(s) and ${warnings} warning(s).`);
  process.exit(1);
}

console.log(`AI context validation passed with ${warnings} warning(s).`);
