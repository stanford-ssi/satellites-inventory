-- Fix board_builds foreign key to allow cascade delete when board is deleted

-- Drop the existing constraint
ALTER TABLE board_builds
DROP CONSTRAINT IF EXISTS board_builds_board_id_fkey;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE board_builds
ADD CONSTRAINT board_builds_board_id_fkey
FOREIGN KEY (board_id)
REFERENCES boards(id)
ON DELETE CASCADE;
