@echo off
echo ================================================
echo Building Collaborative Pomodoro Timer for Windows
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install npm or fix your Node.js installation
    pause
    exit /b 1
)

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Cleaning previous builds...
if exist dist rmdir /s /q dist

echo.
echo [3/4] Building Windows executable...
call npm run build:win
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [4/4] Build completed successfully!
echo.
echo Your Windows builds are located in the 'dist' folder:
echo.
dir /b dist\*.exe 2>nul
dir /b dist\*.msi 2>nul

echo.
echo To install the application:
echo - For installer: Run the .exe file in the dist folder
echo - For portable: Extract and run the portable .exe file
echo.
pause