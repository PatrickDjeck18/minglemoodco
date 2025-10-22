-- =====================================================
-- SAFE SUPABASE SCHEMA FOR COMMENTS AND LIKES
-- (Handles existing policies and objects)
-- =====================================================

-- =====================================================
-- 1. CREATE TABLES (IF NOT EXISTS)
-- =====================================================

-- Prayer Comments Table
CREATE TABLE IF NOT EXISTS prayer_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES prayer_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prayer Likes Table
CREATE TABLE IF NOT EXISTS prayer_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prayer_request_id, user_id)
);

-- Comment Likes Table
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES prayer_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Prayer Shares Table
CREATE TABLE IF NOT EXISTS prayer_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prayer_request_id, user_id)
);

-- =====================================================
-- 2. ADD COLUMNS TO PRAYER_REQUESTS (IF NOT EXISTS)
-- =====================================================

-- Add social media columns to prayer_requests
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- =====================================================
-- 3. CREATE INDEXES (IF NOT EXISTS)
-- =====================================================

-- Prayer Comments Indexes
CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer_request_id ON prayer_comments(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_user_id ON prayer_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_parent_comment_id ON prayer_comments(parent_comment_id);

-- Prayer Likes Indexes
CREATE INDEX IF NOT EXISTS idx_prayer_likes_prayer_request_id ON prayer_likes(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_likes_user_id ON prayer_likes(user_id);

-- Comment Likes Indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Prayer Shares Indexes
CREATE INDEX IF NOT EXISTS idx_prayer_shares_prayer_request_id ON prayer_shares(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_shares_user_id ON prayer_shares(user_id);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE prayer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_shares ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. DROP EXISTING POLICIES (IF THEY EXIST)
-- =====================================================

-- Drop existing policies for prayer_comments
DROP POLICY IF EXISTS "Users can view prayer comments" ON prayer_comments;
DROP POLICY IF EXISTS "Users can insert prayer comments" ON prayer_comments;
DROP POLICY IF EXISTS "Users can update own prayer comments" ON prayer_comments;
DROP POLICY IF EXISTS "Users can delete own prayer comments" ON prayer_comments;

-- Drop existing policies for prayer_likes
DROP POLICY IF EXISTS "Users can view prayer likes" ON prayer_likes;
DROP POLICY IF EXISTS "Users can insert own prayer likes" ON prayer_likes;
DROP POLICY IF EXISTS "Users can delete own prayer likes" ON prayer_likes;

-- Drop existing policies for comment_likes
DROP POLICY IF EXISTS "Users can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can insert own comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can delete own comment likes" ON comment_likes;

-- Drop existing policies for prayer_shares
DROP POLICY IF EXISTS "Users can view prayer shares" ON prayer_shares;
DROP POLICY IF EXISTS "Users can insert own prayer shares" ON prayer_shares;
DROP POLICY IF EXISTS "Users can delete own prayer shares" ON prayer_shares;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Prayer Comments Policies
CREATE POLICY "Users can view prayer comments" ON prayer_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert prayer comments" ON prayer_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prayer comments" ON prayer_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prayer comments" ON prayer_comments FOR DELETE USING (auth.uid() = user_id);

-- Prayer Likes Policies
CREATE POLICY "Users can view prayer likes" ON prayer_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own prayer likes" ON prayer_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own prayer likes" ON prayer_likes FOR DELETE USING (auth.uid() = user_id);

-- Comment Likes Policies
CREATE POLICY "Users can view comment likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own comment likes" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment likes" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Prayer Shares Policies
CREATE POLICY "Users can view prayer shares" ON prayer_shares FOR SELECT USING (true);
CREATE POLICY "Users can insert own prayer shares" ON prayer_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own prayer shares" ON prayer_shares FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. CREATE OR REPLACE FUNCTIONS
-- =====================================================

-- Function to increment prayer likes count
CREATE OR REPLACE FUNCTION increment_likes_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET likes_count = likes_count + 1 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement prayer likes count
CREATE OR REPLACE FUNCTION decrement_likes_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET likes_count = GREATEST(likes_count - 1, 0) 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment comments count
CREATE OR REPLACE FUNCTION increment_comments_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET comments_count = comments_count + 1 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement comments count
CREATE OR REPLACE FUNCTION decrement_comments_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET comments_count = GREATEST(comments_count - 1, 0) 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment shares count
CREATE OR REPLACE FUNCTION increment_shares_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET shares_count = shares_count + 1 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement shares count
CREATE OR REPLACE FUNCTION decrement_shares_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET shares_count = GREATEST(shares_count - 1, 0) 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment comment likes count
CREATE OR REPLACE FUNCTION increment_comment_likes_count(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_comments 
  SET likes_count = likes_count + 1 
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement comment likes count
CREATE OR REPLACE FUNCTION decrement_comment_likes_count(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_comments 
  SET likes_count = GREATEST(likes_count - 1, 0) 
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON prayer_comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON prayer_likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON comment_likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON prayer_shares TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION increment_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_comments_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_comments_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_shares_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_shares_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_comment_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_comment_likes_count(UUID) TO authenticated;

-- =====================================================
-- 9. UPDATE EXISTING DATA COUNTS
-- =====================================================

-- Update existing prayer requests with correct counts
DO $$
DECLARE
  prayer_record RECORD;
  actual_likes_count INTEGER;
  actual_comments_count INTEGER;
  actual_shares_count INTEGER;
BEGIN
  FOR prayer_record IN SELECT id FROM prayer_requests LOOP
    -- Get actual likes count
    SELECT COUNT(*) INTO actual_likes_count
    FROM prayer_likes
    WHERE prayer_request_id = prayer_record.id;
    
    -- Get actual comments count
    SELECT COUNT(*) INTO actual_comments_count
    FROM prayer_comments
    WHERE prayer_request_id = prayer_record.id;
    
    -- Get actual shares count
    SELECT COUNT(*) INTO actual_shares_count
    FROM prayer_shares
    WHERE prayer_request_id = prayer_record.id;
    
    -- Update the prayer request with correct counts
    UPDATE prayer_requests
    SET 
      likes_count = COALESCE(actual_likes_count, 0),
      comments_count = COALESCE(actual_comments_count, 0),
      shares_count = COALESCE(actual_shares_count, 0)
    WHERE id = prayer_record.id;
  END LOOP;
END $$;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Verify tables exist and have data
SELECT 
  'prayer_comments' as table_name,
  COUNT(*) as row_count
FROM prayer_comments
UNION ALL
SELECT 
  'prayer_likes' as table_name,
  COUNT(*) as row_count
FROM prayer_likes
UNION ALL
SELECT 
  'comment_likes' as table_name,
  COUNT(*) as row_count
FROM comment_likes
UNION ALL
SELECT 
  'prayer_shares' as table_name,
  COUNT(*) as row_count
FROM prayer_shares;

-- Verify functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%likes%' 
OR routine_name LIKE '%comments%' 
OR routine_name LIKE '%shares%')
ORDER BY routine_name;

-- Verify prayer_requests has the new columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'prayer_requests'
AND column_name IN ('likes_count', 'comments_count', 'shares_count', 'is_public', 'is_anonymous')
ORDER BY column_name;
