-- Update boards and board_parts RLS policies to allow any authenticated user to create boards
-- Only admins can delete boards

-- Update boards table policies
DROP POLICY IF EXISTS "boards_insert_admin" ON boards;

CREATE POLICY "boards_insert_authenticated" ON boards FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Update board_parts table policies
DROP POLICY IF EXISTS "board_parts_insert_admin" ON board_parts;

CREATE POLICY "board_parts_insert_authenticated" ON board_parts FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Keep other policies as-is (everyone can read, only admins can delete)
