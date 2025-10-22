# Firebase to Supabase Migration Guide

This guide explains the migration from Firebase to Supabase for the Habits Master app.

## What Changed

### 1. Authentication
- **Before**: Firebase Auth with platform-specific imports
- **After**: Supabase Auth with unified API
- **Impact**: All authentication methods now use Supabase Auth

### 2. Database
- **Before**: Firestore with Firebase SDK
- **After**: PostgreSQL with Supabase client
- **Impact**: All database operations now use Supabase

### 3. Configuration
- **Before**: Firebase config with environment variables
- **After**: Supabase config with provided credentials
- **Impact**: New configuration structure

## Setup Instructions

### 1. Database Setup
Run the SQL schema in your Supabase SQL editor:
```bash
# Copy the contents of supabase-schema.sql and run in Supabase SQL editor
```

### 2. Environment Variables
The app now uses hardcoded Supabase credentials. For production, consider moving these to environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://hdgtkrxfkusvwcmsjegc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Dependencies
The following dependencies were added:
- `@supabase/supabase-js`

The following Firebase dependencies can be removed (but kept for backward compatibility):
- `@react-native-firebase/app`
- `@react-native-firebase/auth`
- `@react-native-firebase/firestore`
- `firebase`

## Code Changes

### 1. Authentication Context
- Updated to use Supabase Auth
- Maintains same API for components
- Added session management

### 2. Database Operations
- All Firebase operations now use Supabase
- Maintained backward compatibility through FirebaseManager wrapper
- Updated table/collection names to use snake_case

### 3. User ID Handling
- Firebase uses `user.uid`
- Supabase uses `user.id`
- Wrapper handles both formats automatically

## Database Schema

### Tables Created
- `users` - User profiles and settings
- `prayer_requests` - Prayer requests and tracking
- `reading_progress` - Bible reading sessions
- `memory_verses` - Scripture memory verses
- `prayer_sessions` - Prayer timer sessions
- `practices` - Spiritual practices
- `reading_plans` - Bible reading plans
- `practice_logs` - Practice completion logs
- `devotion_notes` - Personal devotion notes
- `statistics` - User statistics and analytics

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Policies enforce data isolation

## Testing the Migration

1. **Authentication Test**
   - Try signing up with email
   - Try signing in anonymously
   - Test password reset

2. **Database Test**
   - Create prayer requests
   - Save reading sessions
   - Add memory verses
   - Track practices

3. **Data Persistence**
   - Verify data is saved to Supabase
   - Check data retrieval works
   - Test offline/online sync

## Rollback Plan

If issues occur, you can rollback by:
1. Reverting the code changes
2. Reinstalling Firebase dependencies
3. Restoring Firebase configuration

## Performance Considerations

- Supabase uses PostgreSQL which is generally faster than Firestore
- RLS policies may add slight overhead
- Consider adding database indexes for large datasets

## Security Notes

- All data is protected by RLS policies
- User authentication is handled by Supabase Auth
- API keys are configured for the specific Supabase project
- Consider implementing additional security measures for production

## Support

For issues with the migration:
1. Check Supabase dashboard for errors
2. Verify database schema is correct
3. Test authentication flow
4. Check network connectivity
