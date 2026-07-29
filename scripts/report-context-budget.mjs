/**
 * report-context-budget.mjs — Token & Context Load Budget Analyzer (Scenario-Based)
 *
 * Estimates startup, path-scoped, skill metadata, and activated skill tokens per harness scenario.
 * Note: Token counts are estimated using the standard 4 chars/token approximation.
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

function readFileSafe(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) return '';
  return fs.readFileSync(fullPath, 'utf8');
}

function analyzeHarnessScenario(harnessName, entryFile, scopedRuleFiles = [], sampleActivatedSkills = []) {
  const entryContent = readFileSafe(entryFile);
  const alwaysLoadedTokens = estimateTokens(entryContent);

  let scopedBytes = 0;
  for (const rf of scopedRuleFiles) {
    scopedBytes += readFileSafe(rf).length;
  }
  const scopedInstructionTokens = estimateTokens(' '.repeat(scopedBytes));

  const skillFiles = globSync('.agents/skills/*/SKILL.md', { cwd: ROOT });
  let skillMetadataBytes = 0;
  for (const sf of skillFiles) {
    const content = readFileSafe(sf);
    // Extract frontmatter / metadata section
    const endFm = content.indexOf('\n---', 4);
    if (endFm !== -1) {
      skillMetadataBytes += content.slice(0, endFm + 4).length;
    } else {
      skillMetadataBytes += 200; // estimated frontmatter size
    }
  }
  const skillMetadataTokens = estimateTokens(' '.repeat(skillMetadataBytes));

  let activatedSkillBytes = 0;
  for (const skName of sampleActivatedSkills) {
    const skPath = `.agents/skills/${skName}/SKILL.md`;
    activatedSkillBytes += readFileSafe(skPath).length;
  }
  const activatedSkillBodyTokens = estimateTokens(' '.repeat(activatedSkillBytes));

  return {
    harness: harnessName,
    alwaysLoadedTokens,
    scopedInstructionTokens,
    skillMetadataTokens,
    activatedSkillBodyTokens,
    totalEstimatedTokens: alwaysLoadedTokens + scopedInstructionTokens + skillMetadataTokens + activatedSkillBodyTokens,
  };
}

function main() {
  console.log('=== Context Load Token Budget Analysis (Scenario Prototype) ===');
  console.log('Disclaimer: Token numbers are estimates (~4 characters / token).\n');

  const claudeRules = globSync('.claude/rules/*.md', { cwd: ROOT });

  const claudeScenario = analyzeHarnessScenario('Claude Code', 'CLAUDE.md', claudeRules, ['feature-module', 'server-action']);
  const codexScenario = analyzeHarnessScenario('Codex CLI', 'AGENTS.md', [], ['feature-module', 'server-action']);
  const copilotScenario = analyzeHarnessScenario('GitHub Copilot', '.github/copilot-instructions.md', [], ['feature-module', 'server-action']);

  console.table([claudeScenario, codexScenario, copilotScenario]);
}

main();
