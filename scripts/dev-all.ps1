$ErrorActionPreference = "Stop"

Write-Host "Starting ML Service..."
Set-Location ml-service
$mlProcess = Start-Process -NoNewWindow -PassThru -FilePath "powershell.exe" -ArgumentList "-Command `".\.venv\Scripts\Activate.ps1; uvicorn app.main:app --port 8000`""
Set-Location ..

Write-Host "Starting Backend Service..."
Set-Location backend
$backendProcess = Start-Process -NoNewWindow -PassThru -FilePath "npm.cmd" -ArgumentList "run dev"
Set-Location ..

Write-Host "Starting Frontend Service..."
Set-Location frontend
$frontendProcess = Start-Process -NoNewWindow -PassThru -FilePath "npm.cmd" -ArgumentList "run dev"
Set-Location ..

Write-Host "All services started!"
Write-Host "ML Service PID: $($mlProcess.Id)"
Write-Host "Backend PID: $($backendProcess.Id)"
Write-Host "Frontend PID: $($frontendProcess.Id)"

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "Shutting down all services..."
    Stop-Process -Id $mlProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
}
