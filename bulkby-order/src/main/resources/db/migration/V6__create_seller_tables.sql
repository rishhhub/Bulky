-- Migration: Create seller-related tables and update existing tables

-- Create seller_profiles table
CREATE TABLE IF NOT EXISTS seller_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    company_name VARCHAR(200) NOT NULL,
    company_address TEXT,
    pan_number VARCHAR(10) UNIQUE,
    gstin VARCHAR(15) UNIQUE,
    profile_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    rejection_reason TEXT,
    CONSTRAINT uk_seller_profile_user UNIQUE (user_id),
    CONSTRAINT uk_seller_profile_pan UNIQUE (pan_number),
    CONSTRAINT uk_seller_profile_gstin UNIQUE (gstin),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create category_requests table
CREATE TABLE IF NOT EXISTS category_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    category_name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by BIGINT NULL,
    rejection_reason TEXT,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create grievances table
CREATE TABLE IF NOT EXISTS grievances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    description TEXT,
    resolution TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Update products table to add seller-related fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seller_id BIGINT NULL,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS cost_per_unit DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS delivery_cost_per_min_order DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS listed_price DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL,
ADD FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL;

-- Update orders table to add seller_id
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS seller_id BIGINT NULL,
ADD FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seller_profile_user_id ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profile_status ON seller_profiles(profile_status);
CREATE INDEX IF NOT EXISTS idx_category_request_seller_id ON category_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_category_request_status ON category_requests(status);
CREATE INDEX IF NOT EXISTS idx_grievance_order_id ON grievances(order_id);
CREATE INDEX IF NOT EXISTS idx_grievance_seller_id ON grievances(seller_id);
CREATE INDEX IF NOT EXISTS idx_grievance_user_id ON grievances(user_id);
CREATE INDEX IF NOT EXISTS idx_grievance_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_product_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_approval_status ON products(approval_status);
CREATE INDEX IF NOT EXISTS idx_order_seller_id ON orders(seller_id);

-- Set created_by for existing products (assume they were created by admin)
UPDATE products SET created_by = 'ADMIN' WHERE created_by IS NULL;
