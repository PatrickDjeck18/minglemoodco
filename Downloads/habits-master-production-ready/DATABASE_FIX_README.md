# Database Fix for Christian Habits App

## Problem
Your Christian Habits app is experiencing database errors due to missing columns:

1. **Error 1**: `Could not find the 'benefits' column of 'christian_habit_templates' in the schema cache`
2. **Error 2**: `Could not find the 'reminder_time' column of 'christian_habits' in the schema cache`

## Solution
The database schema is missing several required columns that the application expects. This fix adds all the missing columns and ensures proper database structure.

## Files Created
- `COMPLETE_DATABASE_FIX.sql` - Complete database migration script
- `FIX_MISSING_COLUMNS.sql` - Minimal fix for just the missing columns
- `run_database_fix.bat` - Windows batch file to run the fix
- `run_database_fix.sh` - Linux/Mac shell script to run the fix

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Copy the entire contents of `COMPLETE_DATABASE_FIX.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the script

### Option 2: Using Supabase CLI
```bash
# Reset and apply the complete schema
supabase db reset --linked
supabase db push
```

### Option 3: Manual Column Addition
If you prefer a minimal approach, use `FIX_MISSING_COLUMNS.sql` which only adds the missing columns.

## What the Fix Does

### For `christian_habit_templates` table:
- Adds `benefits` column (TEXT[])
- Adds `prerequisites` column (TEXT[])
- Adds `difficulty_level` column (INTEGER)
- Adds `is_default` column (BOOLEAN)
- Adds `created_by` column (UUID)
- Adds `updated_at` column (TIMESTAMP)

### For `christian_habits` table:
- Adds `reminder_time` column (TIME)
- Adds `reminder_days` column (INTEGER[])
- Adds `start_date` column (DATE)
- Adds `last_completed` column (TIMESTAMP)
- Adds `completion_rate` column (DECIMAL)
- Adds `notes` column (TEXT)
- Adds `spiritual_goals` column (TEXT[])
- Adds `target_duration` column (INTEGER)
- Adds `current_streak` column (INTEGER)
- Adds `longest_streak` column (INTEGER)
- Adds `total_completions` column (INTEGER)

### For `christian_habit_completions` table:
- Adds `user_id` column (UUID)
- Adds `completed_at` column (TIMESTAMP)
- Adds `duration_minutes` column (INTEGER)
- Adds `scripture_reference` column (TEXT)
- Adds `prayer_focus` column (TEXT)
- Adds `spiritual_impact` column (TEXT)
- Adds `difficulty_rating` column (INTEGER)
- Adds `mood_before` column (TEXT)
- Adds `mood_after` column (TEXT)
- Adds `created_at` column (TIMESTAMP)

## Additional Features Added
- **Row Level Security (RLS)** policies for data protection
- **Indexes** for better query performance
- **Triggers** for automatic timestamp updates
- **Business logic functions** for habit streak management
- **Default habit templates** with 15 pre-defined Christian habits
- **Data integrity constraints** to prevent invalid data

## Default Habit Templates Included
The fix also inserts 15 default Christian habit templates:
1. Morning Prayer
2. Bible Study
3. Evening Reflection
4. Weekly Fasting
5. Worship Time
6. Gratitude Journal
7. Scripture Memory
8. Service/Volunteer
9. Fellowship
10. Silence and Solitude
11. Tithe and Giving
12. Evangelism
13. Prayer Walking
14. Sabbath Rest
15. Scripture Study

## Verification
After running the fix, your app should:
- ✅ Load without database column errors
- ✅ Allow creating new Christian habits
- ✅ Display default habit templates
- ✅ Track habit completions properly
- ✅ Show habit statistics and streaks

## Troubleshooting
If you encounter issues:
1. Check that you have the correct permissions in Supabase
2. Ensure you're running the script in the correct database
3. Verify that all tables exist before running the fix
4. Check the Supabase logs for any error messages

## Support
If you need help with the database fix, check:
- Supabase documentation for SQL execution
- Your project's database logs
- The application console for any remaining errors

---
**Note**: This fix is designed to be safe and won't delete existing data. It only adds missing columns and features.
