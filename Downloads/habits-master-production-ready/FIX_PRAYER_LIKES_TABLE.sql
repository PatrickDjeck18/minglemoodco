-- Fix prayer_likes table and relationships
-- Create prayer_likes table if it doesn't exist

CREATE TABLE IF NOT EXISTS prayer_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prayer_request_id)
);

-- Enable RLS on prayer_likes table
ALTER TABLE prayer_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prayer_likes
CREATE POLICY "Users can view all prayer likes" ON prayer_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own prayer likes" ON prayer_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prayer likes" ON prayer_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prayer_likes_user_id ON prayer_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_likes_prayer_request_id ON prayer_likes(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_likes_created_at ON prayer_likes(created_at);

-- Create prayer_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS prayer_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES prayer_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on prayer_comments table
ALTER TABLE prayer_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prayer_comments
CREATE POLICY "Users can view all prayer comments" ON prayer_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own prayer comments" ON prayer_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prayer comments" ON prayer_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prayer comments" ON prayer_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for prayer_comments
CREATE INDEX IF NOT EXISTS idx_prayer_comments_user_id ON prayer_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer_request_id ON prayer_comments(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_parent_comment_id ON prayer_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_created_at ON prayer_comments(created_at);

-- Create comment_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES prayer_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- Enable RLS on comment_likes table
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for comment_likes
CREATE POLICY "Users can view all comment likes" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comment likes" ON comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes" ON comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for comment_likes
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_created_at ON comment_likes(created_at);

-- Create prayer_shares table if it doesn't exist
CREATE TABLE IF NOT EXISTS prayer_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prayer_request_id)
);

-- Enable RLS on prayer_shares table
ALTER TABLE prayer_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prayer_shares
CREATE POLICY "Users can view all prayer shares" ON prayer_shares
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own prayer shares" ON prayer_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for prayer_shares
CREATE INDEX IF NOT EXISTS idx_prayer_shares_user_id ON prayer_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_shares_prayer_request_id ON prayer_shares(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_shares_created_at ON prayer_shares(created_at);
