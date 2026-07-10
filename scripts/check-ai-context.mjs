// fallow-ignore-file code-duplication -- Intentional: script helpers are procedurally isolated to prevent cross-script dependencies on internal utilities
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const selfTest = args.includes('--self-test');

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
const REQUIRED_EXISTING_PATHS = manifest.requiredExistingPaths ?? [];
const REQUIRED_PACKAGE_SCRIPTS = manifest.requiredPackageScripts ?? [];
const FRONTMATTER_REQUIRED = manifest.frontmatterRequired ?? [];
const INDEX_REQUIRED_REFERENCES = manifest.indexRequiredReferences ?? [];
const SIZE_BUDGETS = manifest.sizeBudgets ?? [];
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
    ...collectMarkdownFiles('docs'),
    ...collectMarkdownFiles('.agents'),
    ...collectMarkdownFiles('.github'),
    ...collectMarkdownFiles('.claude'),
  ].filter(
    (relativePath) =>
      !/(^|\/)PLAN_[^/]*\.md$/.test(relativePath) &&
      !relativePath.startsWith('docs/plans/') &&
      !relativePath.startsWith('docs/research/') &&
      !relativePath.startsWith('docs/adr/'),
  );
  // PLAN_*.md, docs/plans/, docs/research/, and docs/adr/ are historical/append-only
  // records that intentionally reference example, proposed, or since-removed paths;
  // exclude them from link-rot checks.
}

function checkRequiredFiles() {
  for (const relativePath of REQUIRED_FILES) {
    if (!fs.existsSync(resolveRel(relativePath))) {
      reportError(`Required AI context file is missing: ${relativePath}`);
    }
  }
}

function checkRequiredExistingPaths() {
  for (const relativePath of REQUIRED_EXISTING_PATHS) {
    if (!fs.existsSync(resolveRel(relativePath))) {
      reportError(`Required path cited in context does not exist on disk: ${relativePath}`);
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

// Hard size ceiling for high-traffic context files. Budgets
// live in the manifest (`sizeBudgets`) with headroom over current size; trim the
// doc rather than raise the budget when it trips.
function checkSizeBudgets() {
  for (const budget of SIZE_BUDGETS) {
    const filePath = resolveRel(budget.path);
    if (!fs.existsSync(filePath)) continue;
    const stats = fs.statSync(filePath);
    if (stats.size > budget.maxBytes) {
      reportError(
        `${budget.path} exceeds its size budget (${stats.size} > ${budget.maxBytes} bytes). Trim it — do not raise the budget.`,
      );
    }
  }
}

// Enforce compact style for markdown tables in size-budgeted context files
// to prevent table padding from inflating file sizes.
function checkCompactMarkdownTables() {
  for (const budget of SIZE_BUDGETS) {
    const filePath = resolveRel(budget.path);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) continue;

      // Table rows must start and end with a pipe
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
        const isSeparator = /^[|:\s-]+$/.test(trimmed);

        if (isSeparator) {
          // Separator row must be compact (at most 3 hyphens per cell, e.g. |---| or | --- |)
          if (/----/.test(trimmed) || /  /.test(trimmed)) {
            reportError(
              `Padded markdown separator row detected in ${budget.path}:${i + 1}. Ensure separator is compact (e.g. '|---|---|').`,
            );
          }
        } else {
          // Data or header cells must not contain 2 or more consecutive spaces
          const cells = line.split('|').slice(1, -1);
          for (let cellIdx = 0; cellIdx < cells.length; cellIdx++) {
            const cell = cells[cellIdx];
            if (/ {2,}/.test(cell)) {
              reportError(
                `Padded markdown table cell detected in ${budget.path}:${i + 1} (cell ${cellIdx + 1}). Avoid 2 or more consecutive spaces.`,
              );
              break;
            }
          }
        }
      }
    }
  }
}

