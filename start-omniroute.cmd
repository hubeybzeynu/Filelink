@echo off
REM FileLink AI - Start Omniroute Proxy
REM This script sets up the environment and starts the local Claude proxy

echo ========================================
echo   FileLink AI - Starting Omniroute
echo ========================================
echo.

REM Set Omniroute configuration
set CLAUDE_CONFIG_DIR=%USERPROFILE%\.claude-omniroute
set ANTHROPIC_BASE_URL=http://localhost:20128
set ANTHROPIC_AUTH_TOKEN=sk-349f10a8a4c70547-e7001a-84b3c82f
set ANTHROPIC_API_KEY=
set ANTHROPIC_MODEL=Filelink

echo Configuration:
echo   Config Dir: %CLAUDE_CONFIG_DIR%
echo   Base URL: %ANTHROPIC_BASE_URL%
echo   Model: %ANTHROPIC_MODEL%
echo.

REM Check if claude-omniroute is available
where claude >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting Omniroute with 'claude serve'...
    echo.
    claude serve
) else (
    echo Claude CLI not found in PATH.
    echo.
    echo Please install it first:
    echo   npm install -g @anthropic-ai/claude-cli
    echo.
    echo Or run manually:
    echo   npx claude-omniroute serve
    echo.
    pause
)
