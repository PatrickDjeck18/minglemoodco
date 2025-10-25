@echo off
echo 🔧 Setting up Environment Variables for MingleMood
echo ================================================

echo.
echo 📋 This script will help you set up the environment variables for your Supabase Edge Function.
echo.

echo 🔍 Checking if you're logged in to Supabase...
npx supabase status >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Not authenticated with Supabase. Please login first:
    echo    npx supabase login
    pause
    exit /b 1
)

echo ✅ Authenticated with Supabase

echo.
echo 📝 Setting up environment variables for the Edge Function...
echo.

echo Setting SUPABASE_URL...
npx supabase secrets set SUPABASE_URL=https://vijinjtpbrfkyjrzilnm.supabase.co

echo Setting SUPABASE_ANON_KEY...
echo Please enter your Supabase Anon Key (you can find this in your Supabase dashboard):
set /p ANON_KEY="Anon Key: "
npx supabase secrets set SUPABASE_ANON_KEY=%ANON_KEY%

echo Setting SUPABASE_SERVICE_ROLE_KEY...
echo Please enter your Supabase Service Role Key (you can find this in your Supabase dashboard):
set /p SERVICE_KEY="Service Role Key: "
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=%SERVICE_KEY%

echo Setting RESEND_API_KEY...
echo Please enter your Resend API Key (if you have one, or press Enter to skip):
set /p RESEND_KEY="Resend API Key: "
if not "%RESEND_KEY%"=="" (
    npx supabase secrets set RESEND_API_KEY=%RESEND_KEY%
) else (
    echo Skipping Resend API Key setup
)

echo.
echo ✅ Environment variables have been set up!
echo.
echo 📋 Next steps:
echo 1. Create a .env.local file in your project root
echo 2. Copy the variables from environment-config.txt
echo 3. Update the values with your actual keys
echo 4. Restart your development server
echo.
echo 🧪 Test the setup by running:
echo    npm run dev
echo.

pause
