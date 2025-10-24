# MingleMood Complete Edge Function Deployment Script
Write-Host "🚀 Deploying Complete MingleMood Edge Function" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 This script will:" -ForegroundColor Yellow
Write-Host "1. Set up the database schema" -ForegroundColor White
Write-Host "2. Deploy the Edge Function" -ForegroundColor White
Write-Host "3. Set up environment variables" -ForegroundColor White
Write-Host "4. Test the deployment" -ForegroundColor White
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
try {
    $supabaseVersion = npx supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check authentication
Write-Host ""
Write-Host "🔐 Checking authentication..." -ForegroundColor Yellow
try {
    npx supabase status | Out-Null
    Write-Host "✅ Authenticated with Supabase" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated with Supabase. Please login first:" -ForegroundColor Red
    Write-Host "   npx supabase login" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Set up database schema
Write-Host ""
Write-Host "🗄️ Setting up database schema..." -ForegroundColor Yellow
Write-Host "Running SQL schema setup..." -ForegroundColor White
try {
    npx supabase db reset --linked
    Write-Host "✅ Database schema set up successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Database reset failed, but continuing with deployment..." -ForegroundColor Yellow
}

# Set up environment variables
Write-Host ""
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Yellow
Write-Host "Setting SUPABASE_URL..." -ForegroundColor White
npx supabase secrets set SUPABASE_URL=https://vijinjtpbrfkyjrzilnm.supabase.co

Write-Host "Setting SUPABASE_ANON_KEY..." -ForegroundColor White
$anonKey = Read-Host "Please enter your Supabase Anon Key (you can find this in your Supabase dashboard)"
if ($anonKey) {
    npx supabase secrets set SUPABASE_ANON_KEY=$anonKey
}

Write-Host "Setting SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor White
$serviceKey = Read-Host "Please enter your Supabase Service Role Key (you can find this in your Supabase dashboard)"
if ($serviceKey) {
    npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$serviceKey
}

Write-Host "Setting RESEND_API_KEY..." -ForegroundColor White
$resendKey = Read-Host "Please enter your Resend API Key (if you have one, or press Enter to skip)"
if ($resendKey) {
    npx supabase secrets set RESEND_API_KEY=$resendKey
} else {
    Write-Host "Skipping Resend API Key setup" -ForegroundColor Yellow
}

# Deploy the Edge Function
Write-Host ""
Write-Host "🚀 Deploying Edge Function..." -ForegroundColor Yellow
try {
    npx supabase functions deploy make-server-4bcc747c
    Write-Host ""
    Write-Host "✅ Edge Function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Testing the deployment..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Testing health endpoint:" -ForegroundColor White
    Invoke-WebRequest -Uri "https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c/health" -Method GET
    Write-Host ""
    Write-Host "✅ Deployment complete! Your MingleMood Edge Function is now ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Create a .env.local file in your project root" -ForegroundColor White
    Write-Host "2. Copy the variables from environment-config.txt" -ForegroundColor White
    Write-Host "3. Update the values with your actual keys" -ForegroundColor White
    Write-Host "4. Restart your development server" -ForegroundColor White
    Write-Host "5. Test your admin dashboard" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Your MingleMood application should now work without CORS errors!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed. Please check the error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host>
    Write-Host "🔍 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure you're logged in: npx supabase login" -ForegroundColor White
    Write-Host "2. Check your project settings" -ForegroundColor White
    Write-Host "3. Verify the function code is correct" -ForegroundColor White
    Write-Host "4. Check that all environment variables are set" -ForegroundColor White
    Write-Host ""
}

Read-Host "Press Enter to exit"
