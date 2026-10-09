@echo off
REM FileLink Desktop Application Uninstaller
echo ====================================================
echo FileLink Desktop v1.0.0 - Uninstaller
echo ====================================================
echo.

set TARGET_DIR=%APPDATA%\FileLink
set STARTMENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\FileLink

echo Terminating running instances...
taskkill /F /IM FileLink.exe 2>nul

echo Removing shortcuts...
if exist "%USERPROFILE%\Desktop\FileLink.lnk" del /F /Q "%USERPROFILE%\Desktop\FileLink.lnk"
if exist "%STARTMENU_DIR%" rmdir /S /Q "%STARTMENU_DIR%"

echo Removing application files...
if exist "%TARGET_DIR%" rmdir /S /Q "%TARGET_DIR%"

echo.
echo ====================================================
echo FileLink Desktop successfully uninstalled.
echo ====================================================
echo.
pause
