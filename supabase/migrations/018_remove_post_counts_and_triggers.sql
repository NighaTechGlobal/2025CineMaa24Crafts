-- 018: Remove legacy post counts and triggers; drop old image_url/poster_url columns

-- Safety: drop triggers and functions that referenced likes_count/comments_count
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON post_likes;
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON post_comments;

DROP FUNCTION IF EXISTS update_post_likes_count();
DROP FUNCTION IF EXISTS update_post_comments_count();

-- Drop legacy columns from posts
ALTER TABLE posts
  DROP COLUMN IF EXISTS likes_count,
  DROP COLUMN IF EXISTS comments_count,
  DROP COLUMN IF EXISTS image_url,
  DROP COLUMN IF EXISTS poster_url;

-- Cleanup any legacy indexes that may remain
DROP INDEX IF EXISTS idx_posts_image_url;
DROP INDEX IF EXISTS idx_posts_poster_url;

-- Note: images are stored in BYTEA column `image` (see 013 migration).
--       Counts are computed on demand from post_likes and post_comments.