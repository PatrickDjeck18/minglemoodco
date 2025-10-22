-- ADD FASTING RECORDS TABLE
-- Run this to add the missing fasting_records table

-- Create fasting records table
CREATE TABLE IF NOT EXISTS fasting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('water', 'food', 'social_media', 'entertainment', 'custom')),
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  purpose TEXT,
  prayer_focus TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE fasting_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own fasting records" ON fasting_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fasting records" ON fasting_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fasting records" ON fasting_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fasting records" ON fasting_records FOR DELETE USING (auth.uid() = user_id);

-- Success message
SELECT 'Fasting records table added successfully!' as status;
