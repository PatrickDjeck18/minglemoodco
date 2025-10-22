-- Fix prayer_sessions table duration column
-- This script updates the existing database to match the code expectations

-- First, check if the column exists and what it's called
DO $$
BEGIN
    -- Check if duration_minutes column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'prayer_sessions' 
        AND column_name = 'duration_minutes'
    ) THEN
        -- Rename duration_minutes to duration
        ALTER TABLE prayer_sessions RENAME COLUMN duration_minutes TO duration;
        RAISE NOTICE 'Renamed duration_minutes to duration in prayer_sessions table';
    ELSIF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'prayer_sessions' 
        AND column_name = 'duration'
    ) THEN
        -- Add duration column if it doesn't exist
        ALTER TABLE prayer_sessions ADD COLUMN duration INTEGER;
        RAISE NOTICE 'Added duration column to prayer_sessions table';
    ELSE
        RAISE NOTICE 'Duration column already exists in prayer_sessions table';
    END IF;
END $$;

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'prayer_sessions' 
AND column_name = 'duration';

SELECT 'Prayer sessions table duration column fix completed successfully!' as status;
