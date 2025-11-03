-- 005: Create schedules and schedule_members tables

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for listing schedules by project and date
CREATE INDEX idx_schedules_project_date ON schedules(project_id, date);
CREATE INDEX idx_schedules_created_by ON schedules(created_by, created_at DESC);

CREATE TABLE schedule_members (
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending', -- 'accepted', 'declined', 'pending'
  PRIMARY KEY (schedule_id, profile_id)
);

-- Create index for fetching all schedules for a profile
CREATE INDEX idx_schedule_members_profile_id ON schedule_members(profile_id);
CREATE INDEX idx_schedule_members_schedule_id ON schedule_members(schedule_id);

-- Enable RLS on schedules and schedule_members
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for schedules: users can read schedules they're assigned to or that they created
CREATE POLICY "schedules_read_assigned_or_created" ON schedules
  FOR SELECT
  USING (
    created_by IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
    OR
    id IN (
      SELECT schedule_id FROM schedule_members sm
      INNER JOIN profiles p ON sm.profile_id = p.id
      WHERE p.user_id = auth.uid()::uuid
    )
  );

-- RLS policies for schedules: only recruiters can create schedules
CREATE POLICY "schedules_insert_recruiter" ON schedules
  FOR INSERT
  WITH CHECK (
    created_by IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid()::uuid 
        AND role IN ('recruiter', 'admin')
    )
  );

-- RLS policies for schedules: creator can update their schedules
CREATE POLICY "schedules_update_own" ON schedules
  FOR UPDATE
  USING (
    created_by IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for schedule_members: users can read their own schedule assignments
CREATE POLICY "schedule_members_read_own_or_created" ON schedule_members
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
    OR
    schedule_id IN (
      SELECT id FROM schedules s
      INNER JOIN profiles p ON s.created_by = p.id
      WHERE p.user_id = auth.uid()::uuid
    )
  );

-- RLS policies for schedule_members: schedule creator can add members
CREATE POLICY "schedule_members_insert_by_creator" ON schedule_members
  FOR INSERT
  WITH CHECK (
    schedule_id IN (
      SELECT id FROM schedules s
      INNER JOIN profiles p ON s.created_by = p.id
      WHERE p.user_id = auth.uid()::uuid
    )
  );

-- RLS policies for schedule_members: assigned users can update their own status
CREATE POLICY "schedule_members_update_own_status" ON schedule_members
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::uuid
    )
  );

