-- Add boards and BOM (Bill of Materials) tables

-- Boards table - represents PCB designs/projects
CREATE TABLE IF NOT EXISTS boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0',
  part_number TEXT UNIQUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- BOM (Bill of Materials) - links boards to required parts
CREATE TABLE IF NOT EXISTS board_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  part_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  quantity_required INTEGER NOT NULL CHECK (quantity_required > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(board_id, part_id)
);

-- Board builds - tracks when boards are actually made
CREATE TABLE IF NOT EXISTS board_builds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  built_by UUID REFERENCES users(id),
  quantity_built INTEGER NOT NULL DEFAULT 1 CHECK (quantity_built > 0),
  notes TEXT,
  built_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_builds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards
CREATE POLICY "boards_select_all" ON boards FOR SELECT USING (true);
CREATE POLICY "boards_insert_admin" ON boards FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "boards_update_admin" ON boards FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "boards_delete_admin" ON boards FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for board_parts
CREATE POLICY "board_parts_select_all" ON board_parts FOR SELECT USING (true);
CREATE POLICY "board_parts_insert_admin" ON board_parts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "board_parts_update_admin" ON board_parts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "board_parts_delete_admin" ON board_parts FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for board_builds - everyone can build, but only admins can delete
CREATE POLICY "board_builds_select_all" ON board_builds FOR SELECT USING (true);
CREATE POLICY "board_builds_insert_all" ON board_builds FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);
CREATE POLICY "board_builds_update_admin" ON board_builds FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "board_builds_delete_admin" ON board_builds FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Create updated_at trigger for boards
CREATE OR REPLACE FUNCTION update_boards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_boards_updated_at();

-- Function to build a board (deduct parts from inventory)
CREATE OR REPLACE FUNCTION build_board(
  board_id_param UUID,
  quantity_param INTEGER DEFAULT 1,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  board_record RECORD;
  part_record RECORD;
  missing_parts TEXT[] := '{}';
  insufficient_parts TEXT[] := '{}';
  build_id UUID;
  user_id UUID;
BEGIN
  -- Get the user's ID from the users table based on auth_id
  SELECT id INTO user_id FROM users WHERE auth_id = auth.uid();

  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check if board exists
  SELECT * INTO board_record FROM boards WHERE id = board_id_param AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Board not found or inactive');
  END IF;

  -- Check if we have enough of all required parts
  FOR part_record IN
    SELECT bp.part_id, bp.quantity_required, i.part_id as part_name, i.quantity as available_quantity
    FROM board_parts bp
    JOIN inventory i ON bp.part_id = i.id
    WHERE bp.board_id = board_id_param
  LOOP
    IF part_record.available_quantity < (part_record.quantity_required * quantity_param) THEN
      insufficient_parts := array_append(insufficient_parts,
        part_record.part_name || ' (need ' || (part_record.quantity_required * quantity_param) ||
        ', have ' || part_record.available_quantity || ')');
    END IF;
  END LOOP;

  -- If we don't have enough parts, return error
  IF array_length(insufficient_parts, 1) > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient parts',
      'insufficient_parts', insufficient_parts
    );
  END IF;

  -- All checks passed, deduct parts and record the build
  FOR part_record IN
    SELECT bp.part_id, bp.quantity_required
    FROM board_parts bp
    WHERE bp.board_id = board_id_param
  LOOP
    -- Deduct from inventory
    UPDATE inventory
    SET quantity = quantity - (part_record.quantity_required * quantity_param)
    WHERE id = part_record.part_id;

    -- Record transaction for each consumed part
    INSERT INTO transactions (part_id, user_id, type, quantity, notes)
    VALUES (
      part_record.part_id,
      user_id,
      'adjustment',
      -(part_record.quantity_required * quantity_param),
      'Consumed for board build: ' || board_record.name || ' v' || board_record.version
    );
  END LOOP;

  -- Create or increment the board itself in inventory (if part_number is set)
  IF board_record.part_number IS NOT NULL THEN
    -- Check if board exists in inventory
    DECLARE
      board_inventory_id UUID;
    BEGIN
      SELECT id INTO board_inventory_id
      FROM inventory
      WHERE part_id = board_record.part_number;

      IF board_inventory_id IS NOT NULL THEN
        -- Board exists, increment quantity
        UPDATE inventory
        SET quantity = quantity + quantity_param
        WHERE id = board_inventory_id;

        -- Record transaction for board creation
        INSERT INTO transactions (part_id, user_id, type, quantity, notes)
        VALUES (
          board_inventory_id,
          user_id,
          'adjustment',
          quantity_param,
          'Board manufactured: ' || board_record.name || ' v' || board_record.version
        );
      ELSE
        -- Board doesn't exist in inventory, create it
        INSERT INTO inventory (part_id, description, quantity, location, category)
        VALUES (
          board_record.part_number,
          board_record.name || ' v' || board_record.version,
          quantity_param,
          'MANUFACTURED',
          'Boards'
        )
        RETURNING id INTO board_inventory_id;

        -- Record transaction for initial board creation
        INSERT INTO transactions (part_id, user_id, type, quantity, notes)
        VALUES (
          board_inventory_id,
          user_id,
          'adjustment',
          quantity_param,
          'Initial board manufactured: ' || board_record.name || ' v' || board_record.version
        );
      END IF;
    END;
  END IF;

  -- Record the build
  INSERT INTO board_builds (board_id, built_by, quantity_built, notes)
  VALUES (board_id_param, user_id, quantity_param, notes_param)
  RETURNING id INTO build_id;

  RETURN json_build_object(
    'success', true,
    'build_id', build_id,
    'message', 'Board built successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample boards and BOMs
INSERT INTO boards (name, description, version, created_by) VALUES
  ('Arduino Uno Clone', 'Basic Arduino-compatible microcontroller board', '1.0', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('LED Matrix 8x8', 'Simple 8x8 LED matrix driver board', '1.2', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('Power Supply 5V', '5V regulated power supply board', '2.0', (SELECT id FROM users WHERE role = 'admin' LIMIT 1));

-- Add some BOM entries (linking boards to parts)
-- For Arduino Clone board
INSERT INTO board_parts (board_id, part_id, quantity_required, notes)
SELECT
  (SELECT id FROM boards WHERE name = 'Arduino Uno Clone'),
  i.id,
  CASE
    WHEN i.part_id LIKE '%RES%' THEN 10
    WHEN i.part_id LIKE '%CAP%' THEN 5
    WHEN i.part_id LIKE '%IC%' THEN 1
    ELSE 2
  END,
  'Required for main circuit'
FROM inventory i
WHERE i.part_id IN (
  SELECT part_id FROM inventory
  WHERE part_id LIKE '%RES%' OR part_id LIKE '%CAP%' OR part_id LIKE '%IC%'
  LIMIT 5
);

-- For LED Matrix board
INSERT INTO board_parts (board_id, part_id, quantity_required, notes)
SELECT
  (SELECT id FROM boards WHERE name = 'LED Matrix 8x8'),
  i.id,
  CASE
    WHEN i.part_id LIKE '%LED%' THEN 64
    WHEN i.part_id LIKE '%RES%' THEN 8
    ELSE 1
  END,
  'LED matrix components'
FROM inventory i
WHERE i.part_id LIKE '%LED%' OR i.part_id LIKE '%RES%'
LIMIT 3;