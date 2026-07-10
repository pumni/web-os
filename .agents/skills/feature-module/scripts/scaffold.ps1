#!/usr/bin/env pwsh
# scaffold.ps1 — Scaffold a new vertical feature slice.
# Usage: pwsh -File .agents/skills/feature-module/scripts/scaffold.ps1 -FeatureName <name>
param(
    [Parameter(Mandatory)][string]$FeatureName
)

$base = "apps/web/src/features/$FeatureName"

if (Test-Path $base) {
    Write-Error "Feature '$FeatureName' already exists at $base"
    exit 1
}

$dirs  = @("$base", "$base/__tests__")
$files = @{
    "$base/queries.ts"  = "// Server-side reads — see server-component-read skill`n'use cache'`n`nexport async function get$((Get-Culture).TextInfo.ToTitleCase($FeatureName))() {`n  // TODO`n}`n"
    "$base/actions.ts"  = "'use server'`n// Server Actions — see server-action skill`n`nexport async function save$((Get-Culture).TextInfo.ToTitleCase($FeatureName))() {`n  // TODO`n}`n"
    "$base/index.ts"    = "// Public surface — re-export only what features/ consumers need`n"
}

foreach ($d in $dirs)  { New-Item -ItemType Directory -Force $d | Out-Null }
foreach ($kv in $files.GetEnumerator()) {
    Set-Content -Path $kv.Key -Value $kv.Value -NoNewline
}

Write-Host "Scaffolded feature '$FeatureName' at $base" -ForegroundColor Green
Write-Host "Next: read .agents/skills/feature-module/SKILL.md for layout rules." -ForegroundColor Yellow
