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
const FRONTMATTER_REQUIRED = manifest.frontmatterRequired ?? [];
const INDEX_REQUIRED_REFERENCES = manifest.indexRequiredReferences ?? [];
const SKILL_VALIDATION = manifest.skillValidation ?? {
  yamlRequiredFields: [],
  markdownRequiredSections: [],
};

function relPath(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, '/');
}

function resolveRel(relativePath) {
  return path.join(ROOT, relativePath);
}

function readFile(relativePath) {
  return fs.readFileSync(resolveRel(relativePath), 'utf8');
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
  ].filter(
    (relativePath) =>
      !/(^|\/)PLAN_[^/]*\.md$/.test(relativePath) &&
      !relativePath.startsWith('docs/plans/') &&
      !relativePath.startsWith('docs/adr/'),
  );
  // PLAN_*.md, docs/plans/, and docs/adr/ are historical/append-only records that
  // intentionally reference example or since-removed paths; exclude them from link-rot checks.
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
  return target.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('@');
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
  const pathRegex =
    /`((?:\.agents|\.claude|docs\/agents|docs\/ai|docs\/adr|docs\/conventions|docs\/architecture)\/[^`]+\.md)`/g;
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

const FRESHNESS_WARN_DAYS = 180;
const FRESHNESS_ERROR_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function checkFreshness() {
  const today = new Date();
  for (const relativePath of FRONTMATTER_REQUIRED) {
    let commitDate = null;
    try {
      const stdout = execFileSync('git', ['log', '-1', '--format=%cI', '--', relativePath], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (stdout) {
        commitDate = new Date(stdout);
      }
    } catch {
      // If git is not available, skip with a warning.
    }

    if (!commitDate) {
      try {
        const tracked = execFileSync('git', ['ls-files', '--error-unmatch', relativePath], {
          cwd: ROOT,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        if (!tracked) continue;
      } catch {
        continue;
      }
      reportWarn(`${relativePath} freshness: git commit date not available. Skipping freshness check.`);
      continue;
    }

    const ageDays = Math.floor((today.getTime() - commitDate.getTime()) / MS_PER_DAY);
    if (ageDays > FRESHNESS_ERROR_DAYS) {
      reportError(
        `${relativePath} is stale: last git commit was ${ageDays} days ago (> ${FRESHNESS_ERROR_DAYS}). Re-review accuracy and commit a change.`,
      );
    } else if (ageDays > FRESHNESS_WARN_DAYS) {
      reportWarn(
        `${relativePath} is aging: last git commit was ${ageDays} days ago (> ${FRESHNESS_WARN_DAYS}).`,
      );
    }
  }
}

function checkContextIndexCoverage() {
  const index = readFile('docs/ai/index.md');
  for (const reference of INDEX_REQUIRED_REFERENCES) {
    if (!index.includes(reference)) {
      reportError(`AI context catalog is missing canonical reference: ${reference}`);
    }
  }
}

function checkWorkflowIndexNames() {
  const relativePath = 'docs/ai/index.md';
  const content = readFile(relativePath);
  const workflowsHeading = content.indexOf('## Workflows');
  if (workflowsHeading < 0) {
    reportError(`${relativePath} is missing ## Workflows.`);
    return;
  }

  const workflowSection = content.slice(workflowsHeading);
  const workflowNameRegex = /`([a-z0-9-]+)`/g;
  const allowedNonFileEntries = new Set(['agents']);
  const checked = new Set();
  let match;

  while ((match = workflowNameRegex.exec(workflowSection)) !== null) {
    const workflowName = match[1];
    if (allowedNonFileEntries.has(workflowName) || checked.has(workflowName)) continue;
    checked.add(workflowName);

    const workflowPath = `.agents/workflows/${workflowName}.md`;
    if (!fs.existsSync(resolveRel(workflowPath))) {
      reportError(
        `docs/ai/index.md lists missing workflow '${workflowName}' at line ${lineNumber(
          content,
          workflowsHeading + match.index,
        )} -> ${workflowPath}`,
      );
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

function checkProjectGraphSync() {
  // The dependency graph in docs/architecture/project-graph.md must match the
  // real workspace:* edges. Hand-edited graphs drift and under-scope blast radius.
  const graphScript = path.join(__dirname, 'sync-project-graph.mjs');
  if (!fs.existsSync(graphScript)) {
    reportWarn('sync-project-graph.mjs not found — skipping project graph sync check.');
    return;
  }
  try {
    execFileSync(process.execPath, [graphScript, '--check'], { stdio: 'inherit', cwd: ROOT });
  } catch {
    reportError(
      'docs/architecture/project-graph.md graph is out of sync. Run `bun run ai:graph:sync` and commit.',
    );
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

function checkSkillDescriptionTriggers() {
  // Skill descriptions are the model's invocation surface. Per the authoring
  // standard (.agents/skills/README.md) each must end with an explicit trigger
  // clause so the model fires the skill at the right moment. Warn, not error,
  // so the heuristic never blocks a legitimate phrasing.
  const baseDir = resolveRel('.agents/skills');
  if (!fs.existsSync(baseDir)) return;
  const triggerCue = /\buse when\b|\bwhen (?:adding|changing|the user|terminology|shaping|styling|building|working|running)\b/i;

  for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(baseDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    const end = content.indexOf('\n---', 4);
    if (end === -1) continue;
    const frontmatter = content.slice(4, end);
    const match = frontmatter.match(/^\s*description:\s*([\s\S]*?)(?:\n\w|$)/m);
    const description = match ? match[1].replace(/\s+/g, ' ').trim() : '';
    if (description && !triggerCue.test(description)) {
      reportWarn(
        `${relPath(filePath)} description has no trigger clause ("Use when …"). See .agents/skills/README.md.`,
      );
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
      reportError(
        `llms.txt references a missing path: ${candidate} at line ${lineNumber(content, match.index)}`,
      );
    }
  }
}

function collectFiles(relativeDir, extensions) {
  const dir = resolveRel(relativeDir);
  if (!fs.existsSync(dir)) return [];

  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    const entryRelativePath = relPath(entryPath);

    if (entry.isDirectory()) {
      results.push(...collectFiles(entryRelativePath, extensions));
      continue;
    }

    if (entry.isFile() && extensions.some((extension) => entry.name.endsWith(extension))) {
      results.push(entryRelativePath);
    }
  }

  return results;
}

function checkDesignTokenBoundaries() {
  const allowedTokenFiles = new Set([
    'packages/ui/src/styles/tokens.css',
    'packages/ui/src/styles/brand.css',
    'packages/ui/src/styles/theme.css',
    'packages/ui/src/styles/personalization.css',
  ]);
  // The colour-math library is the one place allowed to parse/construct oklch()
  // strings programmatically (regex + formatters), not hardcoded design colours.
  // Exempt it from the raw-colour pattern only — primitive-var rules still apply.
  const colorMathFiles = new Set([
    'packages/ui/src/lib/oklch.ts',
    'packages/ui/src/lib/apca.ts',
  ]);
  const files = [
    ...collectFiles('apps/web/src', ['.css', '.ts', '.tsx']),
    ...collectFiles('packages/ui/src', ['.css', '.ts', '.tsx']),
  ];
  const rawColorPattern = /oklch\(/g;
  const primitiveVarPattern = /var\(--(?:indigo|violet|neutral|red|emerald|amber)-/g;

  for (const relativePath of files) {
    if (allowedTokenFiles.has(relativePath)) continue;

    const content = readFile(relativePath);
    const patterns = colorMathFiles.has(relativePath)
      ? [primitiveVarPattern]
      : [rawColorPattern, primitiveVarPattern];
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        reportError(
          `Design token boundary violation in ${relativePath}:${lineNumber(content, match.index)} -> ${match[0]}`,
        );
      }
    }
  }
}

function checkUiPackageBoundaries() {
  const files = collectFiles('packages/ui/src', ['.ts', '.tsx']);
  const forbiddenImportPattern =
    /(?:from\s+['"]|import\s*\(\s*['"])(@\/|server-only|@pumni\/(?:auth|supabase|env|features|validators|config|test-utils))/g;

  for (const relativePath of files) {
    const content = readFile(relativePath);
    forbiddenImportPattern.lastIndex = 0;
    let match;
    while ((match = forbiddenImportPattern.exec(content)) !== null) {
      reportError(
        `@pumni/ui boundary violation in ${relativePath}:${lineNumber(content, match.index)} -> ${match[1]}`,
      );
    }
  }
}

console.log('Running AI context validation...');

checkRequiredFiles();
checkFrontmatter();
checkFreshness();
checkStructuredMarkdown({
  dir: '.agents/skills',
  kind: 'Skill',
  validation: SKILL_VALIDATION,
  isFileEntry: false,
});
checkSkillDescriptionTriggers();
checkAiDocSizes();
checkEntrypointSizes();
checkThinWrappers();
checkMarkdownLinks();
checkDocPathReferences();
checkGoldenExamplePaths();
checkContextIndexCoverage();
checkWorkflowIndexNames();
checkRuleInventory();
checkPackageScripts();
checkLlmsTxt();
checkDesignTokenBoundaries();
checkUiPackageBoundaries();
checkSecretsIntegration();
checkProjectGraphSync();

if (errors > 0) {
  console.error(`\nValidation failed with ${errors} error(s) and ${warnings} warning(s).`);
  process.exit(1);
}

console.log(`AI context validation passed with ${warnings} warning(s).`);
