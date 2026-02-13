CREATE TABLE IF NOT EXISTS lotes (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price TEXT,
  estimated_price TEXT,
  city TEXT,
  state TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index for project_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_lotes_project_id ON lotes(project_id);
