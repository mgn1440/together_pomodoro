# Collaborative Pomodoro Timer - Windows Build Script
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Building Collaborative Pomodoro Timer for Windows" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install npm or fix your Node.js installation" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[1/4] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[2/4] Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
}

Write-Host ""
Write-Host "[3/4] Building Windows executable..." -ForegroundColor Yellow
npm run build:win
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[4/4] Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your Windows builds are located in the 'dist' folder:" -ForegroundColor Cyan

# List the built files
$exeFiles = Get-ChildItem -Path "dist" -Filter "*.exe" -ErrorAction SilentlyContinue
$msiFiles = Get-ChildItem -Path "dist" -Filter "*.msi" -ErrorAction SilentlyContinue

if ($exeFiles) {
    Write-Host "Executable files:" -ForegroundColor Yellow
    $exeFiles | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor White }
}

if ($msiFiles) {
    Write-Host "MSI installer files:" -ForegroundColor Yellow
    $msiFiles | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor White }
}

Write-Host ""
Write-Host "To install the application:" -ForegroundColor Cyan
Write-Host "  - For installer: Run the .exe file in the dist folder" -ForegroundColor White
Write-Host "  - For portable: Extract and run the portable .exe file" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"