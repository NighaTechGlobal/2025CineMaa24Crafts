-- 019_chat_schema_refinements.sql
-- Refine chat schema: add indexes, unique constraints, and RPC for read receipts.

BEGIN;

-- Ensure unique client_msg_id per conversation to support idempotent message send
ALTER TABLE messages
  ADD CONSTRAINT messages_unique_client_msg
  UNIQUE (conversation_id, client_msg_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
  ON messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_members_profile
  ON conversation_members (conversation_id, profile_id);

-- Read receipts RPC: mark messages as read up to a given message id
CREATE OR REPLACE FUNCTION mark_messages_read_up_to(
  p_conversation_id uuid,
  p_profile_id uuid,
  p_last_message_id bigint
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  m RECORD;
BEGIN
  -- Update conversation member last_read_message_id
  UPDATE conversation_members cm
    SET last_read_message_id = p_last_message_id
  WHERE cm.conversation_id = p_conversation_id
    AND cm.profile_id = p_profile_id;

  -- Option A: if messages table has read_by uuid[] column
  FOR m IN
    SELECT id, read_by
    FROM messages
    WHERE conversation_id = p_conversation_id
      AND id <= p_last_message_id
  LOOP
    IF m.read_by IS NULL OR NOT (p_profile_id = ANY (m.read_by)) THEN
      UPDATE messages
        SET read_by = COALESCE(m.read_by, ARRAY[]::uuid[]) || p_profile_id
      WHERE id = m.id;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION mark_messages_read_up_to(uuid, uuid, bigint)
  IS 'Marks messages read up to last_message_id for the given profile in a conversation';

COMMIT;