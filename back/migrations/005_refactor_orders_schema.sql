-- Migration: Refactor orders schema
-- Description: Simplify order storage by keeping only Saby order ID and creation date
-- Date: 2026-02-09

-- Drop old tables that store redundant order data
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Create new simplified table for storing minimal order information
CREATE TABLE IF NOT EXISTS saby_orders (
    id SERIAL PRIMARY KEY,
    saby_order_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saby_orders_order_id ON saby_orders(saby_order_id);
CREATE INDEX IF NOT EXISTS idx_saby_orders_created_at ON saby_orders(created_at);

-- Add table and column comments for documentation
COMMENT ON TABLE saby_orders IS 'Minimal storage for orders sent to Saby API';
COMMENT ON COLUMN saby_orders.id IS 'Internal auto-incrementing identifier';
COMMENT ON COLUMN saby_orders.saby_order_id IS 'Order ID returned from Saby API';
COMMENT ON COLUMN saby_orders.created_at IS 'Timestamp when the order was created';

-- Note: vk_orders and vk_order_items tables are preserved as they are used
-- for temporary storage before sending orders to Saby
