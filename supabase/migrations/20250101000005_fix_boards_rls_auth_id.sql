-- Fix boards RLS policies to use auth_id instead of id
-- The users table has: id (PK) and auth_id (FK to auth.users)
-- RLS must check auth_id = auth.uid(), not id = auth.uid()

-- Fix the is_admin helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM users
    WHERE auth_id = auth.uid()  -- FIXED: was id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the DELETE policy
DROP POLICY IF EXISTS "boards_delete_admin" ON boards;

CREATE POLICY "boards_delete_admin" ON boards FOR DELETE USING (
  is_admin()
);
