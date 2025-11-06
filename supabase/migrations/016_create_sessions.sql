-- Create sessions table for persistent, session-based authentication
-- Stores per-device sessions that remain valid until explicit logout

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_info text,
  valid boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used timestamptz NOT NULL DEFAULT now()
);

-- Helpful index for fast validation lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_valid ON public.sessions(valid);

-- No RLS needed for server-side admin access via Supabase service role
-- If enabling RLS later, ensure appropriate policies for server-side operations