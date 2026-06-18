// scripts/ai-metrics.mjs
//
// Emit a snapshot of AI-context-layer health metrics for Pumni Web OS.
//
// What gets measured (and why each is derivable from the repo, not from AI history):
//   1. Context coverage  — share of packages/task-routes that own a context file.
//   2. Freshness         — age distribution of `last-reviewed` across enforced docs.
//   3. ADR adoption      — share of recent architecture/migration commits that
//                          reference an ADR. Requires git; skipped if unavailable.
//   4. Regression signal — static-rule violation count + eval coverage. Acts as a
//                          cheap proxy for "how often does the agent get it wrong".
//
// Modes:
//   node scripts/ai-metrics.mjs          -> human-readable summary (default)
//   node scripts/ai-metrics.mjs --json   -> machine-readable JSON (for CI artifacts)
//
// Exit codes:
//   0  metrics produced (does NOT fail the gate — measurement is advisory)
//   1  fatal error (could not read manifest / parse failure)
//
// Design note: this script never edits files and never fails CI on a bad number.
// Its job is visibility. Trending happens across nightly runs; a single snapshot
// is informational only.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './frontmatter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const JSON_MODE = process.argv.slice(2).includes('--json');
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FRESHNESS_WARN_DAYS = 180;
const FRESHNESS_ERROR_DAYS = 365;

function readJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function listDir(rel) {
  const dir = path.join(ROOT, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true });
}

// --- Metric 1: Context coverage -------------------------------------------

function measureCoverage() {
  // Packages: each workspace package should own a packages/<name>/AGENTS.md.
  const pkgDir = listDir('packages').filter((e) => e.isDirectory()).map((e) => e.name);
  const packagesTotal = pkgDir.length;
  const packagesWithAgents = pkgDir.filter((name) =>
    exists(`packages/${name}/AGENTS.md`),
  ).length;

  // Task routes: every task-route referenced by the index should exist.
  const routesDir = path.join(ROOT, 'docs/ai/task-routes');
  const routesTotal = fs.existsSync(routesDir)
    ? fs.readdirSync(routesDir).filter((f) => f.endsWith('.md')).length
    : 0;

  // Skills: each skill dir must have SKILL.md (already enforced by ai:check, but
  // reported here as coverage of "reusable procedure" surface).
  const skillsDir = path.join(ROOT, '.agents/skills');
  const skillDirs = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];
  const skillsTotal = skillDirs.length;
  const skillsWithFile = skillDirs.filter((name) =>
    exists(`.agents/skills/${name}/SKILL.md`),
  ).length;

  const pkgPct = packagesTotal ? Math.round((packagesWithAgents / packagesTotal) * 100) : 100;
  const skillPct = skillsTotal ? Math.round((skillsWithFile / skillsTotal) * 100) : 100;

  return {
    packages: { total: packagesTotal, withAgents: packagesWithAgents, coveragePct: pkgPct },
    taskRoutes: { total: routesTotal },
    skills: { total: skillsTotal, withFile: skillsWithFile, coveragePct: skillPct },
  };
}

// --- Metric 2: Freshness ---------------------------------------------------

function getGitCommitDate(rel) {
  try {
    const stdout = execSync(`git log -1 --format=%cI -- "${rel}"`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return stdout ? new Date(stdout) : null;
  } catch {
    return null;
  }
}

function measureFreshness(frontmatterRequired) {
  const today = new Date();
  const ages = [];
  let missing = 0;
  let invalid = 0;
  const stale = [];

  for (const rel of frontmatterRequired) {
    const commitDate = getGitCommitDate(rel);
    if (!commitDate) {
      missing++;
      continue;
    }
    const ageDays = Math.floor((today.getTime() - commitDate.getTime()) / MS_PER_DAY);
    ages.push(ageDays);
    if (ageDays > FRESHNESS_WARN_DAYS) {
      stale.push({ file: rel, ageDays, reviewed: commitDate.toISOString().split('T')[0] });
    }
  }

  ages.sort((a, b) => a - b);
  const pct = (q) => (ages.length ? ages[Math.min(ages.length - 1, Math.floor((q / 100) * ages.length))] : 0);

  return {
    filesChecked: frontmatterRequired.length,
    missingDate: missing,
    invalidDate: invalid,
    ageDaysMin: ages.length ? ages[0] : null,
    ageDaysP50: ages.length ? pct(50) : null,
    ageDaysMax: ages.length ? ages[ages.length - 1] : null,
    olderThanWarnDays: ages.filter((a) => a > FRESHNESS_WARN_DAYS).length,
    olderThanErrorDays: ages.filter((a) => a > FRESHNESS_ERROR_DAYS).length,
    stale,
  };
}

// --- Metric 3: ADR adoption ------------------------------------------------

function gitAvailable() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore', cwd: ROOT });
    return true;
  } catch {
    return false;
  }
}

function recentCommitsTouching(patterns, limit = 50) {
  // Returns list of commit subjects (first line) touching any of the pathspecs.
  try {
    const out = execSync(
      `git log --no-merges -n ${limit} --format=%H%x09%s -- ${patterns.join(' ')}`,
      { cwd: ROOT, encoding: 'utf8' },
    );
    return out
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash, ...rest] = line.split('\t');
        return { hash, subject: rest.join('\t') };
      });
  } catch {
    return [];
  }
}

function commitMentionsAdr(commit) {
  // Cheap heuristic: ADR-NNNN, ADR NNNN, docs/adr/ path, or "ADR:" prefix.
  const s = commit.subject;
  return /\bADR[-\s]?\d{1,4}\b/i.test(s) || /docs\/adr\//i.test(s);
}

