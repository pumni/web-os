import { spawnSync } from 'node:child_process';
const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
try {
  const res = spawnSync('bun', ['scripts/check-context-drift.mjs', '--since=HEAD~1'], {
    cwd, encoding: 'utf8', timeout: 20_000,
  });
  const text = (res.stdout || '').trim();
  if (text) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text },
    }));
  }
} catch {
  // fail-open
}
process.exit(0);
