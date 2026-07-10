# repro-loop.template.ps1 — copy into a scratch location, fill in $ReproCmd, run.
#
# A red-capable feedback loop for diagnosing-bugs phase 1. It MUST fail on the
# user's exact symptom before you form a primary hypothesis. Re-run after each
# one-hypothesis-at-a-time probe; stop when it flips red -> green.
#
# Usage (PowerShell 7+):
#   1. Set $ReproCmd to the narrowest command that drives the bug path
#      (a focused test is preferred over a full suite).
#   2. For flakes, raise $Runs to stress the timing window.
#   3. Delete this file when the bug is fixed and the regression test landed.
#
# This is the canonical PowerShell 7 port of repro-loop.template.sh (the
# AGENTS.md canonical shell is pwsh, so prefer this one on Windows; the .sh
# twin stays cross-platform via `bun run`).

# The narrowest command that reproduces the symptom. Examples:
#   bun run test -- path/to/file.test.ts -t "exact failing case"
#   bun run typecheck
#   bun run ai:eval
$ReproCmd ??= 'bun run test'

# Repeat to surface flakes; 1 for a deterministic bug.
$Runs ??= 1

$fail = 0
for ($i = 1; $i -le $Runs; $i++) {
  Write-Host "[repro-loop] run $i/$Runs : $ReproCmd"
  # Invoke-Expression keeps the command string as the user typed it; for
  # one-word commands prefer & $ReproCmd split on spaces.
  $ok = $false
  try {
    Invoke-Expression $ReproCmd
    if ($LASTEXITCODE -eq 0) { $ok = $true }
  } catch {
    $ok = $false
  }
  if (-not $ok) {
    $fail++
    Write-Host "[repro-loop] run $i : RED (reproduced)"
  } else {
    Write-Host "[repro-loop] run $i : green"
  }
}

Write-Host "[repro-loop] reproduced $fail/$Runs run(s)."
# Exit non-zero while the bug still reproduces, so this can gate a fix.
if ($fail -eq 0) { exit 0 } else { exit 1 }
