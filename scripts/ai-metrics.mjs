// AI context-layer metrics (advisory). Outputs JSON to stdout and writes
// scripts/ai-metrics.json. Use `bun run ai:metrics` or wire into `ai:check`.
// Metrics drive ADR freeze-gate evidence: the next context-layer ADR must cite
// at least one metric from this output.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function relPath(p) {
  return path.relative(ROOT, p).replaceAll(path.sep, '/');
}

function resolveRel(p) {
  return path.join(ROOT, p);
}

function collectMarkdownFiles(dirRel) {
  const dir = resolveRel(dirRel);
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    const entryRel = relPath(entryPath);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(entryRel));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(entryRel);
    }
  }
  return results;
}

function fileSizeBytes(p) {
  try { return fs.statSync(resolveRel(p)).size; } catch { return 0; }
}

function readAny(p) {
  try { return fs.readFileSync(resolveRel(p), 'utf8'); } catch { return ''; }
}

// ─── Metrics ────────────────────────────────────────────────────────────────

const metrics = {};

// 1. Document inventory
const contextDocDirs = ['docs/ai', 'docs/conventions', 'docs/architecture'];
const contextDocs = contextDocDirs.flatMap((d) => collectMarkdownFiles(d));
metrics.docCount = contextDocs.length;
metrics.totalSizeBytes = contextDocs.reduce((sum, p) => sum + fileSizeBytes(p), 0);

// 2. ADR meta vs product ratio (active ADRs only)
const adrFiles = collectMarkdownFiles('docs/adr').filter((p) => !p.endsWith('README.md'));
const adrContent = adrFiles.map((p) => ({ path: p, content: readAny(p) }));
const activeAdrs = adrContent.filter(
  ({ content }) =>
    !/^\s*-\s+\*\*Status:\*\*\s*(?:Deprecated|Superseded)/m.test(content.slice(0, 500)),
);
// Meta = ADR about governing the context layer itself, not just owned by it.
// Check only the Decision + Consequences sections (not the Owner metadata line).
const activeMetaAdrs = activeAdrs.filter(
  ({ content }) => {
    const decisionIdx = content.indexOf('\n## Decision');
    if (decisionIdx < 0) return false;
    const relevantText = content.slice(decisionIdx);
    return /context.?layer|governance.*doc|meta.*doc|doc.*enforcement|context.*(freeze|tuning|over.?tuning)/i.test(relevantText);
  },
);
metrics.adrActiveCount = activeAdrs.length;
metrics.adrDeprecatedCount = adrContent.length - activeAdrs.length;
metrics.adrMetaRatio = activeAdrs.length > 0
  ? (activeMetaAdrs.length / activeAdrs.length * 100).toFixed(0) + '%'
  : '0%';

