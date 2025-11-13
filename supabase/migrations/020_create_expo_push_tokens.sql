-- Create expo_push_tokens table for storing Expo push tokens per user
CREATE TABLE IF NOT EXISTS public.expo_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios','android')) NOT NULL,
  device_name TEXT,
  app_version TEXT,
  os_version TEXT,
  timezone TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('UTC', now()),
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (user_id, token)
);

-- Index for frequent queries by user
CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_user_id ON public.expo_push_tokens(user_id);