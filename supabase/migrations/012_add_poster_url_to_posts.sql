-- 012: Add poster_url column to posts table for project posters/images

-- Add poster_url column to posts table
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS poster_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN posts.poster_url IS 'URL to the project poster/promotional image uploaded by the recruiter';

-- Create index for faster queries when filtering by posts with posters
CREATE INDEX IF NOT EXISTS idx_posts_poster_url ON posts(poster_url) WHERE poster_url IS NOT NULL;
