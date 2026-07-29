/**
 * report-context-budget.mjs — Token & Context Load Budget Analyzer
 *
 * Measures startup, path-scoped, nested, and skill token metrics across harnesses.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function estimateTokens(text) {
  return Math.round((text || '').length / 4);
}

function analyzeHarness(harnessName, entryFile, ruleFiles = [], nestedFiles = []) {
  let startupBytes = 0;
  let loadedFiles = 0;

  if (fs.existsSync(path.join(ROOT, entryFile))) {
    startupBytes += fs.readFileSync(path.join(ROOT, entryFile), 'utf8').length;
    loadedFiles++;
  }

  let pathRuleBytes = 0;
  for (const rf of ruleFiles) {
    const fullPath = path.join(ROOT, rf);
    if (fs.existsSync(fullPath)) {
      pathRuleBytes += fs.readFileSync(fullPath, 'utf8').length;
      loadedFiles++;
    }
  }

  let nestedBytes = 0;
  for (const nf of nestedFiles) {
    const fullPath = path.join(ROOT, nf);
    if (fs.existsSync(fullPath)) {
      nestedBytes += fs.readFileSync(fullPath, 'utf8').length;
    }
  }

  const skills = globSync('.agents/skills/*/SKILL.md', { cwd: ROOT });
  let skillBytes = 0;
  for (const sk of skills) {
    skillBytes += fs.readFileSync(path.join(ROOT, sk), 'utf8').length;
  }

  return {
    harness: harnessName,
    startupTokens: estimateTokens(fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8')),
    pathScopedRuleTokens: estimateTokens(' '.repeat(pathRuleBytes)),
    nestedContextTokens: estimateTokens(' '.repeat(nestedBytes)),
    skillCatalogTokens: estimateTokens(' '.repeat(skillBytes)),
    totalStartupFiles: loadedFiles,
  };
}

function main() {
  console.log('=== Aggregate Context Token Budget Report ===\n');

  const claudeRules = globSync('.claude/rules/*.md', { cwd: ROOT });
  const nestedAgents = globSync('{apps,packages}/*/AGENTS.md', { cwd: ROOT });

  const claudeStats = analyzeHarness('Claude Code', 'CLAUDE.md', claudeRules, nestedAgents);
  const codexStats = analyzeHarness('Codex CLI', 'AGENTS.md', [], nestedAgents);
  const copilotStats = analyzeHarness('GitHub Copilot', '.github/copilot-instructions.md', [], []);

  console.table([claudeStats, codexStats, copilotStats]);
}

main();
