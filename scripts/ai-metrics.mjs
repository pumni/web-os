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

// 1. Size: total size of context docs in docs/ai, docs/conventions, docs/architecture
const contextDocDirs = ['docs/ai', 'docs/conventions', 'docs/architecture'];
const contextDocs = contextDocDirs.flatMap((d) => collectMarkdownFiles(d));
metrics.totalSizeBytes = contextDocs.reduce((sum, p) => sum + fileSizeBytes(p), 0);

// 2. Skill count
const skillDir = resolveRel('.agents/skills');
let skillCount = 0;
if (fs.existsSync(skillDir)) {
  for (const entry of fs.readdirSync(skillDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(skillDir, entry.name, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      skillCount++;
    }
  }
}
metrics.skillCount = skillCount;

// 3. Manifest item count
metrics.manifestItemCount = (() => {
  const m = readAny('scripts/ai-context.manifest.json');
  try {
    const parsed = JSON.parse(m);
    return parsed.requiredFiles?.length ?? 0;
  } catch { return 0; }
})();

// 4. Common mistakes gap
const cmContent = readAny('docs/ai/common-mistakes.md');
const enforcementGap = (cmContent.match(/\(honor-system\)/g) ?? []).length +
  (cmContent.match(/\(partial\)/g) ?? []).length;
metrics.commonMistakesEnforcementGap = enforcementGap;

// 5. Behavioral baseline (retired)
metrics.behavioralBaseline = {
  status: 'retired',
  reason: 'Behavioral eval system retired 2026-07-18; see docs/plans/context-layer-r3-overhaul-2026-07.md'
};

const outputPath = path.join(__dirname, 'ai-metrics.json');
fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2) + '\n');
process.stdout.write(JSON.stringify(metrics, null, 2) + '\n');