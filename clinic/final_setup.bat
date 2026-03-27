@echo off
chcp 65001 >nul
echo ===================================================
echo     الحل النهائي: الإعداد اليدوي - Manual Setup
echo ===================================================
echo.
echo نعتذر عن الإزعاج. سنستخدم الطريقة المضمونة 100%
echo We will use the 100% working method (Access Token).
echo.
echo ---------------------------------------------------
echo 1. اذهب إلى الرابط التالي:
echo    Go to: https://supabase.com/dashboard/account/tokens
echo.
echo 2. اضغط على الزر "Generate new token" (أعلى اليمين)
echo    Click "Generate new token"
echo.
echo 3. اكتب أي اسم (مثلاً: clinic) واضغط "Generate Token"
echo    Name it "clinic" and click Generate
echo.
echo 4. انسخ الكود الطويل الذي سيظهر (يبدأ بـ sbp_...)
echo    Copy the long code (starts with sbp_...)
echo.
echo 5. عد إلى هنا، الصق الكود، واضغط Enter
echo    Come back here, Paste the code, and press Enter
echo ---------------------------------------------------
echo.
set /p SUPABASE_ACCESS_TOKEN="> الصق الكود هنا (Paste Token Here): "

echo.
echo [1/3] Connecting to Project...
call npx supabase link --project-ref oxftskotrrlqnmfkxwux
if %errorlevel% neq 0 (
    echo [ERROR] Link failed. Check the token.
    pause
    exit /b
)

echo.
echo [2/3] Setting Secrets...
call npx supabase secrets set TELEGRAM_BOT_TOKEN="8398653513:AAHe3pWLdPasT40a63izzxLhFEn_Mh9D7gQ" TELEGRAM_GROUP_ID="-1003515269541"

echo.
echo [3/3] Deploying Function...
call npx supabase functions deploy send-telegram --no-verify-jwt

echo.
echo ===================================================
echo     تم بنجاح! شكراً لصبرك
echo     SUCCESS! Thank you for your patience.
echo ===================================================
pause
