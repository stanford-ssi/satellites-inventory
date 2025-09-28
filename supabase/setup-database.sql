-- ====================================
-- INVENTORY MANAGEMENT SYSTEM SETUP
-- ====================================
-- Run this script in your Supabase SQL Editor to set up the database

-- 1. CREATE TABLES (if they don't exist)
-- This creates the same tables as in the migration

-- Create custom users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id text NOT NULL UNIQUE,
  description text NOT NULL,
  bin_id text,
  location_within_bin text,
  quantity integer NOT NULL DEFAULT 0,
  min_quantity integer DEFAULT 5,
  part_link text,
  qr_code text,
  is_sensitive boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid REFERENCES inventory(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('checkout', 'return', 'adjustment')),
  quantity integer NOT NULL,
  notes text,
  timestamp timestamptz DEFAULT now()
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 3. CREATE POLICIES

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Members can view non-sensitive inventory" ON inventory;
DROP POLICY IF EXISTS "Admins can manage all inventory" ON inventory;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Inventory policies
CREATE POLICY "Members can view non-sensitive inventory"
  ON inventory
  FOR SELECT
  TO authenticated
  USING (
    NOT is_sensitive OR
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all inventory"
  ON inventory
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. CREATE FUNCTIONS AND TRIGGERS

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (auth_id, email, name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. INSERT SAMPLE INVENTORY DATA
INSERT INTO inventory (part_id, description, bin_id, location_within_bin, quantity, min_quantity, part_link, qr_code, is_sensitive) VALUES
  ('RES-10K-001', '10kΩ Resistor - 1/4W Carbon Film', 'A1', 'Slot 3', 150, 25, 'https://www.digikey.com/product-detail/en/yageo/CFR-25JB-52-10K/10KQBK-ND/338', 'QR-RES-10K-001', false),
  ('GPS-NAV-001', 'GPS Navigation Module - Military Grade (ITAR Controlled)', 'S1', 'Secure Cabinet A', 5, 2, 'https://internal-catalog.company.com/gps-nav-001', 'QR-GPS-NAV-001', true),
  ('CAP-100UF-001', '100µF Electrolytic Capacitor 25V', 'B2', 'Slot 1', 8, 15, 'https://www.mouser.com/ProductDetail/Panasonic/ECA-1EM101', 'QR-CAP-100UF-001', false),
  ('IC-MCU-001', 'STM32F407VGT6 ARM Cortex-M4 Microcontroller', 'C3', 'Anti-static tray 2', 25, 10, 'https://www.st.com/en/microcontrollers-microprocessors/stm32f407vg.html', 'QR-IC-MCU-001', false),
  ('CONN-USB-001', 'USB-C Connector - Right Angle SMD', 'D1', 'Drawer 3', 45, 20, 'https://www.amphenol-icc.com/usb-c-connector-12401548e4-2a', 'QR-CONN-USB-001', false),
  ('CRYPTO-CHIP-001', 'Hardware Security Module - FIPS 140-2 Level 3 (Export Restricted)', 'S2', 'Secure Cabinet B', 3, 5, 'https://internal-catalog.company.com/crypto-chip-001', 'QR-CRYPTO-CHIP-001', true),
  ('LED-RED-001', 'Red LED 5mm High-Brightness', 'E1', 'Bin 12', 12, 50, 'https://www.digikey.com/product-detail/en/kingbright/WP7113ID/754-1264-ND/1747663', 'QR-LED-RED-001', false),
  ('WIRE-22AWG-001', '22AWG Hookup Wire (Red) - 100ft Spool', 'F1', 'Wire Rack', 0, 10, 'https://www.digikey.com/product-detail/en/alpha-wire/3051-RD005/A3051R-100-ND/280895', 'QR-WIRE-22AWG-001', false),
  ('SENSOR-TEMP-001', 'Digital Temperature Sensor - High Precision', 'G2', 'Sensor Drawer', 30, 15, 'https://www.analog.com/en/products/adt7420.html', 'QR-SENSOR-TEMP-001', false),
  ('PSU-5V-001', '5V 2A Switching Power Supply Module', 'H1', 'Power Supply Shelf', 18, 8, 'https://www.meanwell.com/webapp/product/search.aspx?prod=RS-15-5', 'QR-PSU-5V-001', false)
ON CONFLICT (part_id) DO NOTHING;

-- 6. ADD BOARDS AND BOM TABLES

-- Boards table - represents PCB designs/projects
CREATE TABLE IF NOT EXISTS boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0',
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
  board_id UUID REFERENCES boards(id),
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
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "boards_update_admin" ON boards FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "boards_delete_admin" ON boards FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for board_parts
CREATE POLICY "board_parts_select_all" ON board_parts FOR SELECT USING (true);
CREATE POLICY "board_parts_insert_admin" ON board_parts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "board_parts_update_admin" ON board_parts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "board_parts_delete_admin" ON board_parts FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for board_builds - everyone can build, but only admins can delete
CREATE POLICY "board_builds_select_all" ON board_builds FOR SELECT USING (true);
CREATE POLICY "board_builds_insert_all" ON board_builds FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid())
);
CREATE POLICY "board_builds_update_admin" ON board_builds FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "board_builds_delete_admin" ON board_builds FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
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
  -- Get user ID from auth
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
    UPDATE inventory
    SET quantity = quantity - (part_record.quantity_required * quantity_param)
    WHERE id = part_record.part_id;
  END LOOP;

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

-- Insert some sample boards
INSERT INTO boards (name, description, version, created_by)
SELECT
  board_name,
  board_desc,
  '1.0',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM (VALUES
  ('Arduino Uno Clone', 'Basic Arduino-compatible microcontroller board'),
  ('LED Matrix 8x8', 'Simple 8x8 LED matrix driver board'),
  ('Power Supply 5V', '5V regulated power supply board')
) AS sample_boards(board_name, board_desc)
WHERE (SELECT id FROM users WHERE role = 'admin' LIMIT 1) IS NOT NULL;

-- Add some BOM entries (linking boards to parts)
INSERT INTO board_parts (board_id, part_id, quantity_required, notes)
SELECT
  b.id,
  i.id,
  CASE
    WHEN i.part_id LIKE '%RES%' THEN 10
    WHEN i.part_id LIKE '%CAP%' THEN 5
    WHEN i.part_id LIKE '%IC%' THEN 1
    WHEN i.part_id LIKE '%LED%' THEN 8
    ELSE 2
  END,
  'Required component'
FROM boards b
CROSS JOIN inventory i
WHERE (b.name = 'Arduino Uno Clone' AND i.part_id IN ('RES-10K-001', 'CAP-100UF-001', 'IC-MCU-001'))
   OR (b.name = 'LED Matrix 8x8' AND i.part_id IN ('LED-RED-001', 'RES-10K-001'))
   OR (b.name = 'Power Supply 5V' AND i.part_id IN ('CAP-100UF-001', 'IC-MCU-001'))
ON CONFLICT (board_id, part_id) DO NOTHING;

-- 7. SHOW CURRENT STATUS
SELECT 'Setup complete! Tables created and sample data inserted.' as status;
SELECT 'Total inventory items: ' || count(*) as inventory_count FROM inventory;
SELECT 'Total users: ' || count(*) as user_count FROM users;
SELECT 'Total boards: ' || count(*) as board_count FROM boards;