-- 014: Add departments array to posts for multi-department projects

-- Add new column as TEXT[] to store multiple departments
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS departments TEXT[];

-- Backfill departments from existing single department where applicable
UPDATE posts
SET departments = CASE 
  WHEN department IS NULL OR department = '' THEN NULL
  WHEN department LIKE '%,%' THEN string_to_array(department, ',')
  ELSE ARRAY[department]
END
WHERE departments IS NULL;

-- Clean up any whitespace in array elements
UPDATE posts
SET departments = ARRAY(
  SELECT trim(both FROM unnest(departments))
)
WHERE departments IS NOT NULL;

-- Optional: create GIN index for faster contains queries
CREATE INDEX IF NOT EXISTS idx_posts_departments_gin ON posts USING GIN (departments);

COMMENT ON COLUMN posts.departments IS 'List of departments applicable to the project';