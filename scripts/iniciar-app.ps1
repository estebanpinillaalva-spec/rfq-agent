$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$url   = "http://localhost:3000/dashboard"
$port  = 3000

# ── Comprobar si ya está corriendo ──────────────────────────────────────────
$portOpen = $null -ne (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)

if ($portOpen) {
  Write-Host ""
  Write-Host "  RFQ Agent ya esta en marcha en localhost:$port" -ForegroundColor Green
  Write-Host "  Abriendo el navegador..." -ForegroundColor Cyan
  Start-Process $url
  exit 0
}

# ── Arrancar el servidor en esta misma consola ───────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor DarkCyan
Write-Host "  ║       RFQ Agent Gestor               ║" -ForegroundColor DarkCyan
Write-Host "  ║   http://localhost:$port/dashboard     ║" -ForegroundColor DarkCyan
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  Arrancando servidor Next.js..." -ForegroundColor Yellow
Write-Host "  Cierra esta ventana (o Ctrl+C) para detenerlo." -ForegroundColor DarkGray
Write-Host ""

# Abrir el navegador en segundo plano cuando el servidor esté listo
$job = Start-Job -ScriptBlock {
  param($waitUrl)
  Start-Sleep -Seconds 3
  for ($i = 0; $i -lt 30; $i++) {
    try {
      $r = Invoke-WebRequest -UseBasicParsing $waitUrl -TimeoutSec 2
      if ($r.StatusCode -eq 200) {
        Start-Process $waitUrl
        return
      }
    } catch { }
    Start-Sleep -Seconds 1
  }
} -ArgumentList $url

# Ejecutar npm run dev en primer plano (logs visibles en esta consola)
Set-Location $root
& npm.cmd run dev
