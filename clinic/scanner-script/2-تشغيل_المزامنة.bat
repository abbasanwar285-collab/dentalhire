@echo off
chcp 65001
cls
echo ===================================================
echo        مشغل مزامنة الأشعة - العيادة الذكية
echo ===================================================
echo.
echo 1. تأكد من أن برنامج الأشعة يحفظ الصور باسم المريض
echo 2. لا تغلق هذه النافذة لكي تستمر المزامنة
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطأ] برنامج Node.js غير مثبت!
    pause
    exit
)

if not exist node_modules (
    echo [تنبيه] لم يتم تثبيت البرنامج بعد.
    echo يرجى تشغيل ملف "1-تثبيت_البرنامج.bat" أولاً.
    pause
    exit
)

echo جاري الاتصال بالنظام...
echo.

node watcher.js

echo.
echo حدث خطأ غير متوقع وتوقف البرنامج.
pause
