// PostToolUse formatter hook (Edit | Write | MultiEdit).
//
// Runs Prettier on the single file the agent just wrote, so formatting never
// has to live as prose rules in the context window (the "free the context"
// win from both context-architecture reports). Single-file = fast.
//
// Contract: fail-open. Any error, missing tool, or unformattable file exits 0
// and stays silent — a formatter must never wedge or interrupt the agent.

import { spawnSync } from 'node:child_process';
import path from 'node:path';

// Code/config only. Markdown is intentionally excluded: this repo hand-formats
// its size-budgeted context docs (compact tables), and Prettier's markdown
// table-padding would blow the budgets in scripts/ai-context.manifest.json.
const FORMATTABLE = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.scss',
  '.json',
  '.jsonc',
  '.yaml',
  '.yml',
]);

async function readStdin() {
  if (process.stdin.isTTY) return '';
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

try {
  const payload = JSON.parse((await readStdin()) || '{}');
  const filePath = payload?.tool_input?.file_path;
  if (!filePath) process.exit(0);

  const ext = path.extname(filePath).toLowerCase();
  if (!FORMATTABLE.has(ext)) process.exit(0);

  // --ignore-unknown also makes Prettier respect .prettierignore (generated
  // files like packages/supabase/src/types.ts stay untouched).
  spawnSync('bun', ['x', 'prettier', '--write', '--ignore-unknown', filePath], {
    cwd: payload?.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    stdio: 'ignore',
    timeout: 50_000,
  });
} catch {
  // fail-open
}

process.exit(0);
