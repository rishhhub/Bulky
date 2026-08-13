-- Seed: Major Indian Cities
-- This script seeds major cities with their state mapping
-- Note: This is a sample. In production, you would import a complete city database.

-- Get state IDs and insert cities
-- Tamil Nadu cities
INSERT INTO cities (name, state_id, active)
SELECT 'Chennai', id, TRUE FROM states WHERE code = 'TN'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, state_id, active)
SELECT 'Coimbatore', id, TRUE FROM states WHERE code = 'TN'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, state_id, active)
SELECT 'Madurai', id, TRUE FROM states WHERE code = 'TN'
ON CONFLICT DO NOTHING;

-- Uttar Pradesh cities
INSERT INTO cities (name, state_id, active)
SELECT 'Varanasi', id, TRUE FROM states WHERE code = 'UP'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, state_id, active)
SELECT 'Lucknow', id, TRUE FROM states WHERE code = 'UP'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, state_id, active)
SELECT 'Kanpur', id, TRUE FROM states WHERE code = 'UP'
ON CONFLICT DO NOTHING;

-- Maharashtra cities
INSERT INTO cities (name, state_id, active)
SELECT 'Mumbai', id, TRUE FROM states WHERE code = 'MH'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, state_id, active)
SELECT 'Pune', id, TRUE FROM states WHERE code = 'MH'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, state_id, active)
SELECT 'Nagpur', id, TRUE FROM states WHERE code = 'MH'
ON CONFLICT DO NOTHING;

-- Karnataka cities
INSERT INTO cities (name, state_id, active)
SELECT 'Bangalore', id, TRUE FROM states WHERE code = 'KA'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, state_id, active)
SELECT 'Mysore', id, TRUE FROM states WHERE code = 'KA'
ON CONFLICT DO NOTHING;

-- Delhi
INSERT INTO cities (name, state_id, active)
SELECT 'New Delhi', id, TRUE FROM states WHERE code = 'DL'
ON CONFLICT DO NOTHING;

-- West Bengal cities
INSERT INTO cities (name, state_id, active)
SELECT 'Kolkata', id, TRUE FROM states WHERE code = 'WB'
ON CONFLICT DO NOTHING;

-- Gujarat cities
INSERT INTO cities (name, state_id, active)
SELECT 'Ahmedabad', id, TRUE FROM states WHERE code = 'GJ'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, state_id, active)
SELECT 'Surat', id, TRUE FROM states WHERE code = 'GJ'
ON CONFLICT DO NOTHING;

-- Rajasthan cities
INSERT INTO cities (name, state_id, active)
SELECT 'Jaipur', id, TRUE FROM states WHERE code = 'RJ'
ON CONFLICT DO NOTHING;

-- Punjab cities
INSERT INTO cities (name, state_id, active)
SELECT 'Chandigarh', id, TRUE FROM states WHERE code = 'PB'
ON CONFLICT DO NOTHING;

-- Kerala cities
INSERT INTO cities (name, state_id, active)
SELECT 'Kochi', id, TRUE FROM states WHERE code = 'KL'
ON CONFLICT DO NOTHING;

-- Telangana cities
INSERT INTO cities (name, state_id, active)
SELECT 'Hyderabad', id, TRUE FROM states WHERE code = 'TG'
ON CONFLICT DO NOTHING;