function measureAdrAdoption() {
  if (!gitAvailable()) {
    return { available: false, reason: 'git not available (or not a work tree)' };
  }
  // "Architecture-touching" commits = changes to architecture docs, migrations,
  // or the manifest (structural decisions).
  const commits = recentCommitsTouching(
    ['docs/architecture/', 'supabase/migrations/', 'scripts/ai-context.manifest.json'],
    50,
  );
  if (commits.length === 0) {
    return { available: true, recentCommits: 0, withAdr: 0, adoptionPct: null };
  }
  const withAdr = commits.filter(commitMentionsAdr);
  return {
    available: true,
    recentCommits: commits.length,
    withAdr: withAdr.length,
    adoptionPct: Math.round((withAdr.length / commits.length) * 100),
  };
}

// --- Metric 4: Regression signal (hallucination proxy) --------------------

function countStaticViolations() {
  // Run the static analyzer and parse its trailing summary line, if present.
  // The analyzer prints e.g. "Review gate static checks passed (N file(s), M SQL file(s) scanned)."
  // It exits 1 on violations; we capture stdout regardless.
  try {
    const out = execSync('node scripts/check-review-gate-rules.mjs', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ran: true, exitCode: 0, output: out.trim().split('\n').pop() };
  } catch (err) {
    if (err.status) {
      // Non-zero exit = violations found. Capture the summary line if any.
      const out = (err.stdout || '').toString().trim().split('\n').pop();
      return { ran: true, exitCode: err.status, output: out || 'violations reported' };
    }
    return { ran: false, reason: String(err.message) };
  }
}

function evalCoverage() {
  try {
    const out = execSync('node scripts/run-ai-evals.mjs', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const m = out.match(/Static rule coverage:\s*(\d+)\/(\d+)/);
    return m
      ? { ran: true, covered: Number(m[1]), total: Number(m[2]) }
      : { ran: true, covered: null, total: null };
  } catch {
    return { ran: false };
  }
}

function measureRegressionSignal() {
  return {
    staticScan: countStaticViolations(),
    evalCoverage: evalCoverage(),
  };
}

// --- Output ----------------------------------------------------------------

function humanReport(metrics) {
  const lines = [];
  lines.push('=== AI Context Metrics ===');
  lines.push(`generated: ${metrics.generated}`);

  const c = metrics.coverage;
  lines.push('');
  lines.push('## Coverage');
  lines.push(`  packages with AGENTS.md:  ${c.packages.withAgents}/${c.packages.total} (${c.packages.coveragePct}%)`);
  lines.push(`  task routes:              ${c.taskRoutes.total}`);
  lines.push(`  skills with SKILL.md:     ${c.skills.withFile}/${c.skills.total} (${c.skills.coveragePct}%)`);

  const f = metrics.freshness;
  lines.push('');
  lines.push('## Freshness (last-reviewed age, days)');
  lines.push(`  files checked:            ${f.filesChecked}`);
  lines.push(`  missing date:             ${f.missingDate}`);
  lines.push(`  invalid date:             ${f.invalidDate}`);
  lines.push(`  age min / p50 / max:      ${f.ageDaysMin} / ${f.ageDaysP50} / ${f.ageDaysMax} days`);
  lines.push(`  older than ${FRESHNESS_WARN_DAYS}d (warn):   ${f.olderThanWarnDays}`);
  lines.push(`  older than ${FRESHNESS_ERROR_DAYS}d (error):  ${f.olderThanErrorDays}`);
  if (f.stale.length) {
    lines.push('  stale files:');
    for (const s of f.stale.slice(0, 10)) {
      lines.push(`    - ${s.file}  (${s.ageDays}d, reviewed ${s.reviewed})`);
    }
    if (f.stale.length > 10) lines.push(`    ... and ${f.stale.length - 10} more`);
  }

  const a = metrics.adrAdoption;
  lines.push('');
  lines.push('## ADR adoption');
  if (!a.available) {
    lines.push(`  unavailable: ${a.reason}`);
  } else if (a.recentCommits === 0) {
    lines.push('  no recent architecture/migration commits to score');
  } else {
    lines.push(`  recent commits (architecture/migrations/manifest): ${a.recentCommits}`);
    lines.push(`  mentioning an ADR:                                 ${a.withAdr} (${a.adoptionPct}%)`);
  }

  const r = metrics.regressionSignal;
  lines.push('');
  lines.push('## Regression signal (hallucination proxy)');
  if (r.staticScan.ran) {
    lines.push(`  static scan exit=${r.staticScan.exitCode}: ${r.staticScan.output}`);
  } else {
    lines.push(`  static scan: did not run (${r.staticScan.reason || 'unknown'})`);
  }
  if (r.evalCoverage.ran) {
    const e = r.evalCoverage;
    lines.push(`  eval coverage: ${e.covered}/${e.total}`);
  } else {
    lines.push('  eval coverage: did not run');
  }

  lines.push('');
  lines.push('Note: this snapshot is advisory. Trend it across nightly runs; a single point is informational.');
  return lines.join('\n');
}

function main() {
  let manifest;
  try {
    manifest = readJSON('scripts/ai-context.manifest.json');
  } catch (err) {
    console.error(`[ai-metrics] failed to load manifest: ${err.message}`);
    process.exit(1);
  }

  const metrics = {
    generated: new Date().toISOString(),
    coverage: measureCoverage(),
    freshness: measureFreshness(manifest.frontmatterRequired ?? []),
    adrAdoption: measureAdrAdoption(),
    regressionSignal: measureRegressionSignal(),
  };

  if (JSON_MODE) {
    process.stdout.write(JSON.stringify(metrics, null, 2) + '\n');
  } else {
    process.stdout.write(humanReport(metrics) + '\n');
  }
  // Advisory: always exit 0 unless something fatal happened above.
  process.exit(0);
}

main();
