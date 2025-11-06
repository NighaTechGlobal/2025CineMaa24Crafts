-- 014: Remove poster_url column from posts table

-- Drop index if it exists
DROP INDEX IF EXISTS idx_posts_poster_url;

-- Drop poster_url column
ALTER TABLE posts
  DROP COLUMN IF EXISTS poster_url;

-- Note: Existing rows should use the BYTEA `image` column for posters.