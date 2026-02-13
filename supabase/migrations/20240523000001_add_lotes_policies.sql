-- Projects Security
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for projects" ON projects;
CREATE POLICY "Public read access for projects" ON projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Lotes Security
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for lotes" ON lotes;
CREATE POLICY "Public read access for lotes" ON lotes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert lotes for their own projects" ON lotes;
CREATE POLICY "Users can insert lotes for their own projects" ON lotes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update lotes for their own projects" ON lotes;
CREATE POLICY "Users can update lotes for their own projects" ON lotes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete lotes for their own projects" ON lotes;
CREATE POLICY "Users can delete lotes for their own projects" ON lotes FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);
