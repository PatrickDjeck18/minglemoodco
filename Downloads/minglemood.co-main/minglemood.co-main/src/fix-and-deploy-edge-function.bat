@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo 🚀 MingleMood Edge Function - Auto Fix ^& Deploy
echo ========================================================
echo.

set PROJECT_ID=vijinjtpbrfkyjrzilnm
set FUNCTION_NAME=make-server-4bcc747c
set SOURCE_DIR=src\supabase\functions\make-server-4bcc747c
set TARGET_DIR=supabase\functions\%FUNCTION_NAME%

echo 📋 Step 1: Check Prerequisites
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI not found
    echo.
    echo Install it with:
    echo   npm install -g supabase
    echo.
    pause
    exit /b 1
)

echo ✅ Supabase CLI found
echo.

echo 📋 Step 2: Prepare Files
echo.

REM Create target directory
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo Copying and fixing files...

REM Copy index.ts
if exist "%SOURCE_DIR%\index.ts" (
    echo   📄 Processing index.ts...
    copy "%SOURCE_DIR%\index.ts" "%TARGET_DIR%\index.ts" >nul
    echo   ✅ index.ts created
) else (
    echo   ❌ index.ts not found in %SOURCE_DIR%
    pause
    exit /b 1
)

REM Copy kv_store.ts
if exist "%SOURCE_DIR%\kv_store.ts" (
    echo   📄 Processing kv_store.ts...
    copy "%SOURCE_DIR%\kv_store.ts" "%TARGET_DIR%\kv_store.ts" >nul
    echo   ✅ kv_store.ts created
) else (
    echo   ⚠️  kv_store.ts not found (may not be needed)
)

REM Copy email-service.ts
if exist "%SOURCE_DIR%\email-service.ts" (
    echo   📄 Processing email-service.ts...
    copy "%SOURCE_DIR%\email-service.ts" "%TARGET_DIR%\email-service.ts" >nul
    echo   ✅ email-service.ts created
) else (
    echo   ⚠️  email-service.ts not found (may not be needed)
)

REM Copy database-setup.ts
if exist "%SOURCE_DIR%\database-setup.ts" (
    echo   📄 Processing database-setup.ts...
    copy "%SOURCE_DIR%\database-setup.ts" "%TARGET_DIR%\database-setup.ts" >nul
    echo   ✅ database-setup.ts created
) else (
    echo   ⚠️  database-setup.ts not found (may not be needed)
)

echo.
echo ✅ All files prepared in: %TARGET_DIR%
echo.

echo 📋 Step 3: Link Project (if not already linked)
echo.

REM Try to link project
supabase link --project-ref %PROJECT_ID% 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Project already linked or link skipped
)

echo.
echo 📋 Step 4: Deploy Function
echo.

echo Deploying %FUNCTION_NAME%...
supabase functions deploy %FUNCTION_NAME% --project-ref %PROJECT_ID% --no-verify-jwt

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 SUCCESS! Edge Function Deployed!
    echo.
    echo ✅ Function: %FUNCTION_NAME%
    echo ✅ Project: %PROJECT_ID%
    echo ✅ URL: https://%PROJECT_ID%.supabase.co/functions/v1/%FUNCTION_NAME%
    echo.
    echo 📋 Test the deployment:
    echo 1. Health check:
    echo    curl https://%PROJECT_ID%.supabase.co/functions/v1/%FUNCTION_NAME%/health
    echo.
    echo 2. Sign in to your app as mutemela72@gmail.com
    echo 3. Check Admin tab - should work now!
    echo.
) else (
    echo.
    echo ❌ Deployment failed
    echo.
    echo Common issues:
    echo 1. Not logged in: Run 'supabase login'
    echo 2. Wrong project: Check project ID
    echo 3. Missing dependencies: Check import statements
    echo.
    echo View logs:
    echo   supabase functions logs %FUNCTION_NAME%
    echo.
)

pause