function runSelfTest() {
  console.log('Running self-test for compact markdown table validation...');
  const tests = [
    {
      name: 'Valid compact table',
      content: `
| Need | Load |
|---|---|
| Architecture | \`docs/architecture/overview.md\` |
| Data fetching | \`docs/conventions/data-fetching.md\` |
`,
      expectedErrors: 0,
    },
    {
      name: 'Padded separator row (too many hyphens)',
      content: `
| Need | Load |
| ------- | ------- |
| Architecture | \`docs/architecture/overview.md\` |
`,
      expectedErrors: 1,
    },
    {
      name: 'Padded separator row (double spaces)',
      content: `
| Need | Load |
|  ---  |  ---  |
| Architecture | \`docs/architecture/overview.md\` |
`,
      expectedErrors: 1,
    },
    {
      name: 'Padded cell (extra space at end)',
      content: `
| Need         | Load |
|---|---|
| Architecture | \`docs/architecture/overview.md\` |
`,
      expectedErrors: 1,
    },
    {
      name: 'Double space inside cell text',
      content: `
| Need | Load |
|---|---|
| Architecture  docs | \`docs/architecture/overview.md\` |
`,
      expectedErrors: 1,
    },
    {
      name: 'Pipes inside code blocks with spaces should be ignored',
      content: `
\`\`\`typescript
const x = a ||  b;
const y = " |  | ";
\`\`\`
| Need | Load |
|---|---|
| Architecture | \`docs/architecture/overview.md\` |
`,
      expectedErrors: 0,
    },
  ];

  let selfTestErrors = 0;

  for (const t of tests) {
    let mockErrors = 0;
    const originalReportError = reportError;
    reportError = (msg) => {
      mockErrors++;
    };

    const lines = t.content.split(/\r?\n/);
    let inCodeBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
        const isSeparator = /^[|:\s-]+$/.test(trimmed);
        if (isSeparator) {
          if (/----/.test(trimmed) || /  /.test(trimmed)) {
            reportError(`Padded separator`);
          }
        } else {
          const cells = line.split('|').slice(1, -1);
          for (let cellIdx = 0; cellIdx < cells.length; cellIdx++) {
            const cell = cells[cellIdx];
            if (/ {2,}/.test(cell)) {
              reportError(`Padded cell`);
              break;
            }
          }
        }
      }
    }

    reportError = originalReportError;

    if (mockErrors !== t.expectedErrors) {
      console.error(
        `[FAIL] Test "${t.name}" failed. Expected ${t.expectedErrors} errors, got ${mockErrors}.`,
      );
      selfTestErrors++;
    } else {
      console.log(`[PASS] ${t.name}`);
    }
  }

  if (selfTestErrors > 0) {
    console.error('Self-test failed!');
    process.exit(1);
  } else {
    console.log('Self-test passed successfully!');
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

function checkCodeReferences() {
  // Backtick refs to real source files (and optional `#symbol` anchors) in the
  // enforced docs. checkDocPathReferences only covers `.md`, so a golden-example
  // or convention pointing at a renamed/deleted code path — or a since-renamed
  // exported symbol inside a still-living file — slips through. This closes that
  // semantic-drift gap deterministically: file must exist; if `#symbol` is given,
  // the symbol must still appear in the file. Use `path.ts#exportedName` to opt in.
  const refRegex =
    /`((?:apps|packages|supabase|scripts)\/[^`\s]+\.(?:ts|tsx|sql|mjs|css))(#[A-Za-z_][A-Za-z0-9_]*)?`/g;
  const checked = new Set();

  for (const relativePath of getMarkdownLinkFiles()) {
    const sourcePath = resolveRel(relativePath);
    if (!fs.existsSync(sourcePath)) continue;

    const content = fs.readFileSync(sourcePath, 'utf8');
    let match;

    while ((match = refRegex.exec(content)) !== null) {
      const candidate = match[1];
      const symbol = match[2] ? match[2].slice(1) : null;
      if (candidate.includes('*') || candidate.includes('<') || candidate.includes('${')) continue;

      const key = `${relativePath}::${candidate}${symbol ? `#${symbol}` : ''}`;
      if (checked.has(key)) continue;
      checked.add(key);

      const targetPath = resolveRel(candidate);
      if (!fs.existsSync(targetPath)) {
        reportError(
          `Code path reference does not exist in ${relativePath}:${lineNumber(content, match.index)} -> ${candidate}`,
        );
        continue;
      }

      if (symbol) {
        const fileContent = fs.readFileSync(targetPath, 'utf8');
        if (!new RegExp(`\\b${symbol}\\b`).test(fileContent)) {
          reportError(
            `Symbol '${symbol}' not found in ${candidate} (referenced from ${relativePath}:${lineNumber(content, match.index)})`,
          );
        }
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
  }
}



function checkSkillShimsSync() {
  // The .claude/skills/<name>/SKILL.md shims are generated from the canonical
  // .agents/skills bodies (single source of truth). A hand-edited shim drifts its
  // description out of sync with the canonical, breaking native discovery. Verify
  // they match; regenerate with `bun run ai:skills:sync`.
  const syncScript = path.join(__dirname, 'sync-skills.mjs');
  if (!fs.existsSync(syncScript)) {
    reportWarn('sync-skills.mjs not found — skipping skill shim sync check.');
    return;
  }
  try {
    execFileSync(process.execPath, [syncScript, '--check'], { stdio: 'inherit', cwd: ROOT });
  } catch {
    reportError(
      '.claude/skills shims are out of sync with .agents/skills. Run `bun run ai:skills:sync` and commit.',
    );
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

function checkAdrRegisterSync() {
  const syncScript = path.join(__dirname, 'sync-adr-register.mjs');
  if (!fs.existsSync(syncScript)) {
    reportWarn('sync-adr-register.mjs not found — skipping ADR register sync check.');
    return;
  }
  try {
    execFileSync(process.execPath, [syncScript, '--check'], { stdio: 'inherit', cwd: ROOT });
  } catch {
    reportError(
      'docs/adr/README.md ADR register is out of sync. Run `bun run ai:adr:sync` and commit.',
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
    for (const section of validation.recommendedSections ?? []) {
      const heading = new RegExp(`^#{1,6}\\s+${section}\\b`, 'm');
      if (!heading.test(content)) {
        reportWarn(
          `${relativePath}: consider a '## ${section}' section (distilled symptom → cause → fix) — recommended for error-prone domains, not required.`,
        );
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

  // The rule registry (scripts/review-gate-rules.mjs) is the single source of
  // truth for the static rules — it already carries id + severity + summary +
  // fix per rule. The doc must point at it, not re-transcribe the table (which
  // drifts and burns review tokens). Enforce only that the pointer is present.
  const inventory = content.slice(headingIndex);
  if (!inventory.includes('review-gate-rules.mjs')) {
    reportError(
      `${inventoryPath} Static Rule Inventory must point to the rule registry (scripts/review-gate-rules.mjs).`,
    );
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
    'packages/ui/src/styles/component-tokens.css',
    'packages/ui/src/styles/personalization.css',
    'packages/ui/src/styles/glass.css',
  ]);
  // The colour-math library is the one place allowed to parse/construct oklch()
  // strings programmatically (regex + formatters), not hardcoded design colours.
  // Exempt it from the raw-colour pattern only — primitive-var rules still apply.
  const colorMathFiles = new Set(['packages/ui/src/lib/oklch.ts', 'packages/ui/src/lib/apca.ts']);
  // The design-system showcase visualizes colour math: it constructs oklch()
  // from runtime-selected anchor values to render live APCA contrast previews.
  // That is the demonstration's purpose, not a hardcoded design colour — exempt
  // from the raw-colour pattern only (primitive-var rules still apply). The
  // design-trends glassmorphism playground is the same kind of showcase — it
  // builds `oklch(...)` strings via `formatOklch` to teach APCA + the 2026
  // tint/edge techniques, and its doc comment references the function name.
  const colorDemoFiles = new Set([
    'apps/web/src/features/design-system/components/apca-section.tsx',
    'apps/web/src/features/design-trends/glass-playground.tsx',
    'apps/web/src/features/design-trends/glass-2026-primitives.tsx',
    'apps/web/src/features/design-trends/use-blob-primary.ts',
  ]);
  const files = [
    ...collectFiles('apps/web/src', ['.css', '.ts', '.tsx']),
    ...collectFiles('packages/ui/src', ['.css', '.ts', '.tsx']),
  ];
  const rawColorPattern = /oklch\(/g;
  const primitiveVarPattern =
    /var\(--(?:indigo|violet|neutral|red|emerald|amber|coral|cyan|rose)-/g;

  for (const relativePath of files) {
    if (allowedTokenFiles.has(relativePath)) continue;

    const content = readFile(relativePath);
    const patterns =
      colorMathFiles.has(relativePath) || colorDemoFiles.has(relativePath)
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

// Canonical invariant phrases and their owning files. An invariant must be
// stated in full at exactly one canonical home; every other mention must be a
// pointer (a `path.md` link) back to that home. This detector flags duplicate
// full statements — same invariant in ≥2 places without a pointer.
//
// Each entry: [phraseRegex, canonicalPath] — the canonicalPath is the one file
// allowed to carry the full statement. The regex matches the invariant's
// identifying key-phrase. Add entries when the same invariant is found stated in
// full across multiple files during review.
const CANONICAL_INVARIANTS = [
  [
    /\bnever\s+mirror\s+server\s+(state|data)\s+into\s+Zustand\b/i,
    'docs/conventions/data-fetching.md',
  ],
  [/\bZustand\s+(holds|is\s+for|stores?\s+only)\s+client\b/i, 'docs/conventions/data-fetching.md'],
  [/\bservice-?role\b.*\bnever\b.*\b(client|browser|bundle)\b/i, 'AGENTS.md'],
  [/\bglass\s+=\s+floating\s+layers\s+only\b/i, 'docs/conventions/design-system.md'],
  [
    /\bsolid\s+\(`?surface-raised`?.*\)\s+=\s+dense\s+content\b/i,
    'docs/conventions/design-system.md',
  ],
  [/\bRLS\b.*\breal\s+data\s+boundary\b/i, 'docs/conventions/supabase-security.md'],
];

function checkInvariantDuplicates() {
  const canonicalSet = new Set(CANONICAL_INVARIANTS.map(([, c]) => c));
  const targets = getMarkdownLinkFiles().filter(
    (p) =>
      p.startsWith('docs/ai/') ||
      p.startsWith('docs/conventions/') ||
      p.startsWith('.agents/') ||
      p === 'AGENTS.md',
  );

  for (const [phraseRegex, canonicalPath] of CANONICAL_INVARIANTS) {
    const hits = [];

    for (const relativePath of targets) {
      const sourcePath = resolveRel(relativePath);
      if (!fs.existsSync(sourcePath)) continue;
      const content = fs.readFileSync(sourcePath, 'utf8');
      phraseRegex.lastIndex = 0;
      if (phraseRegex.test(content)) {
        hits.push(relativePath);
      }
    }

    // The canonical file itself may carry the full statement — that is fine.
    const nonCanonicalHits = hits.filter((p) => p !== canonicalPath);
    if (nonCanonicalHits.length > 0) {
      // Check whether each non-canonical hit carries a pointer back to canonical.
      const pointerPattern = new RegExp(
        `\\\`${canonicalPath.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\\``,
        'i',
      );
      const missingPointer = nonCanonicalHits.filter((p) => {
        const content = fs.readFileSync(resolveRel(p), 'utf8');
        return !pointerPattern.test(content);
      });

      if (missingPointer.length > 0) {
        const list = missingPointer.map((p) => `  ${p}`).join('\n');
        reportWarn(
          `Invariant "${phraseRegex.source}" appears in ${nonCanonicalHits.length} file(s) beyond canonical home ${canonicalPath}. Convert to a pointer (backtick ref to ${canonicalPath}) or remove:\n${list}`,
        );
      }
    }
  }
}

function checkDocApiDenylist() {
  // Framework/API identifiers known to be phantom or removed. A convention doc
  // (P2) naming a non-existent API outranks real code (P4) and makes agents write
  // code that fails to build (cf. the `unstable_instant` incident, 2026-07).
  // This is a denylist, NOT a freshness table (removed version-table
  // upkeep): add an entry when a phantom API is caught. Verify *real* APIs at edit
  // time against apps/web/node_modules/next, not here.
  const DENY = [
    {
      token: 'unstable_instant',
      reason: 'not exported by the installed Next.js (phantom route-segment API)',
    },
  ];
  const targets = [
    'AGENTS.md',
    'apps/web/AGENTS.md',
    ...collectMarkdownFiles('docs/conventions'),
    ...collectMarkdownFiles('docs/ai'),
    ...collectMarkdownFiles('.claude/rules'),
  ];
  for (const relativePath of targets) {
    if (!fs.existsSync(resolveRel(relativePath))) continue;
    const content = readFile(relativePath);
    for (const { token, reason } of DENY) {
      const idx = content.indexOf(token);
      if (idx >= 0) {
        reportError(
          `Denylisted API '${token}' in ${relativePath}:${lineNumber(content, idx)} — ${reason}. Remove it or replace with a verified API.`,
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

if (selfTest) {
  runSelfTest();
  process.exit(0);
}

console.log('Running AI context validation...');

checkRequiredFiles();
checkRequiredExistingPaths();
checkFrontmatter();
checkStructuredMarkdown({
  dir: '.agents/skills',
  kind: 'Skill',
  validation: SKILL_VALIDATION,
  isFileEntry: false,
});
checkAiDocSizes();
checkSizeBudgets();
checkCompactMarkdownTables();
checkMarkdownLinks();
checkDocPathReferences();
checkCodeReferences();

checkRuleInventory();
checkPackageScripts();
checkDesignTokenBoundaries();
checkUiPackageBoundaries();
checkDocApiDenylist();
checkInvariantDuplicates();
checkSkillShimsSync();
checkProjectGraphSync();
checkAdrRegisterSync();

// Advisory metrics snapshot — writes scripts/ai-metrics.json, never blocks the gate.
try {
  execFileSync(process.execPath, [path.join(__dirname, 'ai-metrics.mjs')], {
    stdio: 'pipe',
    cwd: ROOT,
    timeout: 10_000,
  });
} catch {
  // fail-open: metrics are advisory
}

if (errors > 0) {
  console.error(`\nValidation failed with ${errors} error(s) and ${warnings} warning(s).`);
  process.exit(1);
}

console.log(`AI context validation passed with ${warnings} warning(s).`);
