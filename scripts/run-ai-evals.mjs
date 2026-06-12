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
import fs from 'node:fs';
import { RULES } from './review-gate-rules.mjs';

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

function parseFrontmatter(relativePath) {
  const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return {};
  const end = content.indexOf('\n---', 4);
  if (end === -1) return {};

  const frontmatter = {};
  for (const rawLine of content.slice(4, end).split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(rawLine);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.trim();
    if (value === 'true') {
      frontmatter[key] = true;
    } else if (value === 'false') {
      frontmatter[key] = false;
    } else if (value.startsWith('[') && value.endsWith(']')) {
      frontmatter[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      frontmatter[key] = value;
    }
  }
  return frontmatter;
}

function printEvalCoverageReport() {
  console.log('\n=== Eval coverage ===');
  const evalDir = path.join(ROOT, '.agents', 'evals');
  const evalFiles = fs.readdirSync(evalDir)
    .filter((fileName) => fileName.endsWith('.md'))
    .sort()
    .map((fileName) => `.agents/evals/${fileName}`);

  const coveredRules = new Map();
  let automated = 0;
  let manual = 0;

  for (const relativePath of evalFiles) {
    const frontmatter = parseFrontmatter(relativePath);
    if (frontmatter.manual === true) manual++;
    if (frontmatter['automated-rule']) automated++;

    const rules = new Set([
      frontmatter['automated-rule'],
      ...(Array.isArray(frontmatter['covered-rules']) ? frontmatter['covered-rules'] : []),
    ].filter(Boolean));

    for (const ruleId of rules) {
      if (!coveredRules.has(ruleId)) coveredRules.set(ruleId, []);
      coveredRules.get(ruleId).push(relativePath);
    }
  }

  const ruleIds = Object.values(RULES);
  console.log(`Evals: ${evalFiles.length} total (${automated} automated, ${manual} manual).`);
  console.log(`Static rule coverage: ${coveredRules.size}/${ruleIds.length} rules covered by at least one eval.`);

  const missing = ruleIds.filter((ruleId) => !coveredRules.has(ruleId));
  if (missing.length > 0) {
    console.error(`[ERROR] Static rules without eval coverage: ${missing.join(', ')}`);
    failed = true;
  }
}

// 0. Sanity-check the analyzer itself before trusting its verdict.
runScript('Review Gate self-test', 'check-review-gate-rules.mjs', ['--self-test']);

// 1. Static architecture / security rules across the codebase.
runScript('Review Gate static rules', 'check-review-gate-rules.mjs');

// 2. Secrets scan.
runScript('Secrets scan', 'check-secrets.mjs');

// 3. Eval inventory and rule coverage.
printEvalCoverageReport();

if (failed) {
  console.error('\n[FAIL] AI regression evals failed.');
  process.exit(1);
}
console.log('\n[PASS] All AI regression evals passed.');
