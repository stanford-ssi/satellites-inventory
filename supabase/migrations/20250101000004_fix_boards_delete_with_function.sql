-- Fix boards delete RLS policy using a helper function
-- This is more reliable than inline subqueries

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the DELETE policy using the helper function
DROP POLICY IF EXISTS "boards_delete_admin" ON boards;

CREATE POLICY "boards_delete_admin" ON boards FOR DELETE USING (
  is_admin()
);
