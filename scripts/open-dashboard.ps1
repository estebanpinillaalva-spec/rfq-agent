$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$url = "http://localhost:3000/dashboard"
$portOpen = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet

if (-not $portOpen) {
  Write-Host "Arrancando RFQ Agent Gestor en localhost:3000..."
  Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $root -WindowStyle Hidden

  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
      $response = Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        $ready = $true
        break
      }
    } catch {
      $ready = $false
    }
  }

  if (-not $ready) {
    Write-Host "El servidor tarda mas de lo esperado. Prueba manualmente: npm.cmd run dev"
  }
}

Start-Process $url
