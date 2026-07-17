import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const parts = [];
try {
  // Post-compaction/resume re-anchor: long-context constraint compliance decays
  // (ADR-0024) — re-surface the always-on contract after the transcript is cut.
  const input = JSON.parse(readFileSync(0, 'utf8'));
  if (input.source === 'compact' || input.source === 'resume') {
    parts.push(
      'Re-anchor after compaction/resume: re-read AGENTS.md (P0 <SECURITY_MANDATES>, Priority Stack, Definition of Done) before continuing. Prohibition-style rules decay fastest in long sessions — restate the P0 never-list (never bypass RLS, never expose the service-role key client-side, never import server-only code into client components, never disable validation) before acting.',
    );
  }
} catch {
  // fail-open (no stdin / not JSON)
}
try {
  const res = spawnSync('bun', ['scripts/check-context-drift.mjs', '--since=HEAD~5'], {
    cwd,
    encoding: 'utf8',
    timeout: 20_000,
  });
  const text = (res.stdout || '').trim();
  if (text) parts.push(text);
} catch {
  // fail-open
}
if (parts.length) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: parts.join('\n\n') },
    }),
  );
}
process.exit(0);
