@echo off
setlocal enabledelayedexpansion
title BreachKeep - Test Mode Launcher

cd /d "%~dp0"

echo ===================================================
echo        BREACHKEEP - LAUNCHING IN TEST MODE
echo ===================================================
echo.

:: 1. Ensure .mongo-data folder exists
if not exist "%~dp0.mongo-data" (
    mkdir "%~dp0.mongo-data"
)

:: 2. Check if MongoDB is already listening on port 27017
netstat -ano | findstr /R ":27017 .*LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Starting local MongoDB instance on port 27017...
    if exist "%~dp0apps\api\node_modules\.cache\mongodb-memory-server\mongod-x64-win32-8.2.6.exe" (
        start "BreachKeep - MongoDB" "%~dp0apps\api\node_modules\.cache\mongodb-memory-server\mongod-x64-win32-8.2.6.exe" --dbpath "%~dp0.mongo-data" --port 27017
    ) else (
        echo [!] Cached mongod binary not found, attempting system mongod...
        start "BreachKeep - MongoDB" mongod --dbpath "%~dp0.mongo-data" --port 27017
    )
    timeout /t 3 /nobreak >nul
) else (
    echo [*] MongoDB is already running on port 27017.
)

:: 3. Seed dev account (tester@dev.local / Test1234!, code DEVLOGIN1)
echo [*] Ensuring test account is seeded...
cd /d "%~dp0apps\api"
node src/scripts/devSeed.js >nul 2>&1
cd /d "%~dp0"

:: 4. Start API Server with TEST_MODE=true
echo [*] Starting API Server on http://localhost:5000 in TEST MODE...
start "BreachKeep - API [TEST MODE]" cmd /k "cd /d %~dp0apps\api && set TEST_MODE=true && set NODE_ENV=development && npm run dev"

:: 5. Start Provisioner (Port 6000)
echo [*] Starting Provisioner on http://localhost:6000...
start "BreachKeep - Provisioner" cmd /k "cd /d %~dp0apps\provisioner && node src/server.js"

:: 6. Start Web Frontend with VITE_TEST_MODE=true
echo [*] Starting Web Frontend on http://localhost:3000 in TEST MODE...
start "BreachKeep - Web [TEST MODE]" cmd /k "cd /d %~dp0apps\web && set VITE_TEST_MODE=true && npm run dev"

:: 7. Wait and open browser
echo.
echo ===================================================
echo [SUCCESS] BreachKeep launched in TEST MODE!
echo.
echo   Web Frontend:  http://localhost:3000
echo   API Server:    http://localhost:5000
echo   Test Panel:    Enabled (bottom-right on website)
echo.
echo   Dev Access Code: DEVLOGIN1
echo   Dev Account:     tester@dev.local / Test1234!
echo ===================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo All services have been launched in separate windows.
pause
