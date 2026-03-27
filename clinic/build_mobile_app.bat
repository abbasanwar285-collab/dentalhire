@echo off
echo ==========================================
echo      My Dental Clinic - Mobile Build
echo ==========================================
echo.
echo 1. Building Web App (Vite)...
echo    (This bakes environment variables into the app)
echo.
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Web build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Syncing to Android (Capacitor)...
echo.
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo      SUCCESS! Ready for Android Studio
echo ==========================================
echo.
echo Now:
echo 1. Open Android Studio
echo 2. Run the app on your device
echo.
pause
