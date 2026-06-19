-- ============================================================
-- EVM Management System — Microsoft SQL Server Schema
-- Government of India
-- ============================================================

USE evm_management;
GO

-- ============================================================
-- TABLE: states
-- ============================================================
CREATE TABLE states (
    state_id    INT IDENTITY(1,1) PRIMARY KEY,
    state_code  NVARCHAR(10)  NOT NULL UNIQUE,
    state_name  NVARCHAR(100) NOT NULL,
    is_active   BIT           NOT NULL DEFAULT 1,
    created_at  DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at  DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- TABLE: districts
-- ============================================================
CREATE TABLE districts (
    district_id   INT IDENTITY(1,1) PRIMARY KEY,
    district_code NVARCHAR(20)  NOT NULL UNIQUE,
    district_name NVARCHAR(100) NOT NULL,
    state_id      INT           NOT NULL REFERENCES states(state_id),
    is_active     BIT           NOT NULL DEFAULT 1,
    created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    user_id       INT IDENTITY(1,1) PRIMARY KEY,
    user_code     NVARCHAR(50)  NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    full_name     NVARCHAR(150) NOT NULL,
    email         NVARCHAR(150),
    phone         NVARCHAR(20),
    role          NVARCHAR(20)  NOT NULL CHECK (role IN ('ADMIN', 'STATE_OFFICER', 'DISTRICT_OFFICER')),
    state_id      INT           REFERENCES states(state_id),
    district_id   INT           REFERENCES districts(district_id),
    user_type     NVARCHAR(10)  NOT NULL DEFAULT 'PERMANENT' CHECK (user_type IN ('PERMANENT', 'TEMPORARY')),
    valid_from    DATETIME2,
    valid_until   DATETIME2,
    is_active     BIT           NOT NULL DEFAULT 1,
    last_login    DATETIME2,
    created_by    INT           REFERENCES users(user_id),
    failed_login_attempts INT   NOT NULL DEFAULT 0,
    locked_until  DATETIME2,
    created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- TABLE: evm_units
-- ============================================================
CREATE TABLE evm_units (
    unit_id                   INT IDENTITY(1,1) PRIMARY KEY,
    unit_code                 NVARCHAR(100) NOT NULL UNIQUE,
    unit_type                 NVARCHAR(20)  NOT NULL CHECK (unit_type IN ('CONTROL_UNIT', 'BALLOT_UNIT', 'DMM')),
    manufacturer              NVARCHAR(100) NOT NULL,
    manufacturing_year        INT           NOT NULL,
    serial_number             NVARCHAR(100) NOT NULL,
    current_state_id          INT           REFERENCES states(state_id),
    current_district_id       INT           REFERENCES districts(district_id),
    current_location_description NVARCHAR(255),
    box_number                INT           NULL,
    current_status            NVARCHAR(30)  NOT NULL DEFAULT 'IN_WAREHOUSE'
                              CHECK (current_status IN ('IN_WAREHOUSE','IN_TRANSIT')),
    is_active                 BIT           NOT NULL DEFAULT 1,
    created_by                INT           NOT NULL REFERENCES users(user_id),
    created_at                DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at                DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- TABLE: dispatch_batches
-- ============================================================
CREATE TABLE dispatch_batches (
    batch_id        INT IDENTITY(1,1) PRIMARY KEY,
    batch_code      NVARCHAR(50)  NOT NULL UNIQUE,
    dispatched_by   INT           NOT NULL REFERENCES users(user_id),
    from_state_id   INT           NOT NULL REFERENCES states(state_id),
    from_district_id INT          REFERENCES districts(district_id),
    to_state_id     INT           NOT NULL REFERENCES states(state_id),
    to_district_id  INT           REFERENCES districts(district_id),
    dispatch_date   DATETIME2     NOT NULL DEFAULT GETDATE(),
    expected_arrival DATETIME2,
    actual_arrival  DATETIME2,
    dispatch_status NVARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                    CHECK (dispatch_status IN ('PENDING','IN_TRANSIT','PARTIALLY_RECEIVED','RECEIVED','CANCELLED')),
    remarks         NVARCHAR(500),
    total_units     INT           NOT NULL DEFAULT 0,
    received_by     INT           REFERENCES users(user_id),
    created_at      DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- TABLE: dispatch_items
-- ============================================================
CREATE TABLE dispatch_items (
    item_id             INT IDENTITY(1,1) PRIMARY KEY,
    batch_id            INT           NOT NULL REFERENCES dispatch_batches(batch_id),
    unit_id             INT           NOT NULL REFERENCES evm_units(unit_id),
    item_status         NVARCHAR(20)  NOT NULL DEFAULT 'DISPATCHED'
                        CHECK (item_status IN ('DISPATCHED','RECEIVED','MISSING','DAMAGED')),
    received_at         DATETIME2,
    condition_on_receipt NVARCHAR(20) CHECK (condition_on_receipt IN ('GOOD','DAMAGED','FAULTY')),
    box_number          INT           NULL,
    remarks             NVARCHAR(255),
    created_at          DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- TABLE: evm_movement_history
-- ============================================================
CREATE TABLE evm_movement_history (
    history_id      INT IDENTITY(1,1) PRIMARY KEY,
    unit_id         INT           NOT NULL REFERENCES evm_units(unit_id),
    action_type     NVARCHAR(30)  NOT NULL
                    CHECK (action_type IN ('REGISTERED','DISPATCHED','RECEIVED')),
    batch_id        INT           REFERENCES dispatch_batches(batch_id),
    from_state_id   INT           REFERENCES states(state_id),
    from_district_id INT          REFERENCES districts(district_id),
    to_state_id     INT           REFERENCES states(state_id),
    to_district_id  INT           REFERENCES districts(district_id),
    action_by       INT           NOT NULL REFERENCES users(user_id),
    action_date     DATETIME2     NOT NULL DEFAULT GETDATE(),
    remarks         NVARCHAR(500),
    created_at      DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
    log_id      INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT           REFERENCES users(user_id),
    action      NVARCHAR(100) NOT NULL,
    entity_type NVARCHAR(50),
    entity_id   NVARCHAR(100),
    old_values  NVARCHAR(MAX),
    new_values  NVARCHAR(MAX),
    ip_address  NVARCHAR(50),
    user_agent  NVARCHAR(500),
    created_at  DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- TABLE: refresh_tokens
-- ============================================================
CREATE TABLE refresh_tokens (
    token_id    INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT           NOT NULL REFERENCES users(user_id),
    token_hash  NVARCHAR(255) NOT NULL,
    expires_at  DATETIME2     NOT NULL,
    is_revoked  BIT           NOT NULL DEFAULT 0,
    ip_address  NVARCHAR(50),
    created_at  DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IX_users_user_code           ON users(user_code);
CREATE INDEX IX_users_state_district      ON users(state_id, district_id);
CREATE INDEX IX_evm_unit_code             ON evm_units(unit_code);
CREATE INDEX IX_evm_status                ON evm_units(current_status);
CREATE INDEX IX_evm_box_number            ON evm_units(box_number);
CREATE INDEX IX_evm_state_district        ON evm_units(current_state_id, current_district_id);
CREATE INDEX IX_dispatch_batch_code       ON dispatch_batches(batch_code);
CREATE INDEX IX_dispatch_status           ON dispatch_batches(dispatch_status);
CREATE INDEX IX_dispatch_date             ON dispatch_batches(dispatch_date);
CREATE INDEX IX_dispatch_to_state         ON dispatch_batches(to_state_id, to_district_id);
CREATE INDEX IX_dispatch_items_batch      ON dispatch_items(batch_id);
CREATE INDEX IX_dispatch_items_unit       ON dispatch_items(unit_id);
CREATE INDEX IX_movement_unit             ON evm_movement_history(unit_id);
CREATE INDEX IX_movement_action_date      ON evm_movement_history(action_date);
CREATE INDEX IX_audit_user               ON audit_logs(user_id);
CREATE INDEX IX_audit_entity             ON audit_logs(entity_type, entity_id);
CREATE INDEX IX_refresh_token_hash       ON refresh_tokens(token_hash);
CREATE INDEX IX_refresh_user_id          ON refresh_tokens(user_id);
GO

-- ============================================================
-- VIEW: vw_evm_current_status
-- ============================================================
CREATE VIEW vw_evm_current_status AS
SELECT
    e.unit_id,
    e.unit_code,
    e.unit_type,
    e.manufacturer,
    e.manufacturing_year,
    e.serial_number,
    e.current_status,
    e.current_location_description,
    e.box_number,
    e.is_active,
    s.state_id,
    s.state_name,
    s.state_code,
    d.district_id,
    d.district_name,
    d.district_code,
    e.created_at,
    e.updated_at
FROM evm_units e
LEFT JOIN states s ON e.current_state_id = s.state_id
LEFT JOIN districts d ON e.current_district_id = d.district_id;
GO

-- ============================================================
-- VIEW: vw_dispatch_summary
-- ============================================================
CREATE VIEW vw_dispatch_summary AS
SELECT
    b.batch_id,
    b.batch_code,
    b.dispatch_date,
    b.expected_arrival,
    b.actual_arrival,
    b.dispatch_status,
    b.total_units,
    b.remarks,
    u.full_name   AS dispatched_by_name,
    u.user_code   AS dispatched_by_code,
    fs.state_name AS from_state_name,
    fd.district_name AS from_district_name,
    ts.state_name AS to_state_name,
    td.district_name AS to_district_name,
    ru.full_name  AS received_by_name
FROM dispatch_batches b
JOIN users u ON b.dispatched_by = u.user_id
JOIN states fs ON b.from_state_id = fs.state_id
LEFT JOIN districts fd ON b.from_district_id = fd.district_id
JOIN states ts ON b.to_state_id = ts.state_id
LEFT JOIN districts td ON b.to_district_id = td.district_id
LEFT JOIN users ru ON b.received_by = ru.user_id;
GO
