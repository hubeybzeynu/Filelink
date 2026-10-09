@echo off
REM FileLink Desktop Application Installer / Packaging Script
echo ====================================================
echo FileLink Desktop v1.0.0 - Installation Package
echo ====================================================
echo.

set TARGET_DIR=%APPDATA%\FileLink
set STARTMENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\FileLink

echo Creating application directories...
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
if not exist "%STARTMENU_DIR%" mkdir "%STARTMENU_DIR%"

echo Copying application files...
xcopy /E /Y /I "%~dp0publish\*.*" "%TARGET_DIR%\"

echo Creating shortcuts...
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%STARTMENU_DIR%\FileLink.lnk');$s.TargetPath='%TARGET_DIR%\FileLink.exe';$s.WorkingDirectory='%TARGET_DIR%';$s.Save()"
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USERPROFILE%\Desktop\FileLink.lnk');$s.TargetPath='%TARGET_DIR%\FileLink.exe';$s.WorkingDirectory='%TARGET_DIR%';$s.Save()"

echo.
echo ====================================================
echo FileLink Desktop successfully installed!
echo Short-cut created on Desktop and Start Menu.
echo Executable location: %TARGET_DIR%\FileLink.exe
echo ====================================================
echo.
pause
