-- Remove unique constraint on external_id as many categories have empty external_id
-- We use hierarchical_id as the primary unique identifier instead

ALTER TABLE categories 
DROP CONSTRAINT IF EXISTS categories_external_id_unique;

-- Keep the index for performance but remove uniqueness
DROP INDEX IF EXISTS idx_categories_external_id;
CREATE INDEX IF NOT EXISTS idx_categories_external_id ON categories(external_id) WHERE external_id IS NOT NULL AND external_id != '';

COMMENT ON COLUMN categories.external_id IS 
'External ID from SBIS API - not unique, many categories have empty values. Use hierarchical_id for uniqueness.';
