# Environment Variables Setup Guide

This guide will help you set up the environment variables needed for your MingleMood application and Supabase Edge Function.

## 📋 Required Environment Variables

### For Supabase Edge Function

You need to set these environment variables in your Supabase project:

```bash
SUPABASE_URL=https://vijinjtpbrfkyjrzilnm.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
RESEND_API_KEY=your_resend_api_key_here (optional)
```

### For Local Development

Create a `.env.local` file in your project root with these variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://vijinjtpbrfkyjrzilnm.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Project Configuration
PROJECT_ID=vijinjtpbrfkyjrzilnm
NEXT_PUBLIC_SUPABASE_URL=https://vijinjtpbrfkyjrzilnm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Email Service Configuration (Resend)
RESEND_API_KEY=your_resend_api_key_here

# Development Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Admin Configuration
ADMIN_EMAIL=hello@minglemood.co
ADMIN_EMAIL_ALT=mutemela72@gmail.com

# Edge Function Configuration
EDGE_FUNCTION_URL=https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://minglemood.co,https://www.minglemood.co
```

## 🚀 Setup Methods

### Method 1: Using the Setup Scripts

#### For Windows (Batch):
```bash
setup-env-vars.bat
```

#### For Windows (PowerShell):
```powershell
.\setup-env-vars.ps1
```

### Method 2: Manual Setup

#### Step 1: Set Supabase Edge Function Environment Variables

1. Open your terminal
2. Navigate to your project directory
3. Run these commands:

```bash
# Set Supabase URL
npx supabase secrets set SUPABASE_URL=https://vijinjtpbrfkyjrzilnm.supabase.co

# Set Supabase Anon Key (replace with your actual key)
npx supabase secrets set SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Set Supabase Service Role Key (replace with your actual key)
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Set Resend API Key (optional, replace with your actual key)
npx supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

#### Step 2: Create Local Environment File

1. Create a `.env.local` file in your project root
2. Copy the variables from `environment-config.txt`
3. Replace the placeholder values with your actual keys

## 🔑 Where to Find Your Keys

### Supabase Keys

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the following:
   - **URL**: Project URL
   - **anon public**: Public API Key
   - **service_role**: Service Role Key (keep this secret!)

### Resend API Key (Optional)

1. Go to https://resend.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key

## ✅ Verification

After setting up the environment variables:

1. **Test the Edge Function**:
   ```bash
   curl -X GET "https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c/health"
   ```

2. **Test Local Development**:
   ```bash
   npm run dev
   ```

3. **Check Admin Dashboard**: Open your admin dashboard and verify that the CORS errors are resolved.

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure all environment variables are set correctly
2. **401 Unauthorized**: Check that your Supabase keys are correct
3. **Function Not Found**: Ensure the Edge Function is deployed

### Check Function Logs

```bash
npx supabase functions logs make-server-4bcc747c
```

### Redeploy Function

```bash
npx supabase functions deploy make-server-4bcc747c
```

## 📝 Security Notes

- Never commit your `.env.local` file to version control
- Keep your Service Role Key secret
- Use environment variables for sensitive data
- Regularly rotate your API keys

## 🆘 Support

If you encounter issues:

1. Check the Supabase Dashboard for function logs
2. Verify all environment variables are set correctly
3. Ensure the Edge Function is properly deployed
4. Check the browser console for error messages

For more help, refer to the [Supabase Documentation](https://supabase.com/docs) or [Resend Documentation](https://resend.com/docs).
