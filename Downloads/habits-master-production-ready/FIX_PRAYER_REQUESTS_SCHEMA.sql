-- Fix prayer_requests table schema
-- Add missing columns to prayer_requests table

-- Add is_anonymous column if it doesn't exist
ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Add is_private column if it doesn't exist (in case it's missing too)
ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Add category column if it doesn't exist
ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add social media columns if they don't exist
ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Add is_public column if it doesn't exist
ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Update existing records to have default values
UPDATE prayer_requests 
SET is_anonymous = FALSE 
WHERE is_anonymous IS NULL;

UPDATE prayer_requests 
SET is_private = FALSE 
WHERE is_private IS NULL;

UPDATE prayer_requests 
SET is_public = TRUE 
WHERE is_public IS NULL;

UPDATE prayer_requests 
SET likes_count = 0 
WHERE likes_count IS NULL;

UPDATE prayer_requests 
SET comments_count = 0 
WHERE comments_count IS NULL;

UPDATE prayer_requests 
SET shares_count = 0 
WHERE shares_count IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prayer_requests_is_anonymous ON prayer_requests(is_anonymous);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_is_private ON prayer_requests(is_private);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_category ON prayer_requests(category);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_is_public ON prayer_requests(is_public);
