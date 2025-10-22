# Database Setup Troubleshooting Guide

## Quick Fix for 406 Errors

The 406 "Not Acceptable" errors you're seeing indicate that the database tables don't exist in your Supabase project.

### Step 1: Run the Database Setup Script

1. **Open your Supabase project dashboard**
2. **Go to the SQL Editor** (left sidebar)
3. **Copy the entire contents** of `QUICK_DATABASE_SETUP.sql`
4. **Paste it into the SQL Editor**
5. **Click "Run"** to execute the script

### Step 2: Verify Tables Were Created

1. **Go to the Table Editor** in your Supabase dashboard
2. **Check that these tables exist:**
   - `users`
   - `user_profiles`
   - `prayer_requests`
   - `prayer_sessions`
   - `practices`
   - `practice_logs`
   - `daily_devotions`
   - `gratitude_entries`
   - `fasting_records`
   - `worship_sessions`
   - `service_records`
   - `christian_books`
   - `christian_habit_templates`
   - `christian_habits`
   - `christian_habit_completions`
   - `spiritual_milestones`
   - `statistics`

### Step 3: Test the App

After running the setup script, restart your app and test:
- Gratitude Journal saving should work
- Home screen should load without 406 errors
- All features should function properly

## Common Issues and Solutions

### Issue 1: "Table doesn't exist" errors
**Solution:** Run the `QUICK_DATABASE_SETUP.sql` script in Supabase SQL Editor

### Issue 2: "Permission denied" errors
**Solution:** The RLS policies are automatically created by the setup script. Make sure you're authenticated in your app.

### Issue 3: "Constraint violation" errors
**Solution:** The setup script includes proper constraints. If you still get errors, try running the script again.

### Issue 4: App still shows 406 errors after setup
**Solution:** 
1. Clear your app's cache/storage
2. Restart the app
3. Check the Supabase logs for any remaining issues

## Verification Commands

You can run these in the Supabase SQL Editor to verify everything is working:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_profiles', 'gratitude_entries', 'daily_devotions');

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Test a simple query
SELECT COUNT(*) FROM users;
```

## Need Help?

If you're still experiencing issues:

1. **Check Supabase logs** in your project dashboard
2. **Verify your Supabase URL and API key** in your app config
3. **Make sure you're using the correct project** (not a different Supabase project)
4. **Check that your user is properly authenticated** in the app

The setup script should resolve all 406 errors and get your app working properly!
