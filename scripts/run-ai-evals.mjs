/**
 * ai:eval — AI regression evals for Pumni Web OS.
 *
 * Runs the deterministic policy gates an AI agent must pass before "done":
 *   1. Review Gate static rules (architecture + RLS + Query/Zustand boundaries)
 *   2. Secrets scan (.env committed, hardcoded keys, service-role literals)
 *
 * The RN-specific raw-console.log scanner is intentionally omitted: console
 * logging is acceptable in a Next.js web app.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let failed = false;

function runScript(label, scriptName, extraArgs = []) {
  console.log(`\n=== ${label} ===`);
  try {
    execFileSync(process.execPath, [path.join(__dirname, scriptName), ...extraArgs], {
      stdio: 'inherit',
      cwd: ROOT,
    });
  } catch {
    console.error(`[ERROR] ${label} failed.`);
    failed = true;
  }
}

// 0. Sanity-check the analyzer itself before trusting its verdict.
runScript('Review Gate self-test', 'check-review-gate-rules.mjs', ['--self-test']);

// 1. Static architecture / security rules across the codebase.
runScript('Review Gate static rules', 'check-review-gate-rules.mjs');

// 2. Secrets scan.
runScript('Secrets scan', 'check-secrets.mjs');

if (failed) {
  console.error('\n[FAIL] AI regression evals failed.');
  process.exit(1);
}
console.log('\n[PASS] All AI regression evals passed.');
