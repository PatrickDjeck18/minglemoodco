-- =====================================================
-- SUPABASE SCHEMA FOR COMMENTS AND LIKES FUNCTIONALITY
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- COMMENTS TABLE
-- =====================================================

-- Create prayer_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS prayer_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES prayer_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer_request_id ON prayer_comments(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_user_id ON prayer_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_parent_comment_id ON prayer_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_created_at ON prayer_comments(created_at);

-- =====================================================
-- LIKES TABLES
-- =====================================================

-- Create prayer_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS prayer_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prayer_request_id, user_id)
);

-- Create comment_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES prayer_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Create prayer_shares table if it doesn't exist
CREATE TABLE IF NOT EXISTS prayer_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prayer_request_id, user_id)
);

-- Create indexes for likes tables
CREATE INDEX IF NOT EXISTS idx_prayer_likes_prayer_request_id ON prayer_likes(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_likes_user_id ON prayer_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_shares_prayer_request_id ON prayer_shares(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_shares_user_id ON prayer_shares(user_id);

-- =====================================================
-- UPDATE PRAYER_REQUESTS TABLE
-- =====================================================

-- Add social media columns to prayer_requests if they don't exist
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE prayer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_shares ENABLE ROW LEVEL SECURITY;

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
-- FUNCTIONS FOR SOCIAL FEATURES
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
-- TRIGGERS FOR AUTOMATIC COUNT UPDATES
-- =====================================================

-- Trigger function to update prayer likes count
CREATE OR REPLACE FUNCTION update_prayer_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM increment_likes_count(NEW.prayer_request_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM decrement_likes_count(OLD.prayer_request_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM increment_comment_likes_count(NEW.comment_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM decrement_comment_likes_count(OLD.comment_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update prayer shares count
CREATE OR REPLACE FUNCTION update_prayer_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM increment_shares_count(NEW.prayer_request_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM decrement_shares_count(OLD.prayer_request_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_prayer_likes_count ON prayer_likes;
CREATE TRIGGER trigger_update_prayer_likes_count
  AFTER INSERT OR DELETE ON prayer_likes
  FOR EACH ROW EXECUTE FUNCTION update_prayer_likes_count();

DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

DROP TRIGGER IF EXISTS trigger_update_prayer_shares_count ON prayer_shares;
CREATE TRIGGER trigger_update_prayer_shares_count
  AFTER INSERT OR DELETE ON prayer_shares
  FOR EACH ROW EXECUTE FUNCTION update_prayer_shares_count();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to check if user has liked a prayer request
CREATE OR REPLACE FUNCTION has_user_liked_prayer_request(
  p_user_id UUID,
  p_prayer_request_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM prayer_likes 
    WHERE user_id = p_user_id 
    AND prayer_request_id = p_prayer_request_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has liked a comment
CREATE OR REPLACE FUNCTION has_user_liked_comment(
  p_user_id UUID,
  p_comment_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM comment_likes 
    WHERE user_id = p_user_id 
    AND comment_id = p_comment_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get prayer request likes count
CREATE OR REPLACE FUNCTION get_prayer_likes_count(p_prayer_request_id UUID)
RETURNS INTEGER AS $$
DECLARE
  likes_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO likes_count
  FROM prayer_likes
  WHERE prayer_request_id = p_prayer_request_id;
  
  RETURN COALESCE(likes_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comment likes count
CREATE OR REPLACE FUNCTION get_comment_likes_count(p_comment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  likes_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO likes_count
  FROM comment_likes
  WHERE comment_id = p_comment_id;
  
  RETURN COALESCE(likes_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get prayer request comments count
CREATE OR REPLACE FUNCTION get_prayer_comments_count(p_prayer_request_id UUID)
RETURNS INTEGER AS $$
DECLARE
  comments_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO comments_count
  FROM prayer_comments
  WHERE prayer_request_id = p_prayer_request_id;
  
  RETURN COALESCE(comments_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DATA MIGRATION (if needed)
-- =====================================================

-- Update existing prayer requests with correct counts
DO $$
DECLARE
  prayer_record RECORD;
  likes_count INTEGER;
  comments_count INTEGER;
  shares_count INTEGER;
BEGIN
  FOR prayer_record IN SELECT id FROM prayer_requests LOOP
    -- Get actual likes count
    SELECT COUNT(*) INTO likes_count
    FROM prayer_likes
    WHERE prayer_request_id = prayer_record.id;
    
    -- Get actual comments count
    SELECT COUNT(*) INTO comments_count
    FROM prayer_comments
    WHERE prayer_request_id = prayer_record.id;
    
    -- Get actual shares count
    SELECT COUNT(*) INTO shares_count
    FROM prayer_shares
    WHERE prayer_request_id = prayer_record.id;
    
    -- Update the prayer request with correct counts
    UPDATE prayer_requests
    SET 
      likes_count = COALESCE(likes_count, 0),
      comments_count = COALESCE(comments_count, 0),
      shares_count = COALESCE(shares_count, 0)
    WHERE id = prayer_record.id;
  END LOOP;
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON prayer_comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON prayer_likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON comment_likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON prayer_shares TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_comments_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_comments_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_shares_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_shares_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_comment_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_comment_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_user_liked_prayer_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_user_liked_comment(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_prayer_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comment_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_prayer_comments_count(UUID) TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables exist
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
AND routine_name LIKE '%likes%' 
OR routine_name LIKE '%comments%'
OR routine_name LIKE '%shares%'
ORDER BY routine_name;
