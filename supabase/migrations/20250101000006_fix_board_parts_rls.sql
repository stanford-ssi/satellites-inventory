-- Fix board_parts RLS policies to allow authenticated users to insert
-- The previous migration changed the policy but old policies might still exist

-- Drop ALL existing board_parts INSERT policies
DROP POLICY IF EXISTS "board_parts_insert_admin" ON board_parts;
DROP POLICY IF EXISTS "board_parts_insert_authenticated" ON board_parts;

-- Create simple policy: any authenticated user can insert board_parts
CREATE POLICY "board_parts_insert_authenticated" ON board_parts FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Also fix UPDATE policy (might have same issue)
DROP POLICY IF EXISTS "board_parts_update_admin" ON board_parts;

CREATE POLICY "board_parts_update_authenticated" ON board_parts FOR UPDATE USING (
  auth.uid() IS NOT NULL
);

-- Delete should still be admin-only
DROP POLICY IF EXISTS "board_parts_delete_admin" ON board_parts;

CREATE POLICY "board_parts_delete_admin" ON board_parts FOR DELETE USING (
  is_admin()
);
