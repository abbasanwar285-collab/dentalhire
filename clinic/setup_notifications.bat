@echo off
chcp 65001 >nul
echo ===================================================
echo     إعداد إشعارات تلكرام - Telegram Setup
echo ===================================================
echo.
echo سيقوم هذا الملف بربط المشروع بالسيرفر ورفع الإعدادات
echo This script will link the project and deploy settings
echo.
echo 1. Connecting to Project (oxftskotrrlqnmfkxwux)...
echo    يرجى إدخال كلمة مرور قاعدة البيانات إذا طُلبت
echo    Please enter your Database Password if prompted
echo.
call npx supabase link --project-ref oxftskotrrlqnmfkxwux
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to link project. Please check if you have access to this project.
    echo فشل الربط. تأكد من أنك تملك صلاحية الوصول لهذا المشروع
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Setting Telegram Secrets...
echo    جاري حفظ معلومات البوت...
call npx supabase secrets set TELEGRAM_BOT_TOKEN="8398653513:AAHe3pWLdPasT40a63izzxLhFEn_Mh9D7gQ" TELEGRAM_GROUP_ID="-1003515269541"

echo.
echo 3. Deploying Function...
echo    جاري رفع الكود إلى السيرفر...
call npx supabase functions deploy send-telegram --no-verify-jwt

echo.
echo ===================================================
echo     تمت العملية بنجاح! - Success!
echo ===================================================
pause
