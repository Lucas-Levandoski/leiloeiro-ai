-- Disable RLS on tables temporarily or create permissive policies
-- For projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for projects" ON projects;
CREATE POLICY "Public read access for projects" ON projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert access for projects" ON projects;
CREATE POLICY "Public insert access for projects" ON projects FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access for projects" ON projects;
CREATE POLICY "Public update access for projects" ON projects FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete access for projects" ON projects;
CREATE POLICY "Public delete access for projects" ON projects FOR DELETE USING (true);

-- For lotes
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for lotes" ON lotes;
CREATE POLICY "Public read access for lotes" ON lotes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert access for lotes" ON lotes;
CREATE POLICY "Public insert access for lotes" ON lotes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access for lotes" ON lotes;
CREATE POLICY "Public update access for lotes" ON lotes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete access for lotes" ON lotes;
CREATE POLICY "Public delete access for lotes" ON lotes FOR DELETE USING (true);
