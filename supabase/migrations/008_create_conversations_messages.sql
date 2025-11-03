-- 008: Create conversations, conversation_members, and messages tables

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group BOOLEAN DEFAULT FALSE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Create index for listing conversations
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

CREATE TABLE conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_admin BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (conversation_id, profile_id)
);

-- Create index for fetching all conversations for a profile
CREATE INDEX idx_conversation_members_profile_id ON conversation_members(profile_id, joined_at DESC);
CREATE INDEX idx_conversation_members_conversation_id ON conversation_members(conversation_id);

CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_profile_id UUID REFERENCES profiles(id),
  content TEXT,
  metadata JSONB, -- attachments, mime-type etc
  created_at TIMESTAMPTZ DEFAULT now(),
  delivered BOOLEAN DEFAULT FALSE,
  read_by JSONB DEFAULT '[]'::jsonb -- array of profile UUIDs who read
);

-- Create index for fetching messages for a conversation (cursor pagination)
CREATE INDEX idx_messages_conversation_created_at ON messages(conversation_id, created_at DESC);
-- Create index for unread message checks
CREATE INDEX idx_messages_delivered ON messages(conversation_id, delivered);

-- Enable RLS on conversations, conversation_members, and messages
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations: users can read conversations they're part of
CREATE POLICY "conversations_read_member" ON conversations
  FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_members cm
      INNER JOIN profiles p ON cm.profile_id = p.id
      WHERE p.user_id = auth.uid()::uuid
    )
  );

-- RLS policies for conversations: authenticated users can create conversations
CREATE POLICY "conversations_insert_authenticated" ON conversations
  FOR INSERT
  WITH CHECK (
    created_by IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for conversation_members: users can read members of conversations they're in
CREATE POLICY "conversation_members_read_in_conversation" ON conversation_members
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members cm
      INNER JOIN profiles p ON cm.profile_id = p.id
      WHERE p.user_id = auth.uid()::uuid
    )
  );

-- RLS policies for conversation_members: conversation creator can add members
CREATE POLICY "conversation_members_insert_by_creator" ON conversation_members
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations c
      INNER JOIN profiles p ON c.created_by = p.id
      WHERE p.user_id = auth.uid()::uuid
    )
    OR
    conversation_id IN (
      SELECT conversation_id FROM conversation_members cm
      INNER JOIN profiles p ON cm.profile_id = p.id
      WHERE p.user_id = auth.uid()::uuid AND cm.is_admin = true
    )
  );

-- RLS policies for messages: users can read messages in conversations they're part of
CREATE POLICY "messages_read_access" ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members cm
      INNER JOIN profiles p ON cm.profile_id = p.id
      WHERE p.user_id = auth.uid()::uuid
    )
  );

-- RLS policies for messages: users can insert messages in conversations they're part of
CREATE POLICY "messages_insert" ON messages
  FOR INSERT
  WITH CHECK (
    sender_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
    AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_members cm
      INNER JOIN profiles p ON cm.profile_id = p.id
      WHERE p.user_id = auth.uid()::uuid
    )
  );

-- RLS policies for messages: users can update messages they sent (for delivered/read status)
CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE
  USING (
    sender_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
    OR
    conversation_id IN (
      SELECT conversation_id FROM conversation_members cm
      INNER JOIN profiles p ON cm.profile_id = p.id
      WHERE p.user_id = auth.uid()::uuid
    )
  );

