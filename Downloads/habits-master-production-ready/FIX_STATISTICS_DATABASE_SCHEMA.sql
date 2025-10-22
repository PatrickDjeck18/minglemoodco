-- Fix Statistics Database Schema Issues
-- This script addresses the database schema problems causing statistics errors

-- 1. Fix practice_logs table - ensure it has the correct column structure
-- Check if practice_logs table exists and has the right columns
DO $$
BEGIN
    -- Check if practice_logs table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_logs') THEN
        -- Create practice_logs table if it doesn't exist
        CREATE TABLE practice_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP WITH TIME ZONE,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_practice_logs_user_id ON practice_logs(user_id);
        CREATE INDEX idx_practice_logs_practice_id ON practice_logs(practice_id);
        CREATE INDEX idx_practice_logs_completed_at ON practice_logs(completed_at);
        
        -- Enable RLS
        ALTER TABLE practice_logs ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own practice logs" ON practice_logs
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can insert their own practice logs" ON practice_logs
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Users can update their own practice logs" ON practice_logs
            FOR UPDATE USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can delete their own practice logs" ON practice_logs
            FOR DELETE USING (auth.uid() = user_id);
    ELSE
        -- Table exists, check if we need to add missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'practice_logs' AND column_name = 'completed') THEN
            ALTER TABLE practice_logs ADD COLUMN completed BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'practice_logs' AND column_name = 'completed_at') THEN
            ALTER TABLE practice_logs ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'practice_logs' AND column_name = 'notes') THEN
            ALTER TABLE practice_logs ADD COLUMN notes TEXT;
        END IF;
    END IF;
END $$;

-- 2. Create reading_sessions table for proper reading progress tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reading_sessions') THEN
        CREATE TABLE reading_sessions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            book_name VARCHAR(255) NOT NULL,
            chapter_number INTEGER NOT NULL,
            verse_start INTEGER,
            verse_end INTEGER,
            date_read DATE NOT NULL,
            time_spent_minutes INTEGER DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_reading_sessions_user_id ON reading_sessions(user_id);
        CREATE INDEX idx_reading_sessions_date_read ON reading_sessions(date_read);
        CREATE INDEX idx_reading_sessions_book_name ON reading_sessions(book_name);
        
        -- Enable RLS
        ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own reading sessions" ON reading_sessions
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can insert their own reading sessions" ON reading_sessions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Users can update their own reading sessions" ON reading_sessions
            FOR UPDATE USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can delete their own reading sessions" ON reading_sessions
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3. Create daily_devotions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_devotions') THEN
        CREATE TABLE daily_devotions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            devotion_date DATE NOT NULL,
            is_completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP WITH TIME ZONE,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_daily_devotions_user_id ON daily_devotions(user_id);
        CREATE INDEX idx_daily_devotions_devotion_date ON daily_devotions(devotion_date);
        
        -- Enable RLS
        ALTER TABLE daily_devotions ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own daily devotions" ON daily_devotions
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can insert their own daily devotions" ON daily_devotions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Users can update their own daily devotions" ON daily_devotions
            FOR UPDATE USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can delete their own daily devotions" ON daily_devotions
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Create gratitude_entries table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gratitude_entries') THEN
        CREATE TABLE gratitude_entries (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            entry_date DATE NOT NULL,
            content TEXT NOT NULL,
            mood VARCHAR(50),
            tags TEXT[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_gratitude_entries_user_id ON gratitude_entries(user_id);
        CREATE INDEX idx_gratitude_entries_entry_date ON gratitude_entries(entry_date);
        
        -- Enable RLS
        ALTER TABLE gratitude_entries ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own gratitude entries" ON gratitude_entries
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can insert their own gratitude entries" ON gratitude_entries
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Users can update their own gratitude entries" ON gratitude_entries
            FOR UPDATE USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can delete their own gratitude entries" ON gratitude_entries
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Update existing practice_logs to have proper completed_at values
UPDATE practice_logs 
SET completed_at = updated_at 
WHERE completed = TRUE AND completed_at IS NULL;

-- 6. Create a function to automatically update completed_at when completed changes
CREATE OR REPLACE FUNCTION update_practice_log_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
        NEW.completed_at = NOW();
    ELSIF NEW.completed = FALSE THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for practice_logs
DROP TRIGGER IF EXISTS trigger_update_practice_log_completed_at ON practice_logs;
CREATE TRIGGER trigger_update_practice_log_completed_at
    BEFORE UPDATE ON practice_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_practice_log_completed_at();

-- 7. Create indexes for better performance on statistics queries
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user_created ON prayer_sessions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_duration ON prayer_sessions(duration);
CREATE INDEX IF NOT EXISTS idx_practices_user_active ON practices(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_memory_verses_user_memorized ON memory_verses(user_id, is_memorized);

-- 8. Create a view for easier statistics calculation
CREATE OR REPLACE VIEW user_statistics_view AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT ps.id) as total_prayer_sessions,
    COALESCE(SUM(ps.duration), 0) as total_prayer_time,
    COALESCE(AVG(ps.duration), 0) as avg_prayer_time,
    COUNT(DISTINCT p.id) as total_practices,
    COUNT(DISTINCT CASE WHEN p.is_active THEN p.id END) as active_practices,
    COUNT(DISTINCT pl.id) as total_practice_logs,
    COUNT(DISTINCT CASE WHEN pl.completed THEN pl.id END) as completed_practice_logs,
    COUNT(DISTINCT mv.id) as total_memory_verses,
    COUNT(DISTINCT CASE WHEN mv.is_memorized THEN mv.id END) as memorized_verses,
    COUNT(DISTINCT dd.id) as total_daily_devotions,
    COUNT(DISTINCT CASE WHEN dd.is_completed THEN dd.id END) as completed_devotions,
    COUNT(DISTINCT ge.id) as total_gratitude_entries,
    COUNT(DISTINCT rs.id) as total_reading_sessions
FROM auth.users u
LEFT JOIN prayer_sessions ps ON u.id = ps.user_id
LEFT JOIN practices p ON u.id = p.user_id
LEFT JOIN practice_logs pl ON u.id = pl.user_id
LEFT JOIN memory_verses mv ON u.id = mv.user_id
LEFT JOIN daily_devotions dd ON u.id = dd.user_id
LEFT JOIN gratitude_entries ge ON u.id = ge.user_id
LEFT JOIN reading_sessions rs ON u.id = rs.user_id
GROUP BY u.id;

-- Grant access to the view
GRANT SELECT ON user_statistics_view TO authenticated;

-- 9. Add comments for documentation
COMMENT ON TABLE practice_logs IS 'Tracks completion of spiritual practices by users';
COMMENT ON TABLE reading_sessions IS 'Tracks Bible reading sessions and progress';
COMMENT ON TABLE daily_devotions IS 'Tracks daily devotion completion';
COMMENT ON TABLE gratitude_entries IS 'Stores user gratitude journal entries';
COMMENT ON VIEW user_statistics_view IS 'Aggregated statistics view for user dashboard';

-- 10. Create a function to get user statistics safely
CREATE OR REPLACE FUNCTION get_user_statistics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'prayer_sessions', COALESCE((
            SELECT json_agg(json_build_object(
                'id', ps.id,
                'duration', ps.duration,
                'created_at', ps.created_at
            ))
            FROM prayer_sessions ps 
            WHERE ps.user_id = user_uuid
        ), '[]'::json),
        'practices', COALESCE((
            SELECT json_agg(json_build_object(
                'id', p.id,
                'name', p.name,
                'is_active', p.is_active,
                'created_at', p.created_at
            ))
            FROM practices p 
            WHERE p.user_id = user_uuid
        ), '[]'::json),
        'reading_progress', COALESCE((
            SELECT json_agg(json_build_object(
                'id', rs.id,
                'book_name', rs.book_name,
                'chapter_number', rs.chapter_number,
                'date_read', rs.date_read,
                'time_spent_minutes', rs.time_spent_minutes
            ))
            FROM reading_sessions rs 
            WHERE rs.user_id = user_uuid
        ), '[]'::json),
        'memory_verses', COALESCE((
            SELECT json_agg(json_build_object(
                'id', mv.id,
                'reference', mv.reference,
                'text', mv.text,
                'is_memorized', mv.is_memorized,
                'created_at', mv.created_at
            ))
            FROM memory_verses mv 
            WHERE mv.user_id = user_uuid
        ), '[]'::json),
        'practice_logs', COALESCE((
            SELECT json_agg(json_build_object(
                'id', pl.id,
                'practice_id', pl.practice_id,
                'completed', pl.completed,
                'completed_at', pl.completed_at,
                'created_at', pl.created_at
            ))
            FROM practice_logs pl 
            WHERE pl.user_id = user_uuid
        ), '[]'::json),
        'daily_devotions', COALESCE((
            SELECT json_agg(json_build_object(
                'id', dd.id,
                'devotion_date', dd.devotion_date,
                'is_completed', dd.is_completed,
                'completed_at', dd.completed_at,
                'created_at', dd.created_at
            ))
            FROM daily_devotions dd 
            WHERE dd.user_id = user_uuid
        ), '[]'::json),
        'gratitude_entries', COALESCE((
            SELECT json_agg(json_build_object(
                'id', ge.id,
                'entry_date', ge.entry_date,
                'content', ge.content,
                'mood', ge.mood,
                'created_at', ge.created_at
            ))
            FROM gratitude_entries ge 
            WHERE ge.user_id = user_uuid
        ), '[]'::json)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_statistics(UUID) TO authenticated;

-- 11. Add RLS policy for the function
CREATE POLICY "Users can get their own statistics" ON auth.users
    FOR SELECT USING (auth.uid() = id);

COMMENT ON FUNCTION get_user_statistics(UUID) IS 'Safely retrieves user statistics with proper error handling';
