@echo off
title NEXUX Launcher - Open Mods Folder
set "MODS_DIR=%APPDATA%\.nexuxlauncher\mods"
if not exist "%MODS_DIR%" mkdir "%MODS_DIR%"
explorer.exe "%MODS_DIR%"

