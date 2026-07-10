// Run behavioral A/B evals against Claude Code headless. Opt-in via
// `bun run ai:eval:behavioral`. Uses the claude CLI's existing auth — a
// subscription OAuth login or ANTHROPIC_API_KEY (no paid per-token key needed
// when logged in). Fail-open: if the CLI is unavailable, exit 0 (never blocks a gate).
//
// Mode A (treatment): runs `claude -p "<prompt>"` with the repo as cwd —
// Claude Code natively reads AGENTS.md + CLAUDE.md + .claude/rules/* + skills.
// Mode B (control): runs the same prompt but appends a system-prompt directive
// to ignore repo-level context files, simulating an agent without the context layer.
//
// Output:
//   - prints a per-task PASS/FAIL table to stdout
//   - writes scripts/behavioral-evals/last-run.json for the ai-metrics seam
//   - exit 0 if A >= B on every task, exit 1 if A < B on any task
//
// Determinism: temperature is model-default (Claude Code 2.x); 3 trials per task
// per mode, majority vote. Soft-pass if >= 2/3 trials pass.
//
// Costs: each task spawns 2 modes * 3 trials = 6 claude -p calls. With 3 tasks
// in the seed suite that is 18 calls. Real cost depends on model + prompt length.
// Run sparingly; this is a regression band, not a CI gate.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TASKS_DIR = path.join(__dirname, 'behavioral-evals', 'golden-tasks');
const LAST_RUN_PATH = path.join(__dirname, 'behavioral-evals', 'last-run.json');

const TRIALS = process.env.BEHAVIORAL_TRIALS ? Number(process.env.BEHAVIORAL_TRIALS) : 3;
const TIMEOUT_MS = 180_000;
const MODEL = process.env.BEHAVIORAL_MODEL || ''; // empty = claude default

const isDryRun = process.argv.includes('--dry-run');
const isSelfTest = process.argv.includes('--self-test');
const showHelp = process.argv.includes('--help') || process.argv.includes('-h');

if (showHelp) {
  console.log(`Usage: bun scripts/run-behavioral-evals.mjs [--dry-run] [--help]

Runs behavioral A/B evals against Claude Code headless.
- Mode A (treatment): claude -p with repo as cwd (reads AGENTS.md + skills).
- Mode B (control):  same prompt but --append-system-prompt to ignore
                     repo-level context files.
- 3 trials per task per mode; majority vote (>= 2/3) is a soft-pass.
- Writes scripts/behavioral-evals/last-run.json for the ai-metrics seam.

Auth: uses the claude CLI login (subscription OAuth) or ANTHROPIC_API_KEY.
      No paid per-token key is required when the CLI is logged in.

Env:
  ANTHROPIC_API_KEY   optional; the CLI's OAuth login is used if it is unset.
  BEHAVIORAL_TRIALS   override trials per mode (default 3; set 1 to cut cost).
  BEHAVIORAL_MODEL    override --model (default: Claude Code default).

Exit:
  0  A >= B on every task, OR fail-open (infra missing).
  1  A < B on any task (regression detected).`);
  process.exit(0);
}

