@echo off
cd /d "%~dp0\nexux-launcher-app"
start "" /B npx electron .
exit
