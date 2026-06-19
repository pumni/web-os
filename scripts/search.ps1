#requires -Version 7.4

[CmdletBinding(DefaultParameterSetName = 'Content')]
param(
  [Parameter(Mandatory, Position = 0, ParameterSetName = 'Content')]
  [string] $Pattern,

  [Parameter(Position = 1, ParameterSetName = 'Content')]
  [string[]] $Path = @('.'),

  [Parameter(Mandatory, ParameterSetName = 'Files')]
  [string] $Name,

  [Parameter(ParameterSetName = 'Files')]
  [string] $Root = '.',

  [Parameter(Mandatory, ParameterSetName = 'Json')]
  [string] $Filter,

  [Parameter(Mandatory, ParameterSetName = 'Json')]
  [string] $JsonPath,

  [switch] $Context
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

switch ($PSCmdlet.ParameterSetName) {
  'Content' {
    $rgArgs = @('-n')
    if ($Context) {
      $rgArgs += @('-C', '2')
    }
    $rgArgs += @('--', $Pattern)
    $rgArgs += $Path
    & rg @rgArgs
    exit $LASTEXITCODE
  }

  'Files' {
    & fd --type f -- $Name $Root
    exit $LASTEXITCODE
  }

  'Json' {
    & jq $Filter $JsonPath
    exit $LASTEXITCODE
  }
}
