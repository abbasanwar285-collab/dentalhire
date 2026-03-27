@echo off
echo Installing dependencies...
call npm install
echo.
echo Starting Scanner Watcher...
echo Please ensure .env file is configured.
echo.
npm start
pause
