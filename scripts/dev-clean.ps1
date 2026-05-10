$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$keep = New-Object System.Collections.Generic.HashSet[int]
$current = Get-CimInstance Win32_Process -Filter "ProcessId=$PID"

while ($null -ne $current -and $current.ProcessId -and -not $keep.Contains([int]$current.ProcessId)) {
  [void]$keep.Add([int]$current.ProcessId)
  if (-not $current.ParentProcessId) { break }
  $current = Get-CimInstance Win32_Process -Filter "ProcessId=$($current.ParentProcessId)" -ErrorAction SilentlyContinue
}

Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -eq "node.exe" -and
    $_.CommandLine -and
    $_.CommandLine.Contains($root) -and
    -not $keep.Contains([int]$_.ProcessId)
  } |
  ForEach-Object {
    Write-Host "Stopping stale project Node process $($_.ProcessId)"
    Stop-Process -Id $_.ProcessId -Force
  }

$nextPath = Join-Path $root ".next"
if (Test-Path $nextPath) {
  $resolvedNext = (Resolve-Path $nextPath).Path
  if (-not $resolvedNext.StartsWith($root)) {
    throw "Refusing to remove .next outside project root: $resolvedNext"
  }
  Write-Host "Removing generated Next cache: $resolvedNext"
  Remove-Item -LiteralPath $resolvedNext -Recurse -Force
}

Set-Location $root
Write-Host "Starting clean Next dev server on http://localhost:3000"
& npm.cmd run dev
