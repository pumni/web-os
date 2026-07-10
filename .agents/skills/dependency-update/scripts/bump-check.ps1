#!/usr/bin/env pwsh
# bump-check.ps1 — Snapshot outdated deps and print risk tier for each.
# Usage: pwsh -File .agents/skills/dependency-update/scripts/bump-check.ps1

Write-Host "`n=== Outdated dependencies ===" -ForegroundColor Cyan
bun outdated 2>&1

Write-Host "`n=== Risk tier reminder ===" -ForegroundColor Yellow
Write-Host @"
Tier A (safe)  — patch bumps (0.0.X), devDependencies with no public API
Tier B (review) — minor bumps (0.X.0), peer-dep changes, config schema changes
Tier C (plan)  — major bumps (X.0.0), breaking API changes, lock-file conflicts

For each Tier B/C dep: read CHANGELOG before bumping.
Gate: bun run typecheck && bun run test (for runtime deps)
      bun run ai:check (for context/config deps)
"@
