@echo off
REM FileLink AI - Complete Startup Script
REM Starts both Omniroute proxy and dev server

setlocal enabledelayedexpansion

echo.
echo ================================================
echo   FileLink AI - Complete Startup
echo ================================================
echo.

REM Set Omniroute environment
set CLAUDE_CONFIG_DIR=%USERPROFILE%\.claude-omniroute
set ANTHROPIC_BASE_URL=http://localhost:20128
set ANTHROPIC_AUTH_TOKEN=sk-349f10a8a4c70547-e7001a-84b3c82f
set ANTHROPIC_API_KEY=
set ANTHROPIC_MODEL=Filelink

echo [1/3] Environment configured
echo   - Base URL: %ANTHROPIC_BASE_URL%
echo   - Model: %ANTHROPIC_MODEL%
echo.

REM Start Omniroute in background
echo [2/3] Starting Omniroute proxy...
start "FileLink Omniroute" cmd /k "echo Starting Omniroute... && claude serve || (echo ERROR: Claude CLI not found! && pause)"

REM Wait for proxy to start
timeout /t 3 /nobreak >nul

echo [3/3] Starting FileLink dev server...
echo.
echo ================================================
echo   Both services starting...
echo   - Omniroute: http://localhost:20128
echo   - FileLink: http://localhost:8081
echo ================================================
echo.

REM Start dev server
npm run dev

pause
