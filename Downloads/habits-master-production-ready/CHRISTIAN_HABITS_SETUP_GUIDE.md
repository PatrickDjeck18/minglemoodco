# Christian Habits Database Setup Guide

## 🚀 Production-Ready Supabase Schema Deployment

This guide will walk you through deploying the comprehensive Christian habits tracking schema to your Supabase production environment.

## 📋 Prerequisites

- Supabase project set up
- Database access permissions
- Basic understanding of PostgreSQL
- Supabase CLI (optional but recommended)

## 🗄️ Database Schema Overview

### Core Tables (15 total)
1. **users** - Enhanced user profiles with spiritual goals
2. **daily_devotions** - Rich devotional content tracking
3. **fasting_records** - Comprehensive fasting management
4. **worship_sessions** - Personal and corporate worship tracking
5. **gratitude_entries** - Daily gratitude journaling
6. **service_records** - Ministry and volunteer work tracking
7. **christian_books** - Christian literature reading progress
8. **christian_habit_templates** - Pre-defined habit templates
9. **christian_habits** - User's personal habit instances
10. **christian_habit_completions** - Detailed completion tracking
11. **spiritual_milestones** - Achievements and testimonies
12. **prayer_requests** - Enhanced prayer request system
13. **prayer_sessions** - Detailed prayer session tracking
14. **prayer_comments** - Social prayer features
15. **prayer_likes** - Prayer engagement tracking

### Key Features
- **25+ Optimized Indexes** for performance
- **Row Level Security (RLS)** on all tables
- **6 Business Logic Functions** for automation
- **8 Automatic Triggers** for data integrity
- **15 Pre-defined Habit Templates** with biblical references
- **Analytics Views** for spiritual growth insights

## 🛠️ Deployment Steps

### Step 1: Backup Your Current Database
```sql
-- Create a backup of your current schema
pg_dump -h your-supabase-host -U postgres -d postgres > backup_before_christian_habits.sql
```

### Step 2: Deploy the Schema

#### Option A: Using Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase-christian-habits-schema.sql`
4. Paste into the SQL editor
5. Click **Run** to execute the schema

#### Option B: Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the schema
supabase db push --file supabase-christian-habits-schema.sql
```

### Step 3: Verify Deployment

#### Check Tables Created
```sql
-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 'daily_devotions', 'fasting_records', 'worship_sessions',
  'gratitude_entries', 'service_records', 'christian_books',
  'christian_habit_templates', 'christian_habits', 'christian_habit_completions',
  'spiritual_milestones', 'prayer_requests', 'prayer_sessions',
  'prayer_comments', 'prayer_likes', 'prayer_shares'
)
ORDER BY table_name;
```

#### Check Indexes Created
```sql
-- Verify indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

#### Check Functions Created
```sql
-- Verify functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
  'update_habit_streak', 'reset_habit_streak', 'increment_prayer_count',
  'decrement_prayer_count', 'calculate_spiritual_growth_score', 'update_updated_at_column'
);
```

#### Check Habit Templates
```sql
-- Verify default habit templates were inserted
SELECT name, category, frequency, scripture_reference
FROM christian_habit_templates
WHERE is_default = true
ORDER BY category, name;
```

### Step 4: Test RLS Policies

#### Test User Isolation
```sql
-- This should only return the current user's data
SELECT * FROM christian_habits WHERE user_id = auth.uid();
```

#### Test Public Access
```sql
-- This should return public habit templates
SELECT * FROM christian_habit_templates WHERE is_active = true;
```

## 🔧 Configuration

### Environment Variables
Update your app's environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### API Configuration
Ensure your Supabase client is configured with the correct permissions:

```typescript
// supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

## 📊 Analytics and Monitoring

### Spiritual Growth Dashboard
The schema includes a view for spiritual growth analytics:

```sql
-- Get user spiritual growth summary
SELECT * FROM user_spiritual_growth_summary 
WHERE user_id = 'your-user-id';
```

### Habit Completion Analytics
```sql
-- Get habit completion analytics
SELECT * FROM habit_completion_analytics 
WHERE habit_id = 'your-habit-id';
```

### Performance Monitoring
```sql
-- Monitor query performance
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public'
AND tablename IN ('christian_habits', 'christian_habit_completions', 'prayer_sessions');
```

## 🔒 Security Considerations

### RLS Policy Verification
All tables have Row Level Security enabled. Verify policies are working:

```sql
-- Test RLS policies
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "test-user-id"}';

-- This should only return user's own data
SELECT * FROM christian_habits;
```

### Data Privacy
- All user data is isolated by user ID
- Public data is explicitly marked
- Anonymous data is supported where appropriate

## 🚀 Performance Optimization

### Index Usage
Monitor index usage to ensure optimal performance:

```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Query Optimization
Common queries are optimized with composite indexes:
- `(user_id, is_active)` for active habits
- `(habit_id, completed_at)` for completion history
- `(user_id, is_private)` for prayer requests

## 📈 Scaling Considerations

### Database Size
- Estimated 1MB per 1000 users with moderate usage
- Indexes add ~20% overhead
- Regular cleanup of old data recommended

### Performance Thresholds
- < 100ms for habit queries
- < 200ms for analytics queries
- < 500ms for complex reports

## 🔄 Maintenance

### Regular Tasks
1. **Monitor Performance**: Check slow queries weekly
2. **Update Statistics**: Run `ANALYZE` monthly
3. **Clean Old Data**: Archive completed habits older than 2 years
4. **Backup Data**: Daily automated backups recommended

### Cleanup Scripts
```sql
-- Archive old completed habits (run monthly)
UPDATE christian_habits 
SET is_active = false 
WHERE last_completed < NOW() - INTERVAL '2 years' 
AND is_active = true;

-- Clean up old prayer sessions (run quarterly)
DELETE FROM prayer_sessions 
WHERE created_at < NOW() - INTERVAL '1 year';
```

## 🐛 Troubleshooting

### Common Issues

#### 1. RLS Policy Errors
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

#### 2. Function Permission Errors
```sql
-- Grant function permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
```

#### 3. Index Performance Issues
```sql
-- Rebuild indexes if needed
REINDEX DATABASE your_database_name;
```

### Debug Queries
```sql
-- Check for missing indexes
EXPLAIN ANALYZE SELECT * FROM christian_habits WHERE user_id = 'test-id';

-- Check RLS policy execution
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM christian_habits;
```

## 📚 Additional Resources

### Documentation
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Supabase Functions Guide](https://supabase.com/docs/guides/database/functions)

### Support
- Supabase Community Discord
- GitHub Issues for the project
- Database performance monitoring tools

## ✅ Production Checklist

- [ ] Schema deployed successfully
- [ ] All tables created
- [ ] Indexes created and optimized
- [ ] RLS policies working
- [ ] Functions executing correctly
- [ ] Default data inserted
- [ ] Performance benchmarks met
- [ ] Security policies verified
- [ ] Backup strategy in place
- [ ] Monitoring configured

## 🎉 Success!

Your Christian habits tracking database is now production-ready! The schema includes:

- **15 comprehensive tables** for complete spiritual tracking
- **25+ optimized indexes** for fast queries
- **6 business logic functions** for automation
- **15 pre-defined habit templates** with biblical references
- **Complete RLS security** for data protection
- **Analytics views** for spiritual growth insights

The database is designed to scale with your user base while maintaining excellent performance and security standards.
