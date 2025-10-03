-- Add value and footprint columns to inventory table for BOM support
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS value TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS footprint TEXT;

-- Add assembled_part_id to boards table to link the finished board as an inventory item
ALTER TABLE boards ADD COLUMN IF NOT EXISTS assembled_part_id UUID REFERENCES inventory(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_value ON inventory(value);
CREATE INDEX IF NOT EXISTS idx_inventory_footprint ON inventory(footprint);
CREATE INDEX IF NOT EXISTS idx_boards_assembled_part_id ON boards(assembled_part_id);
