@echo off
chcp 65001 >nul
echo ===================================================
echo     إصلاح تسجيل الدخول والإعداد - Login Fix
echo ===================================================
echo.
echo يبدو أن هناك مشكلة في الصلاحيات. يجب تسجيل الدخول أولاً.
echo It seems there is a permission issue. let's log in first.
echo.
echo 1. Login to Supabase
echo    سيفتح المتصفح، يرجى الموافقة ونسخ الكود ولصقه هنا إذا طُلب
echo    Browser will open, please approve and paste code if asked
echo.
call npx supabase login
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Login failed.
    echo فشل تسجيل الدخول
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Now running the setup...
echo    الآن سنبدأ الإعداد...
echo.
call setup_notifications.bat
