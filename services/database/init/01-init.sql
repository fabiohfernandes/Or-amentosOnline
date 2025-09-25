-- OrçamentosOnline - Database Initialization Script
-- CASSANDRA Agent - Database Engineering
-- Version: 1.0
-- Date: September 25, 2025
-- PostgreSQL 15+ Multi-tenant Database Setup

-- This script runs automatically when the PostgreSQL container starts
-- It sets up the initial database structure and configuration

\echo 'Starting OrçamentosOnline database initialization...'

-- ============================================================================
-- DATABASE AND USER SETUP
-- ============================================================================

-- Ensure the application database exists
SELECT 'CREATE DATABASE orcamentos'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'orcamentos')\gexec

-- Connect to the application database
\c orcamentos;

-- Create application user if not exists (handled by Docker environment)
-- This is primarily for documentation as Docker handles user creation

\echo 'Database and user configuration complete.'

-- ============================================================================
-- EXTENSIONS AND COLLATION
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";           -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";             -- Trigram matching for full-text search
CREATE EXTENSION IF NOT EXISTS "unaccent";            -- Remove accents for better search
CREATE EXTENSION IF NOT EXISTS "citext";              -- Case-insensitive text type
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";  -- Query performance monitoring

\echo 'PostgreSQL extensions enabled successfully.'

-- Set up Brazilian Portuguese collation for proper text sorting
-- This is important for Brazilian market requirements
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_collation
        WHERE collname = 'pt_BR_case_insensitive'
    ) THEN
        CREATE COLLATION pt_BR_case_insensitive (
            provider = icu,
            locale = 'pt-BR-u-ks-level2',
            deterministic = false
        );
    END IF;
EXCEPTION
    WHEN others THEN
        -- Fallback if ICU is not available
        RAISE NOTICE 'ICU collation not available, using default collation';
END $$;

\echo 'Collation setup complete.'

-- ============================================================================
-- PERFORMANCE CONFIGURATION
-- ============================================================================

-- Configure database for optimal performance
-- These settings complement the container-level PostgreSQL configuration

-- Enable query plan caching
SET shared_preload_libraries = 'pg_stat_statements';

-- Optimize for multi-tenant workloads
SET log_min_duration_statement = 1000;  -- Log slow queries (1 second+)
SET log_statement = 'mod';               -- Log data modification statements
SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

\echo 'Performance configuration applied.'

-- ============================================================================
-- SECURITY CONFIGURATION
-- ============================================================================

-- Create application roles for different access levels
DO $$
BEGIN
    -- Owner role: Full access (for migrations and admin operations)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'orcamentos_owner') THEN
        CREATE ROLE orcamentos_owner WITH
            LOGIN
            CREATEDB
            CREATEROLE
            REPLICATION
            PASSWORD NULL;  -- Password set via environment variable

        COMMENT ON ROLE orcamentos_owner IS 'Administrative role for database ownership and migrations';
    END IF;

    -- Application role: Standard runtime access
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'orcamentos_app') THEN
        CREATE ROLE orcamentos_app WITH
            LOGIN
            PASSWORD NULL;  -- Password set via environment variable

        COMMENT ON ROLE orcamentos_app IS 'Runtime application role with limited permissions';
    END IF;

    -- Read-only role: For reporting and analytics
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'orcamentos_readonly') THEN
        CREATE ROLE orcamentos_readonly WITH
            LOGIN
            PASSWORD NULL;  -- Password set via environment variable

        COMMENT ON ROLE orcamentos_readonly IS 'Read-only role for reporting and analytics';
    END IF;
END $$;

\echo 'Database roles created successfully.'

-- ============================================================================
-- AUDIT AND COMPLIANCE SETUP
-- ============================================================================

-- Create audit schema for compliance and monitoring
CREATE SCHEMA IF NOT EXISTS audit;
COMMENT ON SCHEMA audit IS 'Schema for audit logs and compliance tracking';

-- Create audit log table for LGPD compliance
CREATE TABLE IF NOT EXISTS audit.data_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID,
    organization_id UUID,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT
);

