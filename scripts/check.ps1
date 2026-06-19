#requires -Version 7.4

[CmdletBinding()]
param(
  [ValidateSet('local', 'premerge')]
  [string] $Gate = 'local'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-RepoStep {
  param(
    [Parameter(Mandatory)]
    [string] $Name,

    [Parameter(Mandatory)]
    [string[]] $Command
  )

  Write-Host ''
  Write-Host "==> $Name"

  $exe = $Command[0]
  $argsForExe = if ($Command.Count -gt 1) { $Command[1..($Command.Count - 1)] } else { @() }

  & $exe @argsForExe
  $exitCode = if ($null -ne $global:LASTEXITCODE) { $global:LASTEXITCODE } else { 0 }

  if ($exitCode -ne 0) {
    exit $exitCode
  }
}

$steps = @(
  @{ Name = 'AI context check'; Command = @('bun', 'run', 'ai:check') },
  @{ Name = 'AI evals'; Command = @('bun', 'run', 'ai:eval') },
  @{ Name = 'Typecheck'; Command = @('bun', 'run', 'typecheck') }
)

if ($Gate -eq 'premerge') {
  $steps += @(
    @{ Name = 'Lint'; Command = @('bun', 'run', 'lint') },
    @{ Name = 'Tests'; Command = @('bun', 'run', 'test') },
    @{ Name = 'Build'; Command = @('bun', 'run', 'build') }
  )
}

foreach ($step in $steps) {
  Invoke-RepoStep -Name $step.Name -Command $step.Command
}
