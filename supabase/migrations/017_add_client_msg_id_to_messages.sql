-- 017: Add client_msg_id for idempotent message inserts

ALTER TABLE messages ADD COLUMN IF NOT EXISTS client_msg_id TEXT;

-- Enforce idempotency: a sender cannot insert the same client_msg_id twice
CREATE UNIQUE INDEX IF NOT EXISTS uniq_messages_sender_client_msg_id
ON messages(sender_profile_id, client_msg_id)
WHERE client_msg_id IS NOT NULL;