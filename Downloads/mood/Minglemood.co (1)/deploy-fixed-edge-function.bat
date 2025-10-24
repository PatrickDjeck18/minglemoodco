@echo off
echo 🔧 Deploying Fixed Edge Function with CORS and HTTP 431 Fixes
echo ============================================================

echo.
echo 📋 Checking Supabase CLI...
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo    npm install -g supabase
    pause
    exit /b 1
)

echo ✅ Supabase CLI found

echo.
echo 🔐 Checking authentication...
npx supabase status >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ Not authenticated with Supabase. Please login first:
    echo    npx supabase login
    pause
    exit /b 1
)

echo ✅ Authenticated with Supabase

echo.
echo 🚀 Deploying edge function with fixes...
npx supabase functions deploy make-server-4bcc747c

if %errorlevel% equ 0 (
    echo.
    echo ✅ Edge function deployed successfully!
    echo.
    echo 🧪 Testing the deployment...
    echo.
    echo Testing health endpoint:
    curl -X GET "https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c/health"
    echo.
    echo.
    echo ✅ Deployment complete! The CORS and HTTP 431 fixes should now be active.
    echo.
    echo 📝 Next steps:
    echo 1. Refresh your admin dashboard in the browser
    echo 2. Check the browser console for any remaining errors
    echo 3. Test the admin endpoints
    echo.
) else (
    echo.
    echo ❌ Deployment failed. Please check the error messages above.
    echo.
    echo 🔍 Troubleshooting:
    echo 1. Make sure you're logged in: npx supabase login
    echo 2. Check your project settings
    echo 3. Verify the function code is correct
    echo.
)

pause
