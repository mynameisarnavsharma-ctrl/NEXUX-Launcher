@echo off
cd /d "%~dp0nexux-launcher-app"
start "" "%~dp0nexux-launcher-app\node_modules\electron\dist\electron.exe" .
exit
