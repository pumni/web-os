#!/usr/bin/env pwsh
# token-check.ps1 — Scan for raw CSS values that should use OKLCH design tokens.
# Usage: pwsh -File .agents/skills/ui-styling/scripts/token-check.ps1 [path]
# Default path: apps/web/src and packages/ui/src
param(
    [string]$Path = "."
)

$searchPaths = @(
    "apps/web/src",
    "packages/ui/src"
) | Where-Object { Test-Path $_ }

Write-Host "`n=== Raw color checks (should use OKLCH tokens) ===" -ForegroundColor Cyan

# Hex colors in TSX/CSS (flag for review — some are legitimate, e.g. brand logos)
$hexMatches = rg --glob "*.{tsx,ts,css}" "#[0-9a-fA-F]{3,6}\b" $searchPaths --count-matches 2>$null
if ($hexMatches) {
    Write-Host "`nHex colors found (verify these use tokens or have a known exception):" -ForegroundColor Yellow
    $hexMatches | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "No bare hex colors found." -ForegroundColor Green
}

# rgb()/hsl() without CSS variable wrapper
$rgbMatches = rg --glob "*.{tsx,ts,css}" "\b(rgb|hsl)\s*\(" $searchPaths --count-matches 2>$null
if ($rgbMatches) {
    Write-Host "`nrgh/hsl() calls found (prefer oklch() tokens via CSS vars):" -ForegroundColor Yellow
    $rgbMatches | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "No bare rgb/hsl() calls found." -ForegroundColor Green
}

Write-Host "`n=== Tailwind arbitrary value checks ===" -ForegroundColor Cyan

# Arbitrary color values in class strings
$arbitraryColors = rg --glob "*.{tsx,ts}" "\[(#[0-9a-fA-F]{3,6}|rgb|hsl|oklch)[^\]]*\]" $searchPaths --count-matches 2>$null
if ($arbitraryColors) {
    Write-Host "Arbitrary color values found (check if token exists in theme.css):" -ForegroundColor Yellow
    $arbitraryColors | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "No arbitrary color values found." -ForegroundColor Green
}

Write-Host "`nDone. Review flagged files against docs/conventions/design-system.md" -ForegroundColor Cyan
