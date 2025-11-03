-- 003: Create social_links table

CREATE TABLE social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT, -- 'website','facebook','twitter','instagram','youtube','other'
  url TEXT,
  order_index INT DEFAULT 0
);

-- Create index for fetching all social links for a profile
CREATE INDEX idx_social_links_profile_id ON social_links(profile_id, order_index);

-- Enable RLS on social_links
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for social_links: anyone can read
CREATE POLICY "social_links_read_all" ON social_links
  FOR SELECT
  USING (true);

-- RLS policies for social_links: users can manage their own social links
CREATE POLICY "social_links_insert_own" ON social_links
  FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "social_links_update_own" ON social_links
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "social_links_delete_own" ON social_links
  FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

