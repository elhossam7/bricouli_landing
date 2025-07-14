-- User Profile Model for Supabase
-- This file documents the expected database schema

-- Profiles table (should be created in Supabase)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    role TEXT CHECK (role IN ('client', 'artisan')),
    email TEXT,
    phone TEXT,
    address TEXT,
    bio TEXT,
    avatar_url TEXT,
    business_name TEXT, -- For artisans
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
    service_radius INTEGER, -- Service radius in miles
    zip_code TEXT,
    hourly_rate DECIMAL(10,2),
    skills TEXT[], -- Array of skills
    profile_completed BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table (for statistics)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    artisan_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    location TEXT,
    category TEXT,
    skills_required TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for projects
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (
    auth.uid() = client_id OR auth.uid() = artisan_id
);
CREATE POLICY "Clients can insert projects" ON projects FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (
    auth.uid() = client_id OR auth.uid() = artisan_id
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS projects_client_id_idx ON projects(client_id);
CREATE INDEX IF NOT EXISTS projects_artisan_id_idx ON projects(artisan_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
    
CREATE TRIGGER handle_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
