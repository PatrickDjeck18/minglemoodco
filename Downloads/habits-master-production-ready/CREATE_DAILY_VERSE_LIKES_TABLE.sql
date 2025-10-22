-- Create daily_verse_likes table for social like functionality
-- This table will store likes for daily verses

CREATE TABLE IF NOT EXISTS daily_verse_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_reference TEXT NOT NULL, -- Store the verse reference as identifier
  verse_text TEXT NOT NULL, -- Store the verse text for reference
  verse_date DATE NOT NULL, -- Store the date of the verse
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, verse_reference, verse_date)
);

-- Enable RLS on daily_verse_likes table
ALTER TABLE daily_verse_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_verse_likes
CREATE POLICY "Users can view all daily verse likes" ON daily_verse_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own daily verse likes" ON daily_verse_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily verse likes" ON daily_verse_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_verse_likes_user_id ON daily_verse_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_verse_likes_verse_reference ON daily_verse_likes(verse_reference);
CREATE INDEX IF NOT EXISTS idx_daily_verse_likes_verse_date ON daily_verse_likes(verse_date);
CREATE INDEX IF NOT EXISTS idx_daily_verse_likes_created_at ON daily_verse_likes(created_at);

-- Create a function to get like count for a specific verse
CREATE OR REPLACE FUNCTION get_daily_verse_likes_count(
  p_verse_reference TEXT,
  p_verse_date DATE
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM daily_verse_likes
    WHERE verse_reference = p_verse_reference
    AND verse_date = p_verse_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user has liked a specific verse
CREATE OR REPLACE FUNCTION has_user_liked_daily_verse(
  p_user_id UUID,
  p_verse_reference TEXT,
  p_verse_date DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS(
      SELECT 1
      FROM daily_verse_likes
      WHERE user_id = p_user_id
      AND verse_reference = p_verse_reference
      AND verse_date = p_verse_date
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_daily_verse_likes_count TO authenticated;
GRANT EXECUTE ON FUNCTION has_user_liked_daily_verse TO authenticated;
