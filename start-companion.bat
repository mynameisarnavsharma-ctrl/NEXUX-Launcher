@echo off
title NEXUX Launcher Companion
cd /d "%~dp0\nexux-companion"
echo Starting NEXUX Launcher Companion on http://localhost:4500...
start http://localhost:4500
node server.js
pause

