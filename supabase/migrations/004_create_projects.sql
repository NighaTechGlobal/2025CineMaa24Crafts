-- 004: Create projects and project_members tables

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for listing projects by creator
CREATE INDEX idx_projects_created_by ON projects(created_by, created_at DESC);

CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  role_in_project TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (project_id, profile_id)
);

-- Create index for fetching all projects for a profile
CREATE INDEX idx_project_members_profile_id ON project_members(profile_id, joined_at DESC);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);

-- Enable RLS on projects and project_members
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects: anyone can read
CREATE POLICY "projects_read_all" ON projects
  FOR SELECT
  USING (true);

-- RLS policies for projects: only recruiters can create projects
CREATE POLICY "projects_insert_recruiter" ON projects
  FOR INSERT
  WITH CHECK (
    created_by IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid()::uuid 
        AND role IN ('recruiter', 'admin')
    )
  );

-- RLS policies for projects: creator can update their projects
CREATE POLICY "projects_update_own" ON projects
  FOR UPDATE
  USING (
    created_by IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for project_members: anyone can read
CREATE POLICY "project_members_read_all" ON project_members
  FOR SELECT
  USING (true);

-- RLS policies for project_members: project creator can add members
CREATE POLICY "project_members_insert_by_creator" ON project_members
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects p
      INNER JOIN profiles pr ON p.created_by = pr.id
      WHERE pr.user_id = auth.uid()::uuid
    )
  );

-- RLS policies for project_members: project creator can remove members
CREATE POLICY "project_members_delete_by_creator" ON project_members
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects p
      INNER JOIN profiles pr ON p.created_by = pr.id
      WHERE pr.user_id = auth.uid()::uuid
    )
  );

