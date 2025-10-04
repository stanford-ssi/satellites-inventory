-- Add part_number column to boards table
ALTER TABLE boards ADD COLUMN IF NOT EXISTS part_number TEXT UNIQUE;

-- Fix build_board function to:
-- 1. Use users.id instead of auth.uid()
-- 2. Record transactions for consumed parts
-- 3. Create/increment board in inventory

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
  board_inventory_id UUID;
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
