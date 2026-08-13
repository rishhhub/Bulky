-- Seed: Sample Pincodes for Major Cities
-- This script seeds sample pincodes for major cities
-- Note: This is a sample. In production, you would import a complete pincode database from India Post.

-- Chennai pincodes (Tamil Nadu)
INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '600001', id, TRUE, TRUE FROM cities WHERE name = 'Chennai' AND state_id = (SELECT id FROM states WHERE code = 'TN')
ON CONFLICT DO NOTHING;

INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '600002', id, TRUE, TRUE FROM cities WHERE name = 'Chennai' AND state_id = (SELECT id FROM states WHERE code = 'TN')
ON CONFLICT DO NOTHING;

INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '600003', id, TRUE, TRUE FROM cities WHERE name = 'Chennai' AND state_id = (SELECT id FROM states WHERE code = 'TN')
ON CONFLICT DO NOTHING;

-- Varanasi pincodes (Uttar Pradesh)
INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '221001', id, TRUE, TRUE FROM cities WHERE name = 'Varanasi' AND state_id = (SELECT id FROM states WHERE code = 'UP')
ON CONFLICT DO NOTHING;

INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '221002', id, TRUE, TRUE FROM cities WHERE name = 'Varanasi' AND state_id = (SELECT id FROM states WHERE code = 'UP')
ON CONFLICT DO NOTHING;

-- Mumbai pincodes (Maharashtra)
INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '400001', id, TRUE, TRUE FROM cities WHERE name = 'Mumbai' AND state_id = (SELECT id FROM states WHERE code = 'MH')
ON CONFLICT DO NOTHING;

INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '400002', id, TRUE, TRUE FROM cities WHERE name = 'Mumbai' AND state_id = (SELECT id FROM states WHERE code = 'MH')
ON CONFLICT DO NOTHING;

-- Bangalore pincodes (Karnataka)
INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '560001', id, TRUE, TRUE FROM cities WHERE name = 'Bangalore' AND state_id = (SELECT id FROM states WHERE code = 'KA')
ON CONFLICT DO NOTHING;

INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '560002', id, TRUE, TRUE FROM cities WHERE name = 'Bangalore' AND state_id = (SELECT id FROM states WHERE code = 'KA')
ON CONFLICT DO NOTHING;

-- Delhi pincodes
INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '110001', id, TRUE, TRUE FROM cities WHERE name = 'New Delhi' AND state_id = (SELECT id FROM states WHERE code = 'DL')
ON CONFLICT DO NOTHING;

INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '110002', id, TRUE, TRUE FROM cities WHERE name = 'New Delhi' AND state_id = (SELECT id FROM states WHERE code = 'DL')
ON CONFLICT DO NOTHING;

-- Kolkata pincodes (West Bengal)
INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '700001', id, TRUE, TRUE FROM cities WHERE name = 'Kolkata' AND state_id = (SELECT id FROM states WHERE code = 'WB')
ON CONFLICT DO NOTHING;

-- Hyderabad pincodes (Telangana)
INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '500001', id, TRUE, TRUE FROM cities WHERE name = 'Hyderabad' AND state_id = (SELECT id FROM states WHERE code = 'TG')
ON CONFLICT DO NOTHING;

-- Pune pincodes (Maharashtra)
INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '411001', id, TRUE, TRUE FROM cities WHERE name = 'Pune' AND state_id = (SELECT id FROM states WHERE code = 'MH')
ON CONFLICT DO NOTHING;

-- Ahmedabad pincodes (Gujarat)
INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '380001', id, TRUE, TRUE FROM cities WHERE name = 'Ahmedabad' AND state_id = (SELECT id FROM states WHERE code = 'GJ')
ON CONFLICT DO NOTHING;

-- Jaipur pincodes (Rajasthan)
INSERT INTO pincodes (code, city_id, serviceable, active)
SELECT '302001', id, TRUE, TRUE FROM cities WHERE name = 'Jaipur' AND state_id = (SELECT id FROM states WHERE code = 'RJ')
ON CONFLICT DO NOTHING;
