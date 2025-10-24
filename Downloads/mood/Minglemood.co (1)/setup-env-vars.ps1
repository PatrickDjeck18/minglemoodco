# MingleMood Environment Variables Setup Script
Write-Host "🔧 Setting up Environment Variables for MingleMood" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 This script will help you set up the environment variables for your Supabase Edge Function." -ForegroundColor Yellow
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "🔍 Checking if Supabase CLI is installed..." -ForegroundColor Yellow
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
Write-Host "🔍 Checking authentication..." -ForegroundColor Yellow
try {
    npx supabase status | Out-Null
    Write-Host "✅ Authenticated with Supabase" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated with Supabase. Please login first:" -ForegroundColor Red
    Write-Host "   npx supabase login" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "📝 Setting up environment variables for the Edge Function..." -ForegroundColor Yellow
Write-Host ""

# Set SUPABASE_URL
Write-Host "Setting SUPABASE_URL..." -ForegroundColor Yellow
npx supabase secrets set SUPABASE_URL=https://vijinjtpbrfkyjrzilnm.supabase.co

# Set SUPABASE_ANON_KEY
Write-Host "Setting SUPABASE_ANON_KEY..." -ForegroundColor Yellow
$anonKey = Read-Host "Please enter your Supabase Anon Key (you can find this in your Supabase dashboard)"
if ($anonKey) {
    npx supabase secrets set SUPABASE_ANON_KEY=$anonKey
}

# Set SUPABASE_SERVICE_ROLE_KEY
Write-Host "Setting SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Yellow
$serviceKey = Read-Host "Please enter your Supabase Service Role Key (you can find this in your Supabase dashboard)"
if ($serviceKey) {
    npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$serviceKey
}

# Set RESEND_API_KEY
Write-Host "Setting RESEND_API_KEY..." -ForegroundColor Yellow
$resendKey = Read-Host "Please enter your Resend API Key (if you have one, or press Enter to skip)"
if ($resendKey) {
    npx supabase secrets set RESEND_API_KEY=$resendKey
} else {
    Write-Host "Skipping Resend API Key setup" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Environment variables have been set up!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Create a .env.local file in your project root" -ForegroundColor White
Write-Host "2. Copy the variables from environment-config.txt" -ForegroundColor White
Write-Host "3. Update the values with your actual keys" -ForegroundColor White
Write-Host "4. Restart your development server" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test the setup by running:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
