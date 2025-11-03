-- 009: Create presence table for typing indicators and online status

CREATE TABLE presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_typing BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, profile_id)
);

-- Create index for fetching presence for a conversation
CREATE INDEX idx_presence_conversation_id ON presence(conversation_id);
CREATE INDEX idx_presence_profile_id ON presence(profile_id, last_seen_at DESC);

-- Enable RLS on presence
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

-- RLS policies for presence: users can read presence in conversations they're part of
CREATE POLICY "presence_read_in_conversation" ON presence
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members cm
      INNER JOIN profiles p ON cm.profile_id = p.id
      WHERE p.user_id = auth.uid()::uuid
    )
  );

-- RLS policies for presence: users can upsert their own presence
CREATE POLICY "presence_insert_own" ON presence
  FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "presence_update_own" ON presence
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- Function to clean up old presence records (last_seen > 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_old_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM presence 
  WHERE last_seen_at < now() - INTERVAL '5 minutes' 
    AND is_typing = FALSE;
END;
$$ LANGUAGE plpgsql;

