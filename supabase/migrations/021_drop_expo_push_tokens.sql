-- Rollback: drop expo_push_tokens table
DROP INDEX IF EXISTS idx_expo_push_tokens_user_id;
DROP TABLE IF EXISTS public.expo_push_tokens;