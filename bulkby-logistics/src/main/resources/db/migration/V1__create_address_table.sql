-- Migration: Create addresses table for shared address storage
-- This table stores addresses for both warehouses and users
-- Only stores pincode - city and state are fetched from pincode lookup

CREATE TABLE IF NOT EXISTS addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    street TEXT NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    city_id BIGINT,
    state_id BIGINT,
    CONSTRAINT fk_address_city FOREIGN KEY (city_id) REFERENCES cities(id),
    CONSTRAINT fk_address_state FOREIGN KEY (state_id) REFERENCES states(id),
    INDEX idx_address_pincode (pincode),
    INDEX idx_address_city_id (city_id),
    INDEX idx_address_state_id (state_id)
);

-- Add address_id column to warehouses table
ALTER TABLE warehouses 
ADD COLUMN address_id BIGINT,
ADD CONSTRAINT fk_warehouse_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE CASCADE;

-- Migrate existing warehouse data to addresses table
INSERT INTO addresses (street, pincode, city_id, state_id)
SELECT 
    COALESCE(address, '') as street,
    COALESCE(pincode, zip_code, '') as pincode,
    city_id,
    state_id
FROM warehouses
WHERE address IS NOT NULL OR pincode IS NOT NULL OR zip_code IS NOT NULL;

-- Update warehouses to reference addresses
UPDATE warehouses w
INNER JOIN addresses a ON (
    a.street = COALESCE(w.address, '') 
    AND a.pincode = COALESCE(w.pincode, w.zip_code, '')
    AND (a.city_id = w.city_id OR (a.city_id IS NULL AND w.city_id IS NULL))
    AND (a.state_id = w.state_id OR (a.state_id IS NULL AND w.state_id IS NULL))
)
SET w.address_id = a.id
WHERE w.address_id IS NULL;

-- Note: Old columns (address, city, state, zip_code, pincode, city_id, state_id) 
-- will be removed in a future migration after verifying data migration
