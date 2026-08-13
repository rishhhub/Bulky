-- Migration: Create wishlist table and add accepting_new_orders to order_groups

-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP NULL,
    UNIQUE KEY uk_user_product (user_id, product_id),
    INDEX idx_wishlist_user_id (user_id),
    INDEX idx_wishlist_product_id (product_id),
    INDEX idx_wishlist_notified_at (notified_at)
);

-- Add accepting_new_orders column to order_groups table
ALTER TABLE order_groups 
ADD COLUMN accepting_new_orders BOOLEAN NOT NULL DEFAULT TRUE;
