-- 011: Finalize image_url migration (run AFTER bytea migration script completes)
-- This drops the old image bytea column after confirming all data is migrated

-- IMPORTANT: Only run this after:
-- 1. Running migrate-bytea-to-storage.js
-- 2. Verifying all posts have image_url or are documented in migration report
-- 3. Confirming posts_image_backup table has all data

-- Drop the old bytea image column
-- ALTER TABLE posts DROP COLUMN IF EXISTS image;

-- For now, just add a comment. Uncomment the DROP after validation.
COMMENT ON COLUMN posts.image IS 'DEPRECATED: Use image_url instead. Will be dropped after migration validation.';
