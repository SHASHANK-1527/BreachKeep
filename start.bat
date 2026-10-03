@echo off
title BreachKeep Launcher
echo Starting BreachKeep Backend and Frontend...
cd /d "%~dp0"

:: 1. Ensure .mongo-data folder exists
if not exist "%~dp0.mongo-data" (
    mkdir "%~dp0.mongo-data"
)

:: 2. Check if MongoDB is listening on port 27017
netstat -ano | findstr /R ":27017 .*LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Starting local MongoDB instance on port 27017...
    if exist "%~dp0apps\api\node_modules\.cache\mongodb-memory-server\mongod-x64-win32-8.2.6.exe" (
        start "BreachKeep - MongoDB" "%~dp0apps\api\node_modules\.cache\mongodb-memory-server\mongod-x64-win32-8.2.6.exe" --dbpath "%~dp0.mongo-data" --port 27017
    )
    timeout /t 3 /nobreak >nul
)

:: 3. Seed dev account if needed
if exist "apps\api\src\scripts\devSeed.js" (
    cd apps\api
    node src\scripts\devSeed.js >nul 2>&1
    cd /d "%~dp0"
)

:: 4. Start API Server
start "BreachKeep API" cmd /k "cd apps\api && node src\server.js"
timeout /t 2 /nobreak >nul

:: 5. Start Web Server
start "BreachKeep Web" cmd /k "cd apps\web && npm run dev"

echo.
echo BreachKeep is starting up!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo Dev Login: DEVLOGIN1 (tester@dev.local / Test1234!)
echo.
pause
