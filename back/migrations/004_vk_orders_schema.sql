-- Migration for VK Mini App orders tables
-- Creates tables for VK orders, order items, and rate limiting

-- VK Orders table
CREATE TABLE IF NOT EXISTS vk_orders (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(255) UNIQUE NOT NULL, -- For idempotency
    vk_user_id BIGINT NOT NULL,
    vk_user_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('delivery', 'pickup')),
    delivery_address TEXT,
    comment TEXT,
    total_price DECIMAL(10, 2) NOT NULL, -- Recomputed by backend
    frontend_total_price DECIMAL(10, 2), -- For comparison/logging
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- VK Order Items table
CREATE TABLE IF NOT EXISTS vk_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES vk_orders(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0), -- Actual price from catalog at order time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS vk_rate_limits (
    vk_user_id BIGINT PRIMARY KEY,
    order_count INTEGER NOT NULL DEFAULT 0 CHECK (order_count >= 0),
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_order_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vk_orders_user_id ON vk_orders(vk_user_id);
CREATE INDEX IF NOT EXISTS idx_vk_orders_created_at ON vk_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_vk_orders_request_id ON vk_orders(request_id);
CREATE INDEX IF NOT EXISTS idx_vk_orders_status ON vk_orders(status);
CREATE INDEX IF NOT EXISTS idx_vk_order_items_order_id ON vk_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_vk_order_items_product_id ON vk_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_vk_rate_limits_user_id ON vk_rate_limits(vk_user_id);
CREATE INDEX IF NOT EXISTS idx_vk_rate_limits_window_start ON vk_rate_limits(window_start);

-- Trigger for automatic updated_at on vk_orders
CREATE TRIGGER update_vk_orders_updated_at 
    BEFORE UPDATE ON vk_orders
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE vk_orders IS 'Orders created from VK Mini App';
COMMENT ON COLUMN vk_orders.request_id IS 'Client-generated UUID for idempotency - prevents duplicate orders';
COMMENT ON COLUMN vk_orders.total_price IS 'Backend-recomputed price from actual catalog (trusted)';
COMMENT ON COLUMN vk_orders.frontend_total_price IS 'Frontend-provided price for comparison and fraud detection';
COMMENT ON TABLE vk_order_items IS 'Line items for VK orders';
COMMENT ON TABLE vk_rate_limits IS 'Rate limiting tracking for VK users to prevent spam';
