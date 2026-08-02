-- Fix products table to use hierarchical_id as unique identifier instead of external_id
-- Many products have empty external_id from SBIS API

-- Remove duplicate products if any (keep the most recent one)
DELETE FROM products a USING products b
WHERE a.id < b.id
  AND a.hierarchical_id = b.hierarchical_id
  AND a.hierarchical_id IS NOT NULL;

-- Remove external_id unique constraint
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_external_id_key;

-- Add unique constraint on hierarchical_id
ALTER TABLE products 
ADD CONSTRAINT products_hierarchical_id_key UNIQUE (hierarchical_id);

-- Keep external_id index for performance but remove uniqueness
DROP INDEX IF EXISTS idx_products_external_id;
CREATE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id) WHERE external_id IS NOT NULL AND external_id != '';

COMMENT ON CONSTRAINT products_hierarchical_id_key ON products IS 
'Ensures unique hierarchical_id from SBIS API for proper import conflict resolution';

COMMENT ON COLUMN products.external_id IS 
'External ID from SBIS API - not unique, many products have empty values. Use hierarchical_id for uniqueness.';
