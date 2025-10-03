-- Fix boards delete RLS policy to properly check admin role
-- The issue is the subquery - let's use a simpler check

DROP POLICY IF EXISTS "boards_delete_admin" ON boards;

CREATE POLICY "boards_delete_admin" ON boards FOR DELETE USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
