
ALTER TABLE lotes ADD COLUMN user_id UUID REFERENCES auth.users(id);

DROP POLICY IF EXISTS "Users can view lotes of their projects" ON lotes;
DROP POLICY IF EXISTS "Users can insert lotes to their projects" ON lotes;
DROP POLICY IF EXISTS "Users can update lotes of their projects" ON lotes;
DROP POLICY IF EXISTS "Users can delete lotes of their projects" ON lotes;

CREATE POLICY "Users can view their own lotes" 
ON lotes FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lotes" 
ON lotes FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lotes" 
ON lotes FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lotes" 
ON lotes FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);
