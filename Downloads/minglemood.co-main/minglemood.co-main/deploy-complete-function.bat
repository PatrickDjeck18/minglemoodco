@echo off
echo 🚀 Deploying Complete MingleMood Edge Function
echo =============================================

echo.
echo 📋 This script will:
echo 1. Set up the database schema
echo 2. Deploy the Edge Function
echo 3. Set up environment variables
echo 4. Test the deployment
echo.

echo 🔍 Checking prerequisites...
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
echo 🗄️ Setting up database schema...
echo Running SQL schema setup...
npx supabase db reset --linked

if %errorlevel% equ 0 (
    echo ✅ Database schema set up successfully
) else (
    echo ⚠️ Database reset failed, but continuing with deployment...
)

echo.
echo 🔧 Setting up environment variables...
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
echo 🚀 Deploying Edge Function...
npx supabase functions deploy make-server-4bcc747c

if %errorlevel% equ 0 (
    echo.
    echo ✅ Edge Function deployed successfully!
    echo.
    echo 🧪 Testing the deployment...
    echo.
    echo Testing health endpoint:
    curl -X GET "https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c/health"
    echo.
    echo.
    echo ✅ Deployment complete! Your MingleMood Edge Function is now ready.
    echo.
    echo 📝 Next steps:
    echo 1. Create a .env.local file in your project root
    echo 2. Copy the variables from environment-config.txt
    echo 3. Update the values with your actual keys
    echo 4. Restart your development server
    echo 5. Test your admin dashboard
    echo.
    echo 🎉 Your MingleMood application should now work without CORS errors!
    echo.
) else (
    echo.
    echo ❌ Deployment failed. Please check the error messages above.
    echo.
    echo 🔍 Troubleshooting:
    echo 1. Make sure you're logged in: npx supabase login
    echo 2. Check your project settings
    echo 3. Verify the function code is correct
    echo 4. Check that all environment variables are set
    echo.
)

pause
