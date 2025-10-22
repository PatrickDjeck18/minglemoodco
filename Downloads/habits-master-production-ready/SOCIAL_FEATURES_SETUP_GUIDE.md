# Social Features Setup Guide

## Problem Fixed

**Error:** `Could not find a relationship between 'prayer_likes' and 'users' in the schema cache`

## Solution: Database Migration Required

The social features (likes, comments, shares) require additional database tables that don't exist yet.

### Step 1: Run the Complete Migration

Copy and paste the contents of `FIX_PRAYER_LIKES_TABLE.sql` into your Supabase SQL Editor and execute it.

This will create:
- ✅ `prayer_likes` table with proper relationships
- ✅ `prayer_comments` table for comments and replies
- ✅ `comment_likes` table for comment likes
- ✅ `prayer_shares` table for sharing functionality
- ✅ All necessary RLS policies and indexes

### Step 2: Verify the Migration

After running the migration, you should see:

1. **No more relationship errors** when liking prayer requests
2. **Comments work** properly with replies
3. **Likes are tracked** and displayed correctly
4. **Shares are recorded** in the database

## Current Status: Graceful Fallbacks

The app is designed to work with or without these tables:

### ✅ **Before Migration (Graceful Degradation):**
- **Likes don't work** but app doesn't crash
- **Comments show warning** but don't break
- **Shares are ignored** but app continues
- **Clear warning messages** in console

### ✅ **After Migration (Full Functionality):**
- **All social features work** perfectly
- **Likes are tracked** and displayed
- **Comments and replies** function normally
- **Shares are recorded** and counted
- **Notifications work** for all interactions

## Features Included

### **1. Prayer Likes System**
- **Like/Unlike** prayer requests
- **Track likes count** in prayer_requests table
- **Display likes** with user information
- **Anonymous support** for like notifications

### **2. Comments System**
- **Add comments** to prayer requests
- **Reply to comments** (nested structure)
- **Like comments** (separate from prayer likes)
- **Track comment counts** in prayer_requests table

### **3. Sharing System**
- **Share prayer requests** with other users
- **Track share counts** in prayer_requests table
- **Anonymous sharing** support

### **4. Database Schema**

#### **Tables Created:**
```sql
prayer_likes (id, user_id, prayer_request_id, created_at)
prayer_comments (id, user_id, prayer_request_id, parent_comment_id, content, created_at)
comment_likes (id, user_id, comment_id, created_at)
prayer_shares (id, user_id, prayer_request_id, created_at)
```

#### **Relationships:**
- `prayer_likes.user_id` → `auth.users(id)`
- `prayer_likes.prayer_request_id` → `prayer_requests(id)`
- `prayer_comments.user_id` → `auth.users(id)`
- `prayer_comments.prayer_request_id` → `prayer_requests(id)`
- `prayer_comments.parent_comment_id` → `prayer_comments(id)`

## Testing the Features

### **1. Test Likes:**
1. **Open prayer requests**
2. **Tap the heart icon** on any request
3. **Check console** for success/error messages
4. **Verify like count** updates

### **2. Test Comments:**
1. **Tap comment icon** on a prayer request
2. **Add a comment** and submit
3. **Check if comment appears**
4. **Try replying** to a comment

### **3. Test Shares:**
1. **Tap share icon** on a prayer request
2. **Check console** for success message
3. **Verify share count** updates

## Troubleshooting

### **If you still see relationship errors:**

1. **Check table names** in Supabase dashboard
2. **Verify foreign key constraints** are properly set
3. **Check RLS policies** are enabled
4. **Refresh the schema cache** in Supabase

### **If features don't work after migration:**

1. **Check console logs** for specific error messages
2. **Verify user authentication** is working
3. **Check if tables have data** in Supabase dashboard
4. **Test with a fresh prayer request**

### **If you see "feature not available" messages:**

1. **Run the complete migration** SQL
2. **Restart your app** to clear any cached errors
3. **Check Supabase logs** for any failed queries
4. **Verify all tables exist** in the database

## Benefits After Migration

- ✅ **Full social functionality** for prayer requests
- ✅ **Real-time interactions** with likes, comments, shares
- ✅ **Anonymous notifications** for all interactions
- ✅ **Proper data tracking** and analytics
- ✅ **Scalable architecture** for future features

The social features will work perfectly once the database migration is complete, providing a rich, interactive prayer community experience!
