-- 011: Update posts table to be project-based with recruiter-only posting

-- Drop old policies
DROP POLICY IF EXISTS "posts_insert_authenticated" ON posts;
DROP POLICY IF EXISTS "posts_update_own" ON posts;
DROP POLICY IF EXISTS "posts_delete_own" ON posts;
DROP POLICY IF EXISTS "posts_read_all" ON posts;

-- Add additional fields to posts table for project details
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS requirements TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'in_progress', 'completed')),
  ADD COLUMN IF NOT EXISTS applications_count INT DEFAULT 0;

-- Rename caption to keep backward compatibility but we'll primarily use description
-- Keep both for now
COMMENT ON COLUMN posts.caption IS 'Legacy field, use description for new posts';
COMMENT ON COLUMN posts.description IS 'Main project description';

-- Create project_applications table
CREATE TABLE IF NOT EXISTS public.project_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  artist_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  cover_letter TEXT,
  portfolio_link TEXT,
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, artist_profile_id)
);

-- Create indexes for project_applications
CREATE INDEX IF NOT EXISTS idx_applications_project ON public.project_applications(project_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_artist ON public.project_applications(artist_profile_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.project_applications(project_id, status);

-- Add trigger for updated_at
CREATE TRIGGER set_application_updated_at
  BEFORE UPDATE ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on project_applications
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for posts: Only recruiters can create posts (projects)
CREATE POLICY "Only recruiters can create posts"
  ON posts
  FOR INSERT
  WITH CHECK (
    author_profile_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid()::uuid 
      AND role = 'recruiter'
    )
  );

-- RLS policies for posts: Everyone can read posts
CREATE POLICY "Everyone can read posts"
  ON posts
  FOR SELECT
  USING (true);

-- RLS policies for posts: Only post author (recruiter) can update
CREATE POLICY "Only post author can update"
  ON posts
  FOR UPDATE
  USING (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for posts: Only post author (recruiter) can delete
CREATE POLICY "Only post author can delete"
  ON posts
  FOR DELETE
  USING (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for project_applications: Artists can apply
CREATE POLICY "Artists can apply to projects"
  ON public.project_applications
  FOR INSERT
  WITH CHECK (
    artist_profile_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid()::uuid 
      AND role = 'artist'
    )
  );

-- RLS policies for project_applications: Everyone can read
CREATE POLICY "Everyone can read applications"
  ON public.project_applications
  FOR SELECT
  USING (true);

-- RLS policies for project_applications: Artists can update their own applications
CREATE POLICY "Artists can update own applications"
  ON public.project_applications
  FOR UPDATE
  USING (
    artist_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for project_applications: Artists can withdraw their applications
CREATE POLICY "Artists can delete own applications"
  ON public.project_applications
  FOR DELETE
  USING (
    artist_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for project_applications: Recruiters can manage applications on their projects
CREATE POLICY "Recruiters can manage applications on their projects"
  ON public.project_applications
  FOR ALL
  USING (
    project_id IN (
      SELECT posts.id FROM posts
      INNER JOIN profiles ON posts.author_profile_id = profiles.id
      WHERE profiles.user_id = auth.uid()::uuid
      AND profiles.role = 'recruiter'
    )
  );

-- Function to increment applications_count when an application is created
CREATE OR REPLACE FUNCTION increment_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET applications_count = applications_count + 1 
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement applications_count when an application is deleted
CREATE OR REPLACE FUNCTION decrement_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET applications_count = applications_count - 1 
  WHERE id = OLD.project_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers for applications count
CREATE TRIGGER increment_applications_on_insert
  AFTER INSERT ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION increment_applications_count();

CREATE TRIGGER decrement_applications_on_delete
  AFTER DELETE ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION decrement_applications_count();

-- Add comments
COMMENT ON TABLE public.project_applications IS 'Stores applications from artists to projects posted by recruiters';
COMMENT ON COLUMN posts.title IS 'Project title';
COMMENT ON COLUMN posts.description IS 'Detailed project description';
COMMENT ON COLUMN posts.requirements IS 'Project requirements and qualifications';
COMMENT ON COLUMN posts.status IS 'Project status: open, closed, in_progress, completed';

