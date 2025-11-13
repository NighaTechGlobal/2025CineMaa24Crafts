-- 010: Backup posts images before migration
-- This creates a safety backup of the image column before we deprecate it

CREATE TABLE IF NOT EXISTS posts_image_backup (
  id UUID PRIMARY KEY,
  image BYTEA,
  created_at TIMESTAMPTZ DEFAULT now(),
  backed_up_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_posts_image_backup_id ON posts_image_backup(id);

-- Insert existing posts with images into backup
INSERT INTO posts_image_backup (id, image, created_at)
SELECT id, image, created_at
FROM posts
WHERE image IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Add comment
COMMENT ON TABLE posts_image_backup IS 'Backup of posts.image bytea column before migration to image_url';
