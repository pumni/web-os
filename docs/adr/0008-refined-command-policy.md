# 0008. Refined Command Policy

> Renumbered from 0007 (collided with `0007-context-efficiency-2026.md`); see ADR-0009.

- **Status:** Deprecated (all decisions fully implemented in `docs/ai/agent-command-policy.md`; `&&` resolution, `$` hazard, `bun run` preference, no `.ps1` scripts)
- **Date:** 2026-06-19
- **Owner:** AI command execution (see `docs/ai/agent-command-policy.md`)

## Context

Following evaluations of agent execution on Windows host environments, several core gaps and contradictions were identified:
1. **Internal Contradiction:** `AGENTS.md` instructed agents to avoid the `&&` operator on Windows, while `docs/ai/agent-command-policy.md` explicitly recommended using it. In reality, `&&` is fully supported in PowerShell 7 (`pwsh`) and Git Bash, but is a parser error in Windows PowerShell 5.1.
2. **Harness Host Shell Pre-Evaluation:** AI agents execute shell commands via the harness's host environment (e.g. Windows PowerShell 5.1 or Git Bash), which pre-evaluates or strips variables and special symbols like `$` (e.g., `$env:NAME` or `$null`) before they are executed. This makes complex commands that rely on PowerShell variable syntax extremely brittle and prone to failure.
3. **Inappropriate Translation Table:** The Unix-to-PowerShell translation tutorial instructed agents to write complex PowerShell cmdlets rather than relying on native harness tools (`view_file`, `grep_search`, `list_dir`) or standard cross-platform Node/Bun scripts, leading to higher complexity and higher failure rates.

## Decision

Refine the command execution guidelines to align with actual harness behavior:
1. **Resolve `&&` Contradiction:** Update `AGENTS.md` and `docs/ai/agent-command-policy.md` to clarify that `&&` works in pwsh 7 and Git Bash but fails in Windows PowerShell 5.1, recommending sequential execution or `;` for safety when the shell is uncertain.
2. **Document Host Shell Risks:** Explicitly warn agents about variable pre-evaluation/stripping issues with `$` in the host shell, instructing them to avoid inline environment variables or `$null` redirections where possible.
3. **Prefer Harness Tools and Node/Bun Scripts:** Replace the Unix-to-PowerShell cmdlets translation table with guidelines that prioritize harness tools (`view_file`, `grep_search`, etc.) for query/search, and cross-shell scripts (Node/Bun) or Git Bash native utilities for terminal operations.
4. **Introduce Bun-based Workflow via Scripts:** Establish a practice where complex or multi-step operations are executed via Bun scripts (`scripts/*.mjs`) wired into `package.json`, bypassing shell parsing limitations and ensuring cross-platform portability. Native PowerShell 7 (`.ps1`) scripts are avoided to keep the repository logic shell-agnostic.

## Consequences

**Positive:**
- AI agent commands are safer, more robust, and more portable across different harness environments.
- Eliminated internal rule contradictions that could confuse agents during execution or evaluations.
- Reduced shell-code complexity by encouraging the use of harness-provided tools rather than raw shell commands.
- Leverages Bun's cross-platform performance and safety features natively for multi-step tasks by executing structured `.mjs` files.

**Negative / costs:**
- Removal of the detailed PowerShell syntax tutorial (which was largely a source of errors rather than utility for the agent).
- Requires maintaining the script runner files in the repository.

## Implementation

- **2026-07-02 (round 1):** All four decisions implemented in
  `docs/ai/agent-command-policy.md`. File stripped of harness-specific noise
  (Claude Code hooks, Codex sandbox, CI layer docs).

- **2026-07-02 (round 2):** Further refinement after independent best-practice
  review:
  - Softened "pwsh only" → "repo default shell" acknowledging cross-platform
    agent reality; emphasized `bun run <script>` as the shell-agnostic path.
  - Clarified `$env` hazard with root cause (host shell pre-evaluation chain) so
    agents understand *when* inline `-Command` is risky vs safe.
  - Emphasized `bun run <script>` as the shell-agnostic path and explicitly
    deprecated the use of `.ps1` repository scripts.
  - Validation table restructured: each row names a **narrowest gate** with an
    optional escalation column; E2E added as explicit scope; gate order is
    sequential (`lint && typecheck && test`). Added "narrowest first, fix before
    moving" preamble matching `AGENTS.md` and `review-gate.md` intent.

## References

- `docs/ai/agent-command-policy.md` - Command Policy.
- `AGENTS.md` - AI Instructions.
- `scripts/check-ai-context.mjs` - Context validator.
- `scripts/sync-project-graph.mjs` - Project graph synchronizer.
