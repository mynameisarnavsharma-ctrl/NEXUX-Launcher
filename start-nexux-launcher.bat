@echo off
cd /d "%~dp0nexux-launcher-app"
if exist "%~dp0nexux-launcher-app\node_modules\electron\dist\electron.exe" (
  start "" "%~dp0nexux-launcher-app\node_modules\electron\dist\electron.exe" .
) else (
  start "" /B npx electron .
)
exit
