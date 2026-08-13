-- Migration: Create location master data tables (States, Cities, Pincodes)
-- This migration creates the tables for pincode-based location grouping

-- Create states table
CREATE TABLE IF NOT EXISTS states (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_state_code UNIQUE (code),
    CONSTRAINT uk_state_name UNIQUE (name)
);

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_id BIGINT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_city_state FOREIGN KEY (state_id) REFERENCES states(id),
    CONSTRAINT uk_city_name_state UNIQUE (name, state_id)
);

-- Create pincodes table
CREATE TABLE IF NOT EXISTS pincodes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(6) NOT NULL UNIQUE,
    city_id BIGINT NOT NULL,
    serviceable BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_pincode_city FOREIGN KEY (city_id) REFERENCES cities(id),
    CONSTRAINT uk_pincode_code UNIQUE (code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_state_code ON states(code);
CREATE INDEX IF NOT EXISTS idx_state_active ON states(active);
CREATE INDEX IF NOT EXISTS idx_city_name ON cities(name);
CREATE INDEX IF NOT EXISTS idx_city_state_id ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_city_active ON cities(active);
CREATE INDEX IF NOT EXISTS idx_city_name_state ON cities(name, state_id);
CREATE INDEX IF NOT EXISTS idx_pincode_code ON pincodes(code);
CREATE INDEX IF NOT EXISTS idx_pincode_city_id ON pincodes(city_id);
CREATE INDEX IF NOT EXISTS idx_pincode_serviceable ON pincodes(serviceable);
CREATE INDEX IF NOT EXISTS idx_pincode_active ON pincodes(active);

-- Add location fields to interests table (nullable initially for migration)
ALTER TABLE interests ADD COLUMN IF NOT EXISTS pincode VARCHAR(6);
ALTER TABLE interests ADD COLUMN IF NOT EXISTS city_id BIGINT;
ALTER TABLE interests ADD COLUMN IF NOT EXISTS state_id BIGINT;

-- Add indexes for interests location fields
CREATE INDEX IF NOT EXISTS idx_interest_city_id ON interests(city_id);
CREATE INDEX IF NOT EXISTS idx_interest_pincode ON interests(pincode);

-- Add location grouping fields to order_groups table (nullable initially for migration)
ALTER TABLE order_groups ADD COLUMN IF NOT EXISTS city_id BIGINT;
ALTER TABLE order_groups ADD COLUMN IF NOT EXISTS grouping_key VARCHAR(255);
ALTER TABLE order_groups ADD COLUMN IF NOT EXISTS city_name VARCHAR(100);

-- Add indexes for order_groups location fields
CREATE INDEX IF NOT EXISTS idx_order_group_city_id ON order_groups(city_id);
CREATE INDEX IF NOT EXISTS idx_order_group_grouping_key ON order_groups(grouping_key);

-- Add location fields to warehouses table (nullable initially for migration)
-- Note: This is in the logistics module, but we'll add it here for reference
-- The actual migration should be in bulkby-logistics module
-- ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS pincode VARCHAR(6);
-- ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS city_id BIGINT;
-- ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS state_id BIGINT;
