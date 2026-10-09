@echo off
title WAYORA Backend Transit Server
echo ========================================================
echo        WAYORA - BACKEND TRANSIT MOBILITY ENGINE
echo ========================================================
echo Starting Express API server on port 3000...
cd /d "%~dp0"
if exist ..\node_modules (
    call npx tsx server.ts
) else (
    call npm install
    call npx tsx server.ts
)
pause
