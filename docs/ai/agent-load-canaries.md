---
description: Verification markers and load canary matrix for coding agent adapters.
---

# Agent Load Canaries Matrix

This matrix tracks entry points, instruction loading behaviors, path-scope capabilities, and empirical canary evidence for supported coding agents. All entries remain `UNVERIFIED` until backed by verified execution traces.

## Schema Standard

Every canary entry requires:
- `status`: `UNVERIFIED` | `PASS` | `FAIL`
- `verifiedAt`: ISO Timestamp or `null`
- `verifiedCommit`: Git commit SHA or `null`
- `harnessVersion`: Version string or `null`
- `command`: Execution command used to test
- `expectedObservation`: Expected marker or load behavior
- `actualObservation`: Observed marker or load behavior
- `evidencePath`: Path to transcript, log, or trace artifact

---

## Claude Code (#claude-code)

- **Status**: `UNVERIFIED`
- **Agent / Surface**: Claude Code CLI
- **Entry File**: `CLAUDE.md` (imports `@AGENTS.md`)
- **Verified At**: `null`
- **Verified Commit**: `null`
- **Harness Version**: `null`
- **Command**: `claude --print "Check instruction load"`
- **Expected Observation**: `[CANARY:CLAUDE_CODE_LOADED]`
- **Actual Observation**: `TBD`
- **Evidence Path**: `null`
- **Failure Action**: Fallback to direct reading of root `AGENTS.md` and `docs/conventions/*`.

## Codex CLI (#codex-cli)

- **Status**: `UNVERIFIED`
- **Agent / Surface**: OpenAI Codex CLI
- **Entry File**: `AGENTS.md` (Native root entry point)
- **Verified At**: `null`
- **Verified Commit**: `null`
- **Harness Version**: `null`
- **Command**: `codex "Check instruction load"`
- **Expected Observation**: `[CANARY:CODEX_AGENTS_MD_LOADED]`
- **Actual Observation**: `TBD`
- **Evidence Path**: `null`
- **Failure Action**: Direct prompt-injection of root `AGENTS.md` invariants.

## GitHub Copilot (#github-copilot)

- **Status**: `UNVERIFIED`
- **Agent / Surface**: GitHub Copilot Extension
- **Entry File**: `.github/copilot-instructions.md`
- **Verified At**: `null`
- **Verified Commit**: `null`
- **Harness Version**: `null`
- **Command**: `TBD`
- **Expected Observation**: `[CANARY:COPILOT_INSTRUCTIONS_LOADED]`
- **Actual Observation**: `TBD`
- **Evidence Path**: `null`
- **Failure Action**: Fallback to repository root `AGENTS.md`.
