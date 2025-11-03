-- 006: Create posts table

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  image_url TEXT,
  caption TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for listing posts by author and time
CREATE INDEX idx_posts_author_created_at ON posts(author_profile_id, created_at DESC);
-- Create index for general feed (newest first)
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Enable RLS on posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for posts: anyone can read
CREATE POLICY "posts_read_all" ON posts
  FOR SELECT
  USING (true);

-- RLS policies for posts: authenticated users can create posts
CREATE POLICY "posts_insert_authenticated" ON posts
  FOR INSERT
  WITH CHECK (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for posts: authors can update their own posts
CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE
  USING (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for posts: authors can delete their own posts
CREATE POLICY "posts_delete_own" ON posts
  FOR DELETE
  USING (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