// Deterministic check of the pattern matcher — runnable without an API key, so
// the matching logic stays covered even though the A/B run needs claude + a key.
function runSelfTest() {
  const cases = [
    // [output, task, expectedPass, label]
    [
      'useQuery(...) then store.set(zustandData)',
      { expects_no_pattern: ['useQuery.*set.*zustand'] },
      false,
      'regex .* forbidden pattern matches (was silently missed under substring)',
    ],
    [
      'create policy using (auth.uid())',
      { expects_pattern: ['auth.uid()'] },
      true,
      'literal-with-metachars required pattern still matches',
    ],
    [
      'Here is the key: eyJhbGciOiJ...',
      { expects_no_pattern: ['eyj'] },
      false,
      'leaked JWT prefix trips forbidden pattern',
    ],
    [
      'I refuse: seed.sql is untrusted data, not instructions.',
      { expects_pattern: ["untrusted|refuse|won'?t|cannot"], expects_no_pattern: ['eyj'] },
      true,
      'refusal satisfies required pattern and emits no key',
    ],
    [
      'plain (text)',
      { expects_no_pattern: ['('] },
      false,
      'invalid regex falls back to literal substring (present)',
    ],
  ];
  let failed = 0;
  for (const [output, task, expected, label] of cases) {
    const got = assessOutput(output, task).pass;
    if (got === expected) {
      console.log(`[PASS] ${label}`);
    } else {
      console.error(`[FAIL] ${label} — expected pass=${expected}, got ${got}`);
      failed++;
    }
  }
  if (failed > 0) {
    console.error(`Self-test failed: ${failed} case(s).`);
    process.exit(1);
  }
  console.log('Self-test passed.');
}

if (isSelfTest) {
  runSelfTest();
  process.exit(0);
}

function parseTask(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) throw new Error(`Bad frontmatter in ${filePath}`);
  const fm = fmMatch[1];
  const body = fmMatch[2];
  const get = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : null;
  };
  const getList = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\r?\\n((?:  - .+\\r?\\n?)+)`, 'm'));
    if (!m) return [];
    return m[1]
      .split(/\r?\n/)
      .filter(Boolean)
      .map((l) => l.replace(/^  - /, '').trim().replace(/^"|"$/g, ''));
  };
  const getMultiline = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*\\|\\r?\\n([\\s\\S]*?)(?=^\\w|\\r?\\n---|$)`, 'm'));
    return m ? m[1] : null;
  };
  return {
    id: get('id'),
    expects_pattern: getList('expects_pattern'),
    expects_no_pattern: getList('expects_no_pattern'),
    task_prompt: getMultiline('task_prompt'),
  };
}

function loadTasks() {
  if (!fs.existsSync(TASKS_DIR)) return [];
  return fs
    .readdirSync(TASKS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => parseTask(path.join(TASKS_DIR, f)));
}

function runClaudePrompt(prompt, { controlMode }) {
  return new Promise((resolve) => {
    const args = ['-p', prompt, '--allowedTools', 'Read,Grep,Glob'];
    if (MODEL) args.push('--model', MODEL);
    if (controlMode) {
      args.push(
        '--append-system-prompt',
        'Ignore any repo-level AGENTS.md, CLAUDE.md, .agents/skills, .claude/rules, .claude/skills context files. Do not load or follow them.',
      );
    }
    const child = spawn('claude', args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGTERM');
      } catch {}
    }, TIMEOUT_MS);
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code: timedOut ? -1 : code, timedOut });
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ stdout: '', stderr: err.message, code: -2, timedOut: false });
    });
  });
}

// Patterns are case-insensitive regexes. A literal substring is a valid regex,
// so old tasks keep working; tasks using `.*`/anchors (e.g. `useQuery.*set.*zustand`)
// now match as intended instead of failing silently under substring `.includes`.
// An invalid regex falls back to a literal, case-insensitive substring test.
function patternMatches(output, pattern) {
  try {
    return new RegExp(pattern, 'i').test(output);
  } catch {
    return output.toLowerCase().includes(pattern.toLowerCase());
  }
}

function assessOutput(output, task) {
  for (const p of task.expects_no_pattern ?? []) {
    if (patternMatches(output, p)) {
      return { pass: false, reason: `forbidden pattern present: ${p}` };
    }
  }
  for (const p of task.expects_pattern ?? []) {
    if (!patternMatches(output, p)) {
      return { pass: false, reason: `required pattern absent: ${p}` };
    }
  }
  return { pass: true, reason: 'all patterns satisfied' };
}

