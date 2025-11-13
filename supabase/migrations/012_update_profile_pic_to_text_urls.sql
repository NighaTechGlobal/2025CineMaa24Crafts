-- 012: Update profile_pic columns from BYTEA to TEXT for URL storage
-- This migration is for NEW USERS ONLY - existing users' data set to NULL

-- Update artist_profiles.profile_pic from BYTEA to TEXT
-- Existing bytea data will be set to NULL
ALTER TABLE artist_profiles
ALTER COLUMN profile_pic TYPE TEXT
USING NULL;

-- Update recruiter_profiles.profile_pic from BYTEA to TEXT  
-- Existing bytea data will be set to NULL
ALTER TABLE recruiter_profiles
ALTER COLUMN profile_pic TYPE TEXT
USING NULL;

-- Add comments for documentation
COMMENT ON COLUMN artist_profiles.profile_pic IS 'Public Supabase Storage URL for profile picture (new users only, old users show default avatar)';
COMMENT ON COLUMN recruiter_profiles.profile_pic IS 'Public Supabase Storage URL for profile picture (new users only, old users show default avatar)';

-- Note: This migration intentionally does NOT migrate existing bytea data
-- Old users will have NULL profile_pic and will see default avatars
-- Only new user registrations will upload images to Storage and store URLs
