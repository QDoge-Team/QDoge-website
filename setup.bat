@echo off
echo ========================================
echo Web3 Casino Game - Setup Script
echo ========================================
echo.

echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Checking npm installation...
npm --version
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)

echo.
echo Creating .env.local file...
if not exist .env.local (
    echo NEXT_PUBLIC_API_URL=https://casino.truebliss.dev > .env.local
    echo .env.local file created!
) else (
    echo .env.local already exists, skipping...
)

echo.
echo Installing dependencies...
echo This may take a few minutes...
npm install

if %errorlevel% neq 0 (
    echo.
    echo WARNING: Some packages failed to install.
    echo This might be due to QUBIC packages not being available.
    echo The app should still run with limited wallet features.
    echo.
    pause
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo The app will be available at: http://localhost:3000
echo.
pause