-- Index for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit.data_access_log (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_org ON audit.data_access_log (user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_table_operation ON audit.data_access_log (table_name, operation);

COMMENT ON TABLE audit.data_access_log IS 'LGPD compliance audit log for data access tracking';

\echo 'Audit and compliance infrastructure ready.'

-- ============================================================================
-- CUSTOM FUNCTIONS
-- ============================================================================

-- Function to generate Brazilian-friendly slugs
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            unaccent(trim(input_text)),
            '[^a-zA-Z0-9]+',
            '-',
            'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION generate_slug(TEXT) IS 'Generate URL-friendly slugs with proper accent handling for Brazilian Portuguese';

-- Function to validate Brazilian CPF/CNPJ
CREATE OR REPLACE FUNCTION validate_cpf_cnpj(document TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    clean_doc TEXT;
    doc_length INTEGER;
BEGIN
    -- Remove non-numeric characters
    clean_doc := regexp_replace(document, '[^0-9]', '', 'g');
    doc_length := length(clean_doc);

    -- Basic length validation
    IF doc_length NOT IN (11, 14) THEN
        RETURN FALSE;
    END IF;

    -- Check for obvious invalid patterns (all same digits)
    IF clean_doc ~ '^(.)\1*$' THEN
        RETURN FALSE;
    END IF;

    -- For now, return TRUE for valid format
    -- Full CPF/CNPJ validation algorithm can be implemented later
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_cpf_cnpj(TEXT) IS 'Basic validation for Brazilian CPF/CNPJ documents';

-- Function to mask sensitive data for LGPD compliance
CREATE OR REPLACE FUNCTION mask_sensitive_data(data_type TEXT, original_value TEXT)
RETURNS TEXT AS $$
BEGIN
    CASE data_type
        WHEN 'email' THEN
            RETURN regexp_replace(original_value, '(.{2}).+(@.+)', '\1***\2');
        WHEN 'phone' THEN
            RETURN regexp_replace(original_value, '(.{2}).+(.{2})', '\1****\2');
        WHEN 'cpf' THEN
            RETURN regexp_replace(original_value, '(.{3}).+(.{2})', '\1.***.**\2');
        WHEN 'cnpj' THEN
            RETURN regexp_replace(original_value, '(.{2}).+(.{2})', '\1.***.***/**\2');
        ELSE
            RETURN '***';
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION mask_sensitive_data(TEXT, TEXT) IS 'Mask sensitive data for LGPD compliance display';

\echo 'Custom functions created successfully.'

-- ============================================================================
-- FULL-TEXT SEARCH CONFIGURATION
-- ============================================================================

-- Create custom text search configuration for Portuguese
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'portuguese_unaccent'
    ) THEN
        CREATE TEXT SEARCH CONFIGURATION portuguese_unaccent (COPY = portuguese);
        ALTER TEXT SEARCH CONFIGURATION portuguese_unaccent
        ALTER MAPPING FOR hword, hword_part, word
        WITH unaccent, portuguese_stem;
    END IF;
END $$;

COMMENT ON TEXT SEARCH CONFIGURATION portuguese_unaccent IS 'Portuguese text search with accent removal for better search results';

\echo 'Full-text search configuration ready.'

-- ============================================================================
-- MONITORING AND MAINTENANCE
-- ============================================================================

-- Create maintenance schema
CREATE SCHEMA IF NOT EXISTS maintenance;
COMMENT ON SCHEMA maintenance IS 'Schema for database maintenance and monitoring utilities';

-- Table to track database migrations
CREATE TABLE IF NOT EXISTS maintenance.migration_history (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_by TEXT DEFAULT current_user,
    execution_time_ms INTEGER,
    checksum TEXT
);

COMMENT ON TABLE maintenance.migration_history IS 'Track database migration execution history';

-- Table for database health monitoring
CREATE TABLE IF NOT EXISTS maintenance.health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
    details JSONB,
    response_time_ms INTEGER
);

-- Index for efficient health check queries
CREATE INDEX IF NOT EXISTS idx_health_checks_time ON maintenance.health_checks (check_time DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON maintenance.health_checks (status, check_name);

COMMENT ON TABLE maintenance.health_checks IS 'Database health monitoring and alerting';

\echo 'Monitoring and maintenance infrastructure ready.'

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Create a record of this initialization
INSERT INTO maintenance.migration_history (version, description, execution_time_ms, checksum)
VALUES (
    '0001_initial_setup',
    'Initial database setup with extensions, roles, and base infrastructure',
    0,  -- Will be updated by migration system
    'initial'
) ON CONFLICT (version) DO NOTHING;

\echo 'Initial setup record created.'

-- ============================================================================
-- PERMISSIONS AND SECURITY
-- ============================================================================

-- Grant appropriate permissions to application role
GRANT USAGE ON SCHEMA public TO orcamentos_app;
GRANT USAGE ON SCHEMA audit TO orcamentos_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO orcamentos_app;
GRANT INSERT ON audit.data_access_log TO orcamentos_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO orcamentos_app;

-- Grant read-only permissions to readonly role
GRANT USAGE ON SCHEMA public TO orcamentos_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO orcamentos_readonly;
GRANT SELECT ON audit.data_access_log TO orcamentos_readonly;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO orcamentos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO orcamentos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO orcamentos_readonly;

\echo 'Permissions configured successfully.'

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Record successful initialization
INSERT INTO maintenance.health_checks (check_name, status, details)
VALUES (
    'database_initialization',
    'healthy',
    jsonb_build_object(
        'message', 'Database initialization completed successfully',
        'timestamp', NOW(),
        'version', '1.0'
    )
);

\echo 'OrçamentosOnline database initialization completed successfully!'
\echo 'Next steps: Run migration scripts to create application schema.';

-- Show initialization summary
SELECT
    'Database: ' || current_database() as info
UNION ALL
SELECT
    'User: ' || current_user
UNION ALL
SELECT
    'Extensions: ' || string_agg(extname, ', ')
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pg_trgm', 'unaccent', 'citext', 'pg_stat_statements')
UNION ALL
SELECT
    'Initialized at: ' || NOW()::TEXT;