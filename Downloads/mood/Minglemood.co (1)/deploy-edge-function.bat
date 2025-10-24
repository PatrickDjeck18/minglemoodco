@echo off
echo 🔧 Deploying MingleMood Edge Function with CORS fixes...
echo.

echo 📋 Checking Supabase CLI installation...
npx supabase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Installing...
    npm install -g supabase
)

echo.
echo 🔐 Logging into Supabase...
npx supabase login

echo.
echo 🚀 Deploying edge function...
npx supabase functions deploy make-server-4bcc747c

echo.
echo 🔑 Setting environment variables (if needed)...
echo Note: You may need to set these manually:
echo npx supabase secrets set RESEND_API_KEY=your_resend_key
echo npx supabase secrets set SUPABASE_URL=your_supabase_url
echo npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
echo npx supabase secrets set SUPABASE_ANON_KEY=your_anon_key

echo.
echo ✅ Deployment complete!
echo.
echo 🧪 Testing the function...
curl -X GET "https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c/health"

echo.
echo 📝 CORS and HTTP 431 fixes applied:
echo - Enhanced CORS configuration with origin validation
echo - Header size checking to prevent HTTP 431 errors
echo - Token validation and trimming
echo - Better error handling for oversized requests

echo.
echo Press any key to exit...
pause >nul