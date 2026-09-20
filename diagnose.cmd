@echo off
REM FileLink AI - Diagnostic Tool
REM Tests all connections and shows what's working

setlocal enabledelayedexpansion

echo.
echo ========================================================
echo   FileLink AI - System Diagnostic
echo ========================================================
echo.

REM Test 1: Check if Omniroute port is open
echo [1/5] Testing Omniroute connection (port 20128)...
powershell -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('localhost', 20128); $client.Close(); Write-Host '  [OK] Omniroute is running on port 20128' -ForegroundColor Green; exit 0 } catch { Write-Host '  [FAIL] Omniroute NOT running on port 20128' -ForegroundColor Red; exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    echo   Fix: Run start-omniroute.cmd first
)
echo.

REM Test 2: Check if dev server is running
echo [2/5] Testing dev server (port 8081)...
powershell -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('localhost', 8081); $client.Close(); Write-Host '  [OK] Dev server is running on port 8081' -ForegroundColor Green; exit 0 } catch { Write-Host '  [FAIL] Dev server NOT running on port 8081' -ForegroundColor Red; exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    echo   Fix: Run npm run dev
)
echo.

REM Test 3: Check .env file
echo [3/5] Checking .env configuration...
if exist .env (
    echo   [OK] .env file exists
    findstr /C:"ANTHROPIC_BASE_URL" .env >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo   [OK] ANTHROPIC_BASE_URL is set
    ) else (
        echo   [WARN] ANTHROPIC_BASE_URL not found in .env
    )

    findstr /C:"ANTHROPIC_AUTH_TOKEN" .env >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo   [OK] ANTHROPIC_AUTH_TOKEN is set
    ) else (
        echo   [WARN] ANTHROPIC_AUTH_TOKEN not found in .env
    )

    findstr /C:"ANTHROPIC_MODEL" .env >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo   [OK] ANTHROPIC_MODEL is set
    ) else (
        echo   [WARN] ANTHROPIC_MODEL not found in .env
    )
) else (
    echo   [FAIL] .env file not found!
    echo   Fix: Copy .env.example to .env and configure it
)
echo.

REM Test 4: Test API endpoint
echo [4/5] Testing API endpoint...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8081/api/ai' -Method POST -ContentType 'application/json' -Body '{\"action\":\"status\"}' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop; if ($response.StatusCode -eq 401) { Write-Host '  [OK] API endpoint responding (auth required)' -ForegroundColor Green } else { Write-Host '  [OK] API endpoint responding' -ForegroundColor Green } } catch { Write-Host '  [FAIL] API endpoint not responding' -ForegroundColor Red; Write-Host \"  Error: $_\" -ForegroundColor Red }"
echo.

REM Test 5: Check Node.js
echo [5/5] Checking Node.js installation...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    node --version
    echo   [OK] Node.js is installed
) else (
    echo   [FAIL] Node.js not found
    echo   Fix: Install Node.js from https://nodejs.org
)
echo.

echo ========================================================
echo   Diagnostic Complete
echo ========================================================
echo.
echo Recommended startup order:
echo   1. start-omniroute.cmd  (in Terminal 1)
echo   2. npm run dev          (in Terminal 2)
echo   3. ai-chat.cmd          (in Terminal 3)
echo.
echo Or use: start-all.cmd (automatic)
echo.
pause
