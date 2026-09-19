Write-Host "Checking ML Service (http://127.0.0.1:8000/health)..."
try {
    $ml = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get
    Write-Host "ML Service is UP"
} catch {
    Write-Host "ML Service is DOWN"
}

Write-Host "`nChecking Backend Service (http://localhost:5000/api/v1/system/health)..."
try {
    $backend = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/system/health" -Method Get
    Write-Host "Backend is UP"
} catch {
    Write-Host "Backend is DOWN"
}

Write-Host "`nChecking Frontend Service (http://localhost:5173)..."
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get
    Write-Host "Frontend is UP"
} catch {
    Write-Host "Frontend is DOWN"
}

Write-Host "`nHealth check complete."
