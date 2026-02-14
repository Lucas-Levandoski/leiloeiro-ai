-- Drop existing permissive policies
DROP POLICY IF EXISTS "Public read access for projects" ON projects;
DROP POLICY IF EXISTS "Public insert access for projects" ON projects;
DROP POLICY IF EXISTS "Public update access for projects" ON projects;
DROP POLICY IF EXISTS "Public delete access for projects" ON projects;

DROP POLICY IF EXISTS "Public read access for lotes" ON lotes;
DROP POLICY IF EXISTS "Public insert access for lotes" ON lotes;
DROP POLICY IF EXISTS "Public update access for lotes" ON lotes;
DROP POLICY IF EXISTS "Public delete access for lotes" ON lotes;

-- Drop potential existing RLS policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

DROP POLICY IF EXISTS "Users can view lotes of their projects" ON lotes;
DROP POLICY IF EXISTS "Users can insert lotes to their projects" ON lotes;
DROP POLICY IF EXISTS "Users can update lotes of their projects" ON lotes;
DROP POLICY IF EXISTS "Users can delete lotes of their projects" ON lotes;

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;

-- Projects Policies
CREATE POLICY "Users can view their own projects" 
ON projects FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
ON projects FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON projects FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON projects FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Lotes Policies (Access based on project ownership)
CREATE POLICY "Users can view lotes of their projects" 
ON lotes FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = lotes.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert lotes to their projects" 
ON lotes FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = lotes.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update lotes of their projects" 
ON lotes FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = lotes.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete lotes of their projects" 
ON lotes FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = lotes.project_id 
    AND projects.user_id = auth.uid()
  )
);
