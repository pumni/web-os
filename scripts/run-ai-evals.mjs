/**
 * ai:eval — AI regression evals for Pumni Web OS.
 *
 * Runs the deterministic policy gates an AI agent must pass before "done":
 *   1. Review Gate static rules (architecture + RLS + Query/Zustand boundaries)
 *   2. Secrets scan (.env committed, hardcoded keys, service-role literals)
 *   3. Eval inventory and coverage report
 *
 * Agent-backed behavioral evals are intentionally a separate tier:
 *   bun run ai:eval:behavioral
 * Local deterministic smoke:
 *   bun run ai:eval:behavioral:stub
 *
 * The RN-specific raw-console.log scanner is intentionally omitted: console
 * logging is acceptable in a Next.js web app.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { RULES } from './review-gate-rules.mjs';
import { parseFrontmatter } from './frontmatter.mjs';

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

function printEvalCoverageReport() {
  console.log('\n=== Eval coverage ===');
  const evalDir = path.join(ROOT, '.agents', 'evals');
  const evalFiles = fs.existsSync(evalDir)
    ? fs.readdirSync(evalDir).filter((fileName) => fileName.endsWith('.md'))
    : [];

  let behavioral = 0;
  let manual = 0;

  for (const fileName of evalFiles) {
    const relativePath = `.agents/evals/${fileName}`;
    const frontmatter = parseFrontmatter(relativePath);
    if (!frontmatter) continue;
    if (frontmatter.behavioral === true) {
      behavioral++;
    } else if (frontmatter.manual === true) {
      manual++;
    }
  }

  const ruleIds = Object.values(RULES);
  console.log(`Static rules enforced: ${ruleIds.length}/${ruleIds.length} (proven by --self-test)`);
  console.log(`Behavioral scenarios: ${behavioral} (run by run-behavioral-evals.mjs), manual evals: ${manual}`);
}

// 0. Sanity-check the analyzer itself before trusting its verdict.
runScript('Review Gate self-test', 'check-review-gate-rules.mjs', ['--self-test']);

// 1. Static architecture / security rules across the codebase.
runScript('Review Gate static rules', 'check-review-gate-rules.mjs');

// 2. Secrets scan.
runScript('Secrets scan', 'check-secrets.mjs');

// 3. Eval inventory and rule coverage.
printEvalCoverageReport();

console.log('\n=== Behavioral eval tier ===');
console.log('Agent-backed behavioral evals are separate: bun run ai:eval:behavioral');
console.log('Local deterministic smoke: bun run ai:eval:behavioral:stub');

if (failed) {
  console.error('\n[FAIL] AI regression evals failed.');
  process.exit(1);
}
console.log('\n[PASS] All AI regression evals passed.');
