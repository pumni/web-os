/**
 * policy:check — Static code & policy enforcement gate for Pumni Web OS.
 *
 * Runs the small checks that do not already have a stronger owner:
 *   1. Secret exposure defense-in-depth (.env files and hardcoded keys)
 *   2. Characterization of the generated ESLint feature boundary
 *
 * TypeScript, ESLint, Next.js build, Vitest migration tests, and Supabase RLS
 * own the correctness rules that used to be approximated by a general parser.
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

// Secret exposure remains useful as low-noise defense in depth.
runScript('Secret scan', 'check-secrets.mjs');

// The test must exercise the same ESLint config consumed by apps/web.
runScript('Feature boundary characterization', 'check-feature-boundary.mjs');

if (failed) {
  console.error('\n[FAIL] Static policy checks failed.');
  process.exit(1);
}
console.log('\n[PASS] All static policy checks passed.');
