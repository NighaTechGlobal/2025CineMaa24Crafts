-- 013: Change posts.image_url to posts.image with bytea type

-- Drop the index on image_url first
DROP INDEX IF EXISTS idx_posts_image_url;

-- Rename column from image_url to image
ALTER TABLE posts 
RENAME COLUMN image_url TO image;

-- Change data type from TEXT to bytea
ALTER TABLE posts
ALTER COLUMN image TYPE bytea
USING CASE 
  WHEN image IS NOT NULL AND image != '' THEN decode(image, 'escape')
  ELSE NULL
END;

-- Update comment
COMMENT ON COLUMN posts.image IS 'Binary image data stored directly in the database';

-- Create index on image column (for checking if image exists)
CREATE INDEX IF NOT EXISTS idx_posts_has_image ON posts((image IS NOT NULL)) WHERE image IS NOT NULL;
