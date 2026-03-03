# ─── Formulaires — Lancement dev ──────────────────────────────────────────────
# Lance le backend Django (port 8080) et le frontend Next.js (port 3001)
# dans deux fenêtres PowerShell séparées.

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

# ── Backend ───────────────────────────────────────────────────────────────────
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$root\backend'; .\.venv\Scripts\Activate.ps1; python manage.py runserver 8080"
) -WindowStyle Normal

# ── Frontend ──────────────────────────────────────────────────────────────────
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$root\frontend'; npm run dev"
) -WindowStyle Normal

Write-Host ""
Write-Host "Serveurs lancés :" -ForegroundColor Green
Write-Host "  Backend  -> http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Frontend -> http://localhost:3001" -ForegroundColor Cyan
Write-Host ""

