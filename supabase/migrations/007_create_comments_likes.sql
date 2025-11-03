-- 007: Create post_comments and post_likes tables

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_profile_id UUID REFERENCES profiles(id),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fetching comments for a post
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id, created_at ASC);

CREATE TABLE post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  liked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, profile_id)
);

-- Create index for checking if user liked a post
CREATE INDEX idx_post_likes_profile_post ON post_likes(profile_id, post_id);

-- Enable RLS on post_comments and post_likes
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_comments: anyone can read
CREATE POLICY "post_comments_read_all" ON post_comments
  FOR SELECT
  USING (true);

-- RLS policies for post_comments: authenticated users can create comments
CREATE POLICY "post_comments_insert_authenticated" ON post_comments
  FOR INSERT
  WITH CHECK (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for post_comments: authors can delete their own comments
CREATE POLICY "post_comments_delete_own" ON post_comments
  FOR DELETE
  USING (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for post_likes: anyone can read
CREATE POLICY "post_likes_read_all" ON post_likes
  FOR SELECT
  USING (true);

-- RLS policies for post_likes: authenticated users can like posts
CREATE POLICY "post_likes_insert_authenticated" ON post_likes
  FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for post_likes: users can unlike their own likes
CREATE POLICY "post_likes_delete_own" ON post_likes
  FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- Create trigger to update likes_count on posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- Create trigger to update comments_count on posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

