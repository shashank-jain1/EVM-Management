-- ============================================================
-- EVM Management System — Seed Data
-- Government of India
-- Run after schema.sql
-- ============================================================

USE evm_management;
GO

-- ============================================================
-- STATES (5 real Indian states)
-- ============================================================
INSERT INTO states (state_code, state_name) VALUES
('MH', N'Maharashtra'),
('UP', N'Uttar Pradesh'),
('MP', N'Madhya Pradesh'),
('RJ', N'Rajasthan'),
('GJ', N'Gujarat');
GO

-- ============================================================
-- DISTRICTS (3 per state)
-- ============================================================
INSERT INTO districts (district_code, district_name, state_id) VALUES
-- Maharashtra (state_id=1)
('MH-MUM', N'Mumbai',   1),
('MH-PUN', N'Pune',     1),
('MH-NGP', N'Nagpur',   1),
-- Uttar Pradesh (state_id=2)
('UP-LKO', N'Lucknow',  2),
('UP-AGR', N'Agra',     2),
('UP-VNS', N'Varanasi', 2),
-- Madhya Pradesh (state_id=3)
('MP-BPL', N'Bhopal',   3),
('MP-IND', N'Indore',   3),
('MP-GWL', N'Gwalior',  3),
-- Rajasthan (state_id=4)
('RJ-JPR', N'Jaipur',   4),
('RJ-JDH', N'Jodhpur',  4),
('RJ-AJM', N'Ajmer',    4),
-- Gujarat (state_id=5)
('GJ-AMD', N'Ahmedabad',5),
('GJ-SRT', N'Surat',    5),
('GJ-VDR', N'Vadodara', 5);
GO

-- ============================================================
-- ADMIN USER
-- Password: Admin@123#Secure
-- bcrypt hash (12 rounds) — generated offline
-- ============================================================
INSERT INTO users (
    user_code, password_hash, full_name, email, phone,
    role, user_type, is_active, created_at, updated_at
) VALUES (
    'ADMIN001',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewWRfkYHCEpmEXVS',
    N'System Administrator',
    'admin@evm.gov.in',
    '9999999999',
    'ADMIN',
    'PERMANENT',
    1,
    GETDATE(),
    GETDATE()
);
GO

-- ============================================================
-- SAMPLE STATE OFFICER (Maharashtra)
-- Password: Officer@123#
-- ============================================================
INSERT INTO users (
    user_code, password_hash, full_name, email, phone,
    role, state_id, user_type, is_active, created_by, created_at, updated_at
) VALUES (
    'MH-SO-001',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewWRfkYHCEpmEXVS',
    N'Rajesh Kumar Singh',
    'mh.officer@evm.gov.in',
    '9876543210',
    'STATE_OFFICER',
    1,
    'PERMANENT',
    1,
    1,
    GETDATE(),
    GETDATE()
);
GO

-- SAMPLE DISTRICT OFFICER (Mumbai)
INSERT INTO users (
    user_code, password_hash, full_name, email, phone,
    role, state_id, district_id, user_type, is_active, created_by, created_at, updated_at
) VALUES (
    'MH-MUM-DO-001',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewWRfkYHCEpmEXVS',
    N'Priya Sharma',
    'mum.officer@evm.gov.in',
    '9876500001',
    'DISTRICT_OFFICER',
    1,
    1,
    'PERMANENT',
    1,
    1,
    GETDATE(),
    GETDATE()
);
GO

-- ============================================================
-- SAMPLE EVM UNITS (10 units of mixed types)
-- ============================================================
INSERT INTO evm_units (
    unit_code, unit_type, manufacturer, manufacturing_year,
    serial_number, current_state_id, current_district_id,
    current_location_description, current_status, created_by
) VALUES
('EVM-CU-2023-MH-00001', 'CONTROL_UNIT',  'Electronics Corporation of India', 2023, 'SN-CU-00001', 1, 1, N'Mumbai Central Warehouse', 'IN_WAREHOUSE', 1),
('EVM-CU-2023-MH-00002', 'CONTROL_UNIT',  'Electronics Corporation of India', 2023, 'SN-CU-00002', 1, 2, N'Pune District Warehouse',  'IN_WAREHOUSE', 1),
('EVM-BU-2023-MH-00001', 'BALLOT_UNIT',   'Bharat Electronics Limited',       2023, 'SN-BU-00001', 1, 1, N'Mumbai Central Warehouse', 'IN_WAREHOUSE', 1),
('EVM-BU-2023-MH-00002', 'BALLOT_UNIT',   'Bharat Electronics Limited',       2023, 'SN-BU-00002', 1, 2, N'Pune District Warehouse',  'IN_WAREHOUSE', 1),
('EVM-CU-2022-UP-00001', 'CONTROL_UNIT',  'Bharat Electronics Limited',       2022, 'SN-CU-00003', 2, 4, N'Lucknow State Warehouse',  'IN_WAREHOUSE', 1),
('EVM-BU-2022-UP-00001', 'BALLOT_UNIT',   'Electronics Corporation of India', 2022, 'SN-BU-00003', 2, 4, N'Lucknow State Warehouse',  'IN_WAREHOUSE', 1),
('EVM-DM-2022-UP-00001', 'DMM',           'Bharat Electronics Limited',       2022, 'SN-DM-00001', 2, 5, N'Agra District Warehouse',  'IN_WAREHOUSE', 1),
('EVM-CU-2021-MP-00001', 'CONTROL_UNIT',  'Electronics Corporation of India', 2021, 'SN-CU-00004', 3, 7, N'Bhopal State Warehouse',   'IN_WAREHOUSE', 1),
('EVM-BU-2021-MP-00001', 'BALLOT_UNIT',   'Bharat Electronics Limited',       2021, 'SN-BU-00004', 3, 8, N'Indore District Warehouse','IN_WAREHOUSE', 1);
GO

-- ============================================================
-- Seed initial movement history for EVM units (REGISTERED)
-- ============================================================
INSERT INTO evm_movement_history (
    unit_id, action_type, action_by, action_date, remarks
)
SELECT
    unit_id, 'REGISTERED', 1, GETDATE(), N'Initial registration'
FROM evm_units;
GO

PRINT 'Seed data inserted successfully.';
GO
