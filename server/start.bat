@echo off
echo Starting Admin API Backend Server...
cd /d %~dp0
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
echo.
echo Starting server on port 3001...
echo Make sure you have configured server/.env with your Firebase Admin credentials
echo.
node index.js


