-- 001: Create users, profiles, and roles tables

-- Create roles table
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL
);

-- Insert default roles
INSERT INTO roles (id, display_name) VALUES 
  ('artist', 'Artist'),
  ('recruiter', 'Recruiter'),
  ('admin', 'Admin');

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on phone for faster lookups
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT REFERENCES roles(id) NOT NULL DEFAULT 'artist',
  first_name TEXT,
  last_name TEXT,
  alt_phone TEXT,
  maa_associative_number TEXT,
  gender TEXT,
  department TEXT,
  state TEXT,
  city TEXT,
  profile_photo_url TEXT,
  company_id UUID, -- references companies table (will be added in next migration)
  premium_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on user_id for faster profile lookups
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Enable RLS on users and profiles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for users: users can read their own record
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  USING (id = auth.uid()::uuid);

-- RLS policies for profiles: users can read all profiles (for member discovery)
CREATE POLICY "profiles_read_all" ON profiles
  FOR SELECT
  USING (true);

-- RLS policies for profiles: users can update only their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (user_id = auth.uid()::uuid)
  WITH CHECK (user_id = auth.uid()::uuid);

-- RLS policies for profiles: users can insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::uuid);

