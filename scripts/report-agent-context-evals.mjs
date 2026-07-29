/**
 * report-agent-context-evals.mjs — Aggregate Reporter for Behavioral Context Evals
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASELINE_PATH = path.join(ROOT, 'evals', 'agent-context', 'baselines', 'latest.json');

function main() {
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(`[ERROR] Baseline results not found at ${BASELINE_PATH}. Run bun run ai:context-eval first.`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  console.log('=== Agent Context Behavioral Evaluation Summary ===\n');

  for (const [treatment, summary] of Object.entries(data)) {
    console.log(`${treatment}:`);
    console.log(`  Success Rate: ${summary.successRatePct}% (${summary.passed}/${summary.totalTasks})`);
    console.log(`  Critical Violations: ${summary.criticalViolations}`);
  }
}

main();