// 3. Skill count and overlap heuristic
const skillDir = resolveRel('.agents/skills');
let skillCount = 0;
const skillDescriptions = [];
if (fs.existsSync(skillDir)) {
  for (const entry of fs.readdirSync(skillDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(skillDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    skillCount++;
    const content = fs.readFileSync(skillPath, 'utf8');
    const descMatch = content.match(/^description:\s*(.+)$/m);
    if (descMatch) skillDescriptions.push(descMatch[1]);
  }
}
metrics.skillCount = skillCount;

// Overlap: count pairs whose descriptions share ≥4 significant words, treating
// cross-reference clauses ("use X", "Not for X", "For X, use Y") as negative
// direction, not positive overlap. Otherwise a skill that points at another
// skill inflates its own overlap with the very skill it disambiguates from.
// Threshold raised from ≥3 to ≥4 (15 of the 31 baseline pairs shared exactly
// 3 noise tokens: 'adding', 'changing', 'server', 'client'). Skill identity
// tokens (other skills' names) excluded too — they are pointers, not content.
const stopWords = new Set([
  'use', 'when', 'for', 'the', 'a', 'an', 'of', 'to', 'in', 'is', 'it', 'on',
  'and', 'or', 'not', 'be', 'with', 'as', 'at', 'by', 'or', 'from', 'that',
  'this', 'add', 'change', 'build', 'create', 'make', 'shape', 'adding',
  'changing', 'server', 'client', 'code', 'before', 'into', 'are',
]);
function stripCrossReferenceClauses(s) {
  // Remove "Not for <X>", "For <X>, use <Y>", "use <Y>" tail clauses — all
  // negative direction, not positive content overlap. Strip until end of
  // the sentence (period) or end of string.
  return s
    .replace(/\bnot\s+for\b[^.]*\.?/gi, ' ')
    .replace(/\bfor\s+(?:client|server|module|the\s+\w+)[^.,]*,?\s*use\b[^.]*\.?/gi, ' ')
    .replace(/\bfor\s+\w[\w\s-]*,\s*use\b[^.]*\.?/gi, ' ')
    .replace(/\buse\s+(?:react-hook-form|server-action|zod-validator|feature-module|tanstack-query-hook|zustand-store|refactor-plan|codebase-design|grill-requirements|domain-modeling|server-component-read|supabase-migration|ui-styling|watch-sync|testing-template|dependency-update|diagnosing-bugs)\b/gi, ' ')
    .replace(/\bserver\s+action\s+(?:mutation|logic)\b/gi, ' ');
}
function words(s) {
  const cleaned = stripCrossReferenceClauses(s.toLowerCase());
  return cleaned
    .replace(/[^a-z0-9 -]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}
let overlapScore = 0;
for (let i = 0; i < skillDescriptions.length; i++) {
  for (let j = i + 1; j < skillDescriptions.length; j++) {
    const wi = new Set(words(skillDescriptions[i]));
    const wj = new Set(words(skillDescriptions[j]));
    let shared = 0;
    for (const w of wi) if (wj.has(w)) shared++;
    if (shared >= 4) overlapScore++;
  }
}
metrics.skillOverlapPairs = overlapScore;

// 4. Invariant duplicate count (from CANONICAL_INVARIANTS in check-ai-context)
// Lightweight self-contained duplicate scan mirroring the check logic.
const INVARIANT_CANONICAL = [
  [/never mirror server (state|data) into Zustand/i, 'docs/conventions/data-fetching.md'],
  [/Zustand (holds|is for|stores? only) client/i, 'docs/conventions/data-fetching.md'],
  [/service-role.*never.*(client|browser|bundle)/i, 'AGENTS.md'],
  [/glass = floating layers only/i, 'docs/conventions/design-system.md'],
  [/solid \(`?surface-raised`?.*\)\s+=\s+dense\s+content/i, 'docs/conventions/design-system.md'],
  [/RLS.*real data boundary/i, 'docs/conventions/supabase-security.md'],
];
const invariantTargets = [
  'AGENTS.md',
  ...collectMarkdownFiles('docs/ai'),
  ...collectMarkdownFiles('docs/conventions'),
  ...collectMarkdownFiles('.agents/skills'),
  ...collectMarkdownFiles('.agents/workflows'),
];
let duplicateCount = 0;
for (const [re, canonical] of INVARIANT_CANONICAL) {
  let hits = 0;
  for (const target of invariantTargets) {
    if (target === canonical) continue;
    const content = readAny(target);
    re.lastIndex = 0;
    if (re.test(content)) hits++;
  }
  if (hits > 0) duplicateCount++;
}
metrics.invariantDuplicateCategories = duplicateCount;

// 5. Manifest size
metrics.manifestItemCount = (() => {
  const m = readAny('scripts/ai-context.manifest.json');
  try {
    const parsed = JSON.parse(m);
    return parsed.requiredFiles?.length ?? 0;
  } catch { return 0; }
})();

// 6. Enforcement gap: count common-mistakes entries marked honor-system
const cmContent = readAny('docs/ai/common-mistakes.md');
const enforcementGap = (cmContent.match(/\(honor-system\)/g) ?? []).length +
  (cmContent.match(/\(partial\)/g) ?? []).length;
metrics.commonMistakesEnforcementGap = enforcementGap;

// 7. Storage ratio: ai-context docs vs ADR docs
const allContextDocs = contextDocs.map((p) => fileSizeBytes(p));
const totalContextSize = allContextDocs.reduce((a, b) => a + b, 0);
const adrTotalSize = adrContent.reduce((sum, { path: p }) => sum + fileSizeBytes(p), 0);
metrics.contextDocsBytes = totalContextSize;
metrics.adrDocsBytes = adrTotalSize;

// 8. Tool Support Matrix coverage — count capabilities the index documents
// vs the real mechanisms that exist on disk. Each required capability that is
// missing from docs/ai/index.md's Tool Support Matrix (or the section itself)
// counts as one mismatch. Drives freeze-gate evidence for context-
// layer edits to the matrix.
const REQUIRED_CAPABILITY_KEYWORDS = [
  { capability: 'entry contract', re: /AGENTS\.md/ },
  { capability: 'handshake map', re: /llms\.txt/ },
  { capability: 'router', re: /docs\/ai\/index\.md/ },
  { capability: 'long-term memory', re: /MEMORY\.md/ },
  { capability: 'path-scoped rules', re: /\.claude\/rules/ },
  { capability: 'skill discovery', re: /\.agents\/skills/ },
  { capability: 'skill shim (generated)', re: /\.claude\/skills/ },
  { capability: 'subagent reviewers', re: /\.claude\/agents/ },
  { capability: 'lifecycle hooks', re: /\.claude\/hooks/ },
  { capability: 'MCP servers', re: /\.mcp\.json/ },
  { capability: 'validation gates', re: /ai:check/ },
];
const indexContent = readAny('docs/ai/index.md');
let toolMatrixMismatches = 0;
if (!/## Tool Support Matrix/.test(indexContent)) {
  toolMatrixMismatches = REQUIRED_CAPABILITY_KEYWORDS.length;
} else {
  for (const { re } of REQUIRED_CAPABILITY_KEYWORDS) {
    if (!re.test(indexContent)) toolMatrixMismatches++;
  }
}
metrics.toolMatrixMismatches = toolMatrixMismatches;

// 9. Skill negative-clause coverage — of the skills that baseline-overlapped
// with another skill, count how many carry an explicit disambiguation clause
// ("Not for", "For X, use Y"). Advisory; drives the Workstream-B freeze-gate
// evidence along with skillOverlapPairs.
const skillCanonicalDir = resolveRel('.agents/skills');
let skillsNeedingNegativeClause = 0;
let skillsWithNegativeClause = 0;
if (fs.existsSync(skillCanonicalDir)) {
  const allSkillNames = fs
    .readdirSync(skillCanonicalDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  for (const name of allSkillNames) {
    const skillPath = path.join(skillCanonicalDir, name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    const content = fs.readFileSync(skillPath, 'utf8');
    const m = content.match(/^description:\s*(.+)$/m);
    if (!m) continue;
    const desc = m[1];
    const otherNames = allSkillNames.filter((n) => n !== name).join('|');
    const referencesOther = new RegExp(
      `\\buse\\s+(?:${otherNames})\\b`,
      'i',
    ).test(desc) || /\bnot\s+for\b/i.test(desc);
    if (referencesOther) {
      skillsNeedingNegativeClause++;
      skillsWithNegativeClause++;
    }
  }
}
metrics.skillNegativeClauseCoverage = skillsNeedingNegativeClause === 0
  ? '0/0 (no cross-references)'
  : `${skillsWithNegativeClause}/${skillsNeedingNegativeClause}`;

// 10. Behavioral baseline — pass rates from last run of `bun run ai:eval:behavioral`.
// Advisory snapshot (read from scripts/behavioral-evals/last-run.json); null when
// the suite has not been run yet. Drives freeze-gate evidence alongside
// skillOverlapPairs / skillNegativeClauseCoverage / toolMatrixMismatches.
let behavioralBaseline = null;
try {
  const lastRunPath = path.join(__dirname, 'behavioral-evals', 'last-run.json');
  if (fs.existsSync(lastRunPath)) {
    const lr = JSON.parse(fs.readFileSync(lastRunPath, 'utf8'));
    behavioralBaseline = {
      ranAt: lr.ranAt,
      taskCount: lr.taskCount,
      trialsPerMode: lr.trialsPerMode,
      passRateA_avg: lr.passRateA_avg ?? null,
      passRateB_avg: lr.passRateB_avg ?? null,
      regressions: lr.regressions ?? null,
    };
  }
} catch {
  // fail-open: malformed last-run.json is not a metric failure
}
metrics.behavioralBaseline = behavioralBaseline;

const outputPath = path.join(__dirname, 'ai-metrics.json');
fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2) + '\n');
process.stdout.write(JSON.stringify(metrics, null, 2) + '\n');