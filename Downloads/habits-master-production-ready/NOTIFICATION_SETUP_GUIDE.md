# Notification System Setup Guide

## Database Migration Required

To enable the notification system, you need to run the following SQL commands in your Supabase SQL editor:

### Step 1: Run the Migration SQL

Copy and paste the contents of `ADD_NOTIFICATION_SETTINGS_COLUMN.sql` into your Supabase SQL editor and execute it.

### Step 2: Verify the Migration

After running the migration, you should see:

1. **New column**: `notification_settings` in the `user_profiles` table
2. **New table**: `notification_history` table
3. **Indexes**: Performance indexes for the notification history

### Step 3: Test the Notification System

1. **Open the app** and navigate to prayer requests
2. **Interact with prayer requests** (pray, like, comment, reply)
3. **Check notifications** on the target user's device
4. **Access notification settings** through the settings screen

## Features Included

### ✅ **Prayer Request Notifications**
- **Prayer notifications**: When someone prays for your request
- **Like notifications**: When someone likes your prayer request  
- **Comment notifications**: When someone comments on your prayer request
- **Reply notifications**: When someone replies to your comments

### ✅ **Notification Settings**
- **Granular control** over notification types
- **Sound and vibration settings**
- **Quiet hours** (22:00 - 07:00)
- **Test notifications** for verification

### ✅ **Smart Features**
- **Respects user preferences** and quiet hours
- **No self-notifications** (users don't get notified for their own actions)
- **Graceful fallbacks** if database columns don't exist
- **Comprehensive error handling**

## Troubleshooting

### If you see "column does not exist" errors:

1. **Run the migration SQL** in Supabase
2. **Restart your app** to clear any cached errors
3. **Check the console** for migration warnings

### If notifications don't appear:

1. **Check device permissions** for notifications
2. **Verify notification settings** in the app
3. **Test with the test notification button**
4. **Check quiet hours** settings

### If database errors persist:

1. **Ensure you're connected** to the correct Supabase project
2. **Check RLS policies** are properly set up
3. **Verify user authentication** is working

## Code Structure

### Files Added/Modified:

- `src/utils/firebaseNotifications.ts` - Main notification service
- `src/screens/NotificationSettingsScreen.tsx` - Settings UI
- `src/components/NotificationTestButton.tsx` - Test component
- `src/utils/supabase.ts` - Enhanced with notification methods
- `src/screens/PrayerRequestsScreen.tsx` - Integrated notifications

### Database Tables:

- `user_profiles.notification_settings` - User notification preferences
- `notification_history` - Notification activity log

## Next Steps

1. **Run the migration SQL**
2. **Test the notification system**
3. **Customize notification messages** if needed
4. **Set up quiet hours** for your users
5. **Monitor notification delivery** through the history table

The notification system is now ready to enhance your prayer community with real-time engagement notifications!
