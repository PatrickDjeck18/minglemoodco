-- =====================================================
-- MINIMAL SUPABASE SCHEMA FOR COMMENTS AND LIKES
-- (Only adds what's missing, safe to run multiple times)
-- =====================================================

-- =====================================================
-- 1. CREATE MISSING TABLES
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
-- 2. ADD MISSING COLUMNS TO PRAYER_REQUESTS
-- =====================================================

ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- =====================================================
-- 3. CREATE MISSING INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer_request_id ON prayer_comments(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_user_id ON prayer_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_parent_comment_id ON prayer_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_prayer_likes_prayer_request_id ON prayer_likes(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_likes_user_id ON prayer_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
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
-- 5. CREATE MISSING POLICIES (ONLY IF THEY DON'T EXIST)
-- =====================================================

-- Check and create prayer_comments policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prayer_comments' AND policyname = 'Users can view prayer comments') THEN
    CREATE POLICY "Users can view prayer comments" ON prayer_comments FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prayer_comments' AND policyname = 'Users can insert prayer comments') THEN
    CREATE POLICY "Users can insert prayer comments" ON prayer_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prayer_comments' AND policyname = 'Users can update own prayer comments') THEN
    CREATE POLICY "Users can update own prayer comments" ON prayer_comments FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prayer_comments' AND policyname = 'Users can delete own prayer comments') THEN
    CREATE POLICY "Users can delete own prayer comments" ON prayer_comments FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Check and create prayer_likes policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prayer_likes' AND policyname = 'Users can view prayer likes') THEN
    CREATE POLICY "Users can view prayer likes" ON prayer_likes FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prayer_likes' AND policyname = 'Users can insert own prayer likes') THEN
    CREATE POLICY "Users can insert own prayer likes" ON prayer_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prayer_likes' AND policyname = 'Users can delete own prayer likes') THEN
    CREATE POLICY "Users can delete own prayer likes" ON prayer_likes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Check and create comment_likes policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comment_likes' AND policyname = 'Users can view comment likes') THEN
    CREATE POLICY "Users can view comment likes" ON comment_likes FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comment_likes' AND policyname = 'Users can insert own comment likes') THEN
    CREATE POLICY "Users can insert own comment likes" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comment_likes' AND policyname = 'Users can delete own comment likes') THEN
    CREATE POLICY "Users can delete own comment likes" ON comment_likes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Check and create prayer_shares policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prayer_shares' AND policyname = 'Users can view prayer shares') THEN
    CREATE POLICY "Users can view prayer shares" ON prayer_shares FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prayer_shares' AND policyname = 'Users can insert own prayer shares') THEN
    CREATE POLICY "Users can insert own prayer shares" ON prayer_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prayer_shares' AND policyname = 'Users can delete own prayer shares') THEN
    CREATE POLICY "Users can delete own prayer shares" ON prayer_shares FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 6. CREATE OR REPLACE FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION increment_likes_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET likes_count = likes_count + 1 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_likes_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET likes_count = GREATEST(likes_count - 1, 0) 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_comments_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET comments_count = comments_count + 1 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comments_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET comments_count = GREATEST(comments_count - 1, 0) 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_shares_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET shares_count = shares_count + 1 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_shares_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET shares_count = GREATEST(shares_count - 1, 0) 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_comment_likes_count(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_comments 
  SET likes_count = likes_count + 1 
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comment_likes_count(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_comments 
  SET likes_count = GREATEST(likes_count - 1, 0) 
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON prayer_comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON prayer_likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON comment_likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON prayer_shares TO authenticated;

GRANT EXECUTE ON FUNCTION increment_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_comments_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_comments_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_shares_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_shares_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_comment_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_comment_likes_count(UUID) TO authenticated;
