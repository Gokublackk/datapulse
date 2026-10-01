-- ==============================================================================
-- DataPulse Database Schema for PostgreSQL / pgAdmin
-- Generated from SQLAlchemy Models & Alembic Migrations
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: (Run separately if the database doesn't exist yet)
-- Note: In pgAdmin, right click "Databases" -> "Create" -> "Database" -> Name: datapulse
-- Or run this command while connected to the default "postgres" database:
-- ------------------------------------------------------------------------------
-- CREATE DATABASE datapulse;

-- ------------------------------------------------------------------------------
-- STEP 2: Run the queries below while connected to the "datapulse" database in pgAdmin
-- ------------------------------------------------------------------------------

-- Optional: Drop existing tables if recreating from scratch
DROP TABLE IF EXISTS charts CASCADE;
DROP TABLE IF EXISTS dataset_profiles CASCADE;
DROP TABLE IF EXISTS dataset_columns CASCADE;
DROP TABLE IF EXISTS datasets CASCADE;
DROP TABLE IF EXISTS dashboards CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS alembic_version CASCADE;

-- ==============================================================================
-- 1. USERS TABLE
-- ==============================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_users_id ON users (id);

-- ==============================================================================
-- 2. DASHBOARDS TABLE
-- ==============================================================================
CREATE TABLE dashboards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_dashboards_id ON dashboards (id);
CREATE INDEX ix_dashboards_user_id ON dashboards (user_id);

-- ==============================================================================
-- 3. DATASETS TABLE
-- ==============================================================================
CREATE TABLE datasets (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER NOT NULL REFERENCES dashboards (id) ON DELETE CASCADE,
    name VARCHAR(150),
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    rows INTEGER NOT NULL DEFAULT 0,
    columns INTEGER NOT NULL DEFAULT 0,
    firebase_storage_url VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_datasets_id ON datasets (id);
CREATE INDEX ix_datasets_dashboard_id ON datasets (dashboard_id);

-- ==============================================================================
-- 4. DATASET COLUMNS TABLE
-- ==============================================================================
CREATE TABLE dataset_columns (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL REFERENCES datasets (id) ON DELETE CASCADE,
    column_name VARCHAR(150) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    is_numeric BOOLEAN NOT NULL DEFAULT FALSE,
    is_categorical BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX ix_dataset_columns_id ON dataset_columns (id);
CREATE INDEX ix_dataset_columns_dataset_id ON dataset_columns (dataset_id);

-- ==============================================================================
-- 5. DATASET PROFILES TABLE
-- ==============================================================================
CREATE TABLE dataset_profiles (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL UNIQUE REFERENCES datasets (id) ON DELETE CASCADE,
    total_rows INTEGER NOT NULL DEFAULT 0,
    total_columns INTEGER NOT NULL DEFAULT 0,
    missing_values INTEGER NOT NULL DEFAULT 0,
    duplicate_rows INTEGER NOT NULL DEFAULT 0
);

-- ==============================================================================
-- 6. CHARTS TABLE
-- ==============================================================================
CREATE TABLE charts (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER NOT NULL REFERENCES dashboards (id) ON DELETE CASCADE,
    dataset_id INTEGER NOT NULL REFERENCES datasets (id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    chart_type VARCHAR(100) NOT NULL,
    x_axis VARCHAR(100),
    y_axis VARCHAR(100),
    reason VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    configuration JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_charts_id ON charts (id);
CREATE INDEX ix_charts_dashboard_id ON charts (dashboard_id);
CREATE INDEX ix_charts_dataset_id ON charts (dataset_id);

-- ==============================================================================
-- 7. ALEMBIC MIGRATION TRACKING (Matches latest migration: 98e6a2884863)
-- ==============================================================================
CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL PRIMARY KEY
);

INSERT INTO alembic_version (version_num) VALUES ('98e6a2884863')
ON CONFLICT (version_num) DO NOTHING;