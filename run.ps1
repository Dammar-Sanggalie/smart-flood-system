# Smart Flood Detection System — Quick Start Script
# ===================================================

param (
    [string]$Mode = "menu"
)

function Show-Header {
    Clear-Host
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "       SMART FLOOD DETECTION SYSTEM — IoT DASHBOARD        " -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Check-Prerequisites {
    Write-Host "[1/3] Checking environment..." -ForegroundColor White
    
    # Check Node.js
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVer = node -v
        Write-Host "  [OK] Node.js is installed: $nodeVer" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Node.js not found! Please install from https://nodejs.org" -ForegroundColor Red
    }

    # Check Go
    if (Get-Command go -ErrorAction SilentlyContinue) {
        $goVer = go version
        Write-Host "  [OK] Go is installed: $goVer" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Go not found in PATH! Please install Go from https://go.dev/dl/" -ForegroundColor Yellow
    }

    # Check .env files
    if (-not (Test-Path "$PSScriptRoot\backend\.env")) {
        Copy-Item "$PSScriptRoot\backend\.env.example" "$PSScriptRoot\backend\.env"
        Write-Host "  [CREATED] backend/.env from .env.example" -ForegroundColor Cyan
    }
    if (-not (Test-Path "$PSScriptRoot\frontend\.env.local")) {
        Copy-Item "$PSScriptRoot\frontend\.env.example" "$PSScriptRoot\frontend\.env.local"
        Write-Host "  [CREATED] frontend/.env.local from .env.example" -ForegroundColor Cyan
    }
    Write-Host ""
}

function Run-Backend-Demo {
    Show-Header
    Check-Prerequisites
    Write-Host "Starting Backend in DEMO MODE..." -ForegroundColor Yellow
    Write-Host "Backend will run on http://localhost:8080" -ForegroundColor Cyan
    $env:DEMO_MODE = "true"
    Set-Location "$PSScriptRoot\backend"
    go run ./cmd/server/main.go
}

function Run-Backend-Live {
    Show-Header
    Check-Prerequisites
    Write-Host "Starting Backend in LIVE MODE (Connecting to MQTT)..." -ForegroundColor Green
    Write-Host "Backend will run on http://localhost:8080" -ForegroundColor Cyan
    $env:DEMO_MODE = "false"
    Set-Location "$PSScriptRoot\backend"
    go run ./cmd/server/main.go
}

function Run-Frontend {
    Show-Header
    Check-Prerequisites
    Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Cyan
    Write-Host "Frontend will run on http://localhost:3000" -ForegroundColor Green
    Set-Location "$PSScriptRoot\frontend"
    npm run dev
}

function Run-Tests {
    Show-Header
    Write-Host "Running Backend Water Calculation Unit Tests..." -ForegroundColor Cyan
    Set-Location "$PSScriptRoot\backend"
    go test ./internal/calculation/... -v
    Read-Host "`nPress Enter to return to menu..."
}

function Show-Menu {
    Show-Header
    Check-Prerequisites
    Write-Host "Select an option:" -ForegroundColor White
    Write-Host "1. Start Backend (DEMO Mode - Simulated data)" -ForegroundColor Yellow
    Write-Host "2. Start Backend (LIVE Mode - Real ESP32 via MQTT)" -ForegroundColor Green
    Write-Host "3. Start Frontend (Next.js dev server on :3000)" -ForegroundColor Cyan
    Write-Host "4. Run Unit Tests (Go calculation tests)" -ForegroundColor Magenta
    Write-Host "5. Exit" -ForegroundColor Gray
    Write-Host ""
    $choice = Read-Host "Enter option (1-5)"

    switch ($choice) {
        "1" { Run-Backend-Demo }
        "2" { Run-Backend-Live }
        "3" { Run-Frontend }
        "4" { Run-Tests; Show-Menu }
        "5" { exit }
        default { Show-Menu }
    }
}

switch ($Mode) {
    "demo" { Run-Backend-Demo }
    "live" { Run-Backend-Live }
    "frontend" { Run-Frontend }
    "test" { Run-Tests }
    default { Show-Menu }
}
