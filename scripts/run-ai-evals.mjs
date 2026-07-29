/**
 * ai:review — Static code & policy review gate for Pumni Web OS.
 *
 * Runs deterministic static policy checks:
 *   1. Review Gate static rules (architecture + RLS + Query/Zustand boundaries)
 *   2. Secrets scan (.env committed, hardcoded keys, service-role literals)
 *   3. Feature boundary check
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

// 3. Feature-boundary firewall: rules stay derived from the real features tree.
runScript('Feature boundary check', 'check-feature-boundary.mjs');

if (failed) {
  console.error('\n[FAIL] Static review checks failed.');
  process.exit(1);
}
console.log('\n[PASS] All static review checks passed.');
