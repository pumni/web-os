// Stop hook — deterministic AI-context gate.
//
// Turns the otherwise-advisory `ai:check` into enforcement, but ONLY when the
// session actually touched AI-context files (root agent docs, docs/ai,
// conventions, architecture, skills, rules, the gate scripts). Normal coding
// sessions pay nothing: a fast `git status` returns no context paths and the
// hook exits 0 immediately.
//
// On a real failure it asks Claude to keep going and fix it (decision: block,
// honored where the runtime supports Stop-blocking). Contract: fail-open — any
// infra error (no git, detached state, missing bun) exits 0 so the agent is
// never wedged. CI (`bun run ai:premerge`) remains the authoritative gate.

import { spawnSync } from 'node:child_process';

// Paths whose edits must re-pass the structural context gate before "done".
const CONTEXT = new RegExp(
  [
    '^(?:AGENTS|CLAUDE)\\.md$',
    '^\\.mcp\\.json$',
    '^\\.github/copilot-instructions\\.md$',
    '^docs/(?:ai|conventions|architecture|adr)/',
    '^\\.agents/',
    '^\\.claude/(?:rules|skills)/',
    '^scripts/(?:check-ai-context|sync-skills|sync-project-graph|check-secrets|review-gate-rules)\\.mjs$',
    '^scripts/ai-context\\.manifest\\.json$',
    '^apps/[^/]+/AGENTS\\.md$',
    '^packages/[^/]+/AGENTS\\.md$',
  ].join('|'),
);

async function readStdin() {
  if (process.stdin.isTTY) return '';
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

function changedContextFiles(cwd) {
  const res = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], {
    cwd,
    encoding: 'utf8',
    timeout: 15_000,
  });
  if (res.status !== 0 || !res.stdout) return [];
  return res.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim()) // strip XY status columns
    .map((p) => (p.includes('->') ? p.split('->').pop().trim() : p)) // renames
    .map((p) => p.replace(/^"|"$/g, '')) // quoted paths
    .filter((p) => CONTEXT.test(p));
}

try {
  const payload = JSON.parse((await readStdin()) || '{}');
  // Never re-block on a stop we already triggered (loop guard).
  if (payload?.stop_hook_active) process.exit(0);

  const cwd = payload?.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  if (changedContextFiles(cwd).length === 0) process.exit(0);

  const check = spawnSync('bun', ['scripts/check-ai-context.mjs'], {
    cwd,
    encoding: 'utf8',
    timeout: 110_000,
  });
  if (check.status === 0) process.exit(0);

  const detail = `${check.stdout || ''}${check.stderr || ''}`
    .split('\n')
    .filter((l) => l.includes('[ERROR]'))
    .slice(0, 12)
    .join('\n');

  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason:
        'AI-context files changed and `bun scripts/check-ai-context.mjs` failed. ' +
        'Fix these before finishing:\n' +
        (detail || '(run `bun run ai:check` to see the failures)'),
    }),
  );
} catch {
  // fail-open
}

process.exit(0);