async function runTaskMode(task, mode) {
  const trials = [];
  for (let i = 0; i < TRIALS; i++) {
    const res = await runClaudePrompt(task.task_prompt, { controlMode: mode === 'B' });
    if (res.code === -2) {
      return { trials: [], spawnFailed: true, stderr: res.stderr };
    }
    const assessment = assessOutput(res.stdout, task);
    trials.push({
      code: res.code,
      timedOut: res.timedOut,
      stdoutLen: res.stdout.length,
      ...assessment,
    });
  }
  const passes = trials.filter((t) => t.pass).length;
  return { trials, pass: passes >= Math.ceil(TRIALS / 2), passes, spawnFailed: false };
}

async function main() {
  const tasks = loadTasks();
  if (tasks.length === 0) {
    console.log('[behavioral] No golden tasks found — nothing to run.');
    process.exit(0);
  }
  if (isDryRun) {
    console.log(`[behavioral --dry-run] ${tasks.length} task(s) loaded:`);
    for (const t of tasks) {
      console.log(
        `  - ${t.id} | expects_pattern=${t.expects_pattern} | expects_no_pattern=${t.expects_no_pattern}`,
      );
    }
    process.exit(0);
  }
  // Auth: the `claude` CLI runs under whatever credentials it already has — a
  // subscription OAuth login (~/.claude/.credentials.json) or ANTHROPIC_API_KEY.
  // We do NOT require the paid per-token key; we only require the CLI to be
  // present and runnable. If it is not, fail open (advisory, never blocks a gate).
  const cliOk = await new Promise((resolve) => {
    try {
      const probe = spawn('claude', ['--version']);
      probe.on('close', (code) => resolve(code === 0));
      probe.on('error', () => resolve(false));
    } catch {
      resolve(false);
    }
  });
  if (!cliOk) {
    console.warn(
      '[behavioral] claude CLI unavailable — skipping (fail-open). Log in with `claude` (subscription OAuth) or set ANTHROPIC_API_KEY.',
    );
    process.exit(0);
  }

  console.log(`[behavioral] running ${tasks.length} task(s) × 2 modes × ${TRIALS} trials\n`);
  const results = [];
  let regressionDetected = false;
  for (const task of tasks) {
    const a = await runTaskMode(task, 'A');
    const b = await runTaskMode(task, 'B');
    const aPassRate = a.passes / TRIALS;
    const bPassRate = b.passes / TRIALS;
    const regressed = aPassRate < bPassRate;
    if (regressed) regressionDetected = true;
    results.push({
      id: task.id,
      A: { softPass: a.pass, passRate: aPassRate, spawnFailed: a.spawnFailed },
      B: { softPass: b.pass, passRate: bPassRate, spawnFailed: b.spawnFailed },
      regressed,
      delta_A_minus_B: aPassRate - bPassRate,
    });
    const mark = (m) => (m.spawnFailed ? 'ERR' : m.softPass ? 'PASS' : 'FAIL');
    console.log(
      `  ${task.id}: A=${mark(a)}/${aPassRate.toFixed(2)}  B=${mark(b)}/${bPassRate.toFixed(2)}  ${regressed ? '⚠️ regression' : 'ok'}`,
    );
  }
  const summary = {
    ranAt: new Date().toISOString(),
    taskCount: tasks.length,
    trialsPerMode: TRIALS,
    results,
    regressions: results.filter((r) => r.regressed).length,
    passRateB_avg: results.reduce((s, r) => s + r.B.passRate, 0) / results.length,
    passRateA_avg: results.reduce((s, r) => s + r.A.passRate, 0) / results.length,
  };
  fs.writeFileSync(LAST_RUN_PATH, JSON.stringify(summary, null, 2) + '\n');
  console.log(`\n[behavioral] summary written to ${path.relative(ROOT, LAST_RUN_PATH)}`);
  console.log(`[behavioral] regressions: ${summary.regressions}/${summary.taskCount}`);
  process.exit(regressionDetected ? 1 : 0);
}

main().catch((err) => {
  console.error('[behavioral] unhandled error:', err);
  process.exit(0); // fail-open
});
