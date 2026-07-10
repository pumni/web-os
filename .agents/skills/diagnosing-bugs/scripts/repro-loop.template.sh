#!/usr/bin/env bash
# repro-loop.template.sh — cross-platform fallback (non-Windows / `bun run`).
# On Windows prefer repro-loop.template.ps1 — PowerShell 7 is the repo's
# canonical shell (AGENTS.md). Copy into a scratch location, fill in REPRO_CMD,
# run.
#
# A red-capable feedback loop for diagnosing-bugs phase 1. It must fail on the
# user's exact symptom before you form a primary hypothesis. Re-run after each
# one-hypothesis-at-a-time probe; stop when it flips red -> green.
#
# Usage:
#   1. Set REPRO_CMD to the narrowest command that drives the bug path
#      (a focused test is preferred over a full suite).
#   2. For flakes, raise RUNS to stress the timing window.
#   3. Delete this file when the bug is fixed and the regression test landed.

set -uo pipefail

# The narrowest command that reproduces the symptom. Examples:
#   bun run test -- path/to/file.test.ts -t "exact failing case"
#   bun run typecheck
#   bun run ai:eval
REPRO_CMD=${REPRO_CMD:-"bun run test"}

# Repeat to surface flakes; 1 for a deterministic bug.
RUNS=${RUNS:-1}

fail=0
for i in $(seq 1 "$RUNS"); do
  echo "[repro-loop] run $i/$RUNS: $REPRO_CMD"
  if ! eval "$REPRO_CMD"; then
    fail=$((fail + 1))
    echo "[repro-loop] run $i: RED (reproduced)"
  else
    echo "[repro-loop] run $i: green"
  fi
done

echo "[repro-loop] reproduced $fail/$RUNS run(s)."
# Exit non-zero while the bug still reproduces, so this can gate a fix.
[ "$fail" -eq 0 ]
