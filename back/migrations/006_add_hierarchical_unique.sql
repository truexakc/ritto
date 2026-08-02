-- Add unique constraint on hierarchical_id for categories table
-- This ensures each category has a unique hierarchical_id from SBIS API

-- Remove duplicate categories if any (keep the most recent one)
DELETE FROM categories a USING categories b
WHERE a.id < b.id
  AND a.hierarchical_id = b.hierarchical_id
  AND a.hierarchical_id IS NOT NULL;

-- Add unique constraint
ALTER TABLE categories 
ADD CONSTRAINT categories_hierarchical_id_key UNIQUE (hierarchical_id);

-- Update comment
COMMENT ON CONSTRAINT categories_hierarchical_id_key ON categories IS 
'Ensures unique hierarchical_id from SBIS API for proper import conflict resolution';
