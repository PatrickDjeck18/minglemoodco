# Supabase Comments and Likes Setup Guide

This guide will help you set up the complete comments and likes functionality for your FaithHabits app.

## 📋 Prerequisites

- Supabase project created
- Database access to your Supabase project
- Basic understanding of SQL

## 🚀 Step-by-Step Setup

### Step 1: Run the SQL Schema

1. **Open your Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to the SQL Editor

2. **Execute the Schema**
   - Copy the contents of `supabase-comments-likes-simple.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the SQL

### Step 2: Verify Tables Created

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('prayer_comments', 'prayer_likes', 'comment_likes', 'prayer_shares');
```

### Step 3: Verify Functions Created

Run this query to verify all functions were created:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%likes%' 
OR routine_name LIKE '%comments%' 
OR routine_name LIKE '%shares%';
```

### Step 4: Test the Setup

1. **Test Comment Creation**
   ```sql
   INSERT INTO prayer_comments (prayer_request_id, user_id, content)
   VALUES ('your-prayer-request-id', 'your-user-id', 'Test comment');
   ```

2. **Test Like Functionality**
   ```sql
   INSERT INTO prayer_likes (prayer_request_id, user_id)
   VALUES ('your-prayer-request-id', 'your-user-id');
   ```

3. **Verify Counts Updated**
   ```sql
   SELECT id, title, likes_count, comments_count 
   FROM prayer_requests 
   WHERE id = 'your-prayer-request-id';
   ```

## 🔧 Troubleshooting

### Issue: "Table doesn't exist" errors
**Solution**: Make sure you ran the SQL schema in the correct order and all tables were created successfully.

### Issue: "Function doesn't exist" errors
**Solution**: Verify all functions were created by running the verification query in Step 3.

### Issue: "Permission denied" errors
**Solution**: Make sure you granted the correct permissions to the `authenticated` role.

### Issue: Comments count not updating
**Solution**: 
1. Check if the `increment_comments_count` function exists
2. Verify the function is being called correctly in your app
3. Check the console logs for any RPC errors

## 📊 Database Schema Overview

### Tables Created:
- `prayer_comments` - Stores comments on prayer requests
- `prayer_likes` - Stores likes on prayer requests  
- `comment_likes` - Stores likes on comments
- `prayer_shares` - Stores shares of prayer requests

### Columns Added to `prayer_requests`:
- `likes_count` - Number of likes
- `comments_count` - Number of comments
- `shares_count` - Number of shares
- `is_public` - Whether the request is public
- `is_anonymous` - Whether the request is anonymous

### Functions Created:
- `increment_likes_count(prayer_id)` - Increment likes count
- `decrement_likes_count(prayer_id)` - Decrement likes count
- `increment_comments_count(prayer_id)` - Increment comments count
- `decrement_comments_count(prayer_id)` - Decrement comments count
- `increment_shares_count(prayer_id)` - Increment shares count
- `decrement_shares_count(prayer_id)` - Decrement shares count
- `increment_comment_likes_count(comment_id)` - Increment comment likes
- `decrement_comment_likes_count(comment_id)` - Decrement comment likes

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **User-specific policies** ensure users can only modify their own data
- **Public read access** for viewing comments and likes
- **Cascade deletes** to maintain data integrity

## 📱 App Integration

After running the SQL schema, your app should work with:

1. **Comment functionality** - Users can add comments and replies
2. **Like functionality** - Users can like posts and comments
3. **Share functionality** - Users can share prayer requests
4. **Real-time counts** - All counters update automatically
5. **User permissions** - Proper access control for all features

## 🎯 Next Steps

1. **Test the functionality** in your app
2. **Monitor the console logs** for any errors
3. **Verify counts are updating** correctly
4. **Test with multiple users** to ensure proper isolation

## 📞 Support

If you encounter any issues:

1. Check the Supabase logs in your dashboard
2. Verify all SQL was executed successfully
3. Test the functions manually in the SQL editor
4. Check your app's console logs for specific error messages

The setup should now be complete and your comments and likes functionality should work properly!
