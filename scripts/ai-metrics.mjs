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

// Overlap: count pairs whose descriptions share ≥3 significant words
const stopWords = new Set([
  'use', 'when', 'for', 'the', 'a', 'an', 'of', 'to', 'in', 'is', 'it', 'on',
  'and', 'or', 'not', 'be', 'with', 'as', 'at', 'by', 'or', 'from', 'that',
  'this', 'add', 'change', 'build', 'create', 'make', 'shape',
]);
function words(s) {
  return s.toLowerCase().replace(/[^a-z0-9 -]/g, '').split(/\s+/).filter(
    (w) => w.length > 2 && !stopWords.has(w),
  );
}
let overlapScore = 0;
for (let i = 0; i < skillDescriptions.length; i++) {
  for (let j = i + 1; j < skillDescriptions.length; j++) {
    const wi = new Set(words(skillDescriptions[i]));
    const wj = new Set(words(skillDescriptions[j]));
    let shared = 0;
    for (const w of wi) if (wj.has(w)) shared++;
    if (shared >= 3) overlapScore++;
  }
}
metrics.skillOverlapPairs = overlapScore;

// 4. Invariant duplicate count (from CANONICAL_INVARIANTS in check-ai-context)
// Lightweight self-contained duplicate scan mirroring the check logic.
const INVARIANT_CANONICAL = [
  [/never mirror server (state|data) into Zustand/i, 'docs/conventions/data-fetching.md'],
  [/Zustand (holds|is for|stores? only) client/i, 'docs/conventions/data-fetching.md'],
  [/service-role.*never.*(client|browser|bundle)/i, 'AGENTS.md'],
  [/glass = floating layers only/i, 'docs/adr/0012-engineered-glass-surface-language.md'],
  [/solid \(surface-raised\) = dense content/i, 'docs/adr/0012-engineered-glass-surface-language.md'],
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

const outputPath = path.join(__dirname, 'ai-metrics.json');
fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2) + '\n');
process.stdout.write(JSON.stringify(metrics, null, 2) + '\n');