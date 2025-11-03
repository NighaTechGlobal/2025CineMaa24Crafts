-- 002: Create companies table

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for searching companies by name
CREATE INDEX idx_companies_name ON companies(name);

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS policies for companies: anyone can read companies
CREATE POLICY "companies_read_all" ON companies
  FOR SELECT
  USING (true);

-- RLS policies for companies: only recruiters associated with the company can update
CREATE POLICY "companies_update_by_recruiter" ON companies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.company_id = companies.id
        AND profiles.user_id = auth.uid()::uuid
        AND profiles.role = 'recruiter'
    )
  );

-- Add foreign key constraint to profiles.company_id now that companies table exists
ALTER TABLE profiles 
  ADD CONSTRAINT fk_profiles_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

