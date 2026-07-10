# Skill Health Check

Lightweight self-audit to catch skill drift before it causes invocation misses.
Run periodically or whenever skills are edited in bulk.

## When to use

- After adding or editing 3+ skills in one session.
- When `bun run ai:eval` reports unexpected skill-match failures.
- As part of a quarterly context-layer review.

## Procedure

### 1. Structural gate
```powershell
bun run ai:check
```
Must pass with 0 warnings. If it fails, fix shims/frontmatter first.

### 2. Path-existence check
For each skill, verify that every file path referenced in its `SKILL.md`
(e.g. template paths, rule doc links) still exists in the repo:

```powershell
Get-ChildItem .agents/skills -Recurse -Filter SKILL.md | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $paths = [regex]::Matches($content, '`([^`]+\.(ts|tsx|md|mjs|sql|json))`') |
             ForEach-Object { $_.Groups[1].Value } |
             Where-Object { $_ -notmatch '^bun|^npm|^pwsh' }
    foreach ($p in $paths) {
        if (-not (Test-Path $p)) {
            Write-Warning "$($_.Directory.Name): referenced path not found: $p"
        }
    }
}
```

### 3. Evals schema check
Verify every `evals/evals.json` has required top-level keys:
```powershell
Get-ChildItem .agents/skills -Recurse -Filter evals.json | ForEach-Object {
    $j = Get-Content $_.FullName | ConvertFrom-Json
    if (-not $j.skill_name) { Write-Warning "$($_.FullName): missing skill_name" }
    if (-not $j.evals)      { Write-Warning "$($_.FullName): missing evals array" }
}
```

### 4. Description freshness review
Manually skim each skill `description` frontmatter field against the current
codebase. Flag any that reference:
- Deleted or renamed file paths.
- Stale technology names (e.g. old library version).
- Trigger clauses that no longer match real task patterns.

Update the description + run `bun run ai:skills:sync` to regenerate shims.

## Done when
- `bun run ai:check` passes.
- No path-existence warnings.
- No evals schema warnings.
- Description review complete (or drift items logged for follow-up).
