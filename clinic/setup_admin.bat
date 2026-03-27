@echo off
echo Restoring Admin User...
call npx tsx restore_admin.ts
echo.
echo If you saw "Admin restored successfully" or similar, you can now login with:
echo Phone: 07810988380
echo.
pause
