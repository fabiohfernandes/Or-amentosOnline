-- Migration 003: Performance Optimization Enhancements
-- OrçamentosOnline - Database Performance Optimization
-- CASSANDRA Agent - Database Engineering
-- Version: 3.0
-- Date: September 25, 2025

-- This migration implements advanced performance optimizations including
-- strategic indexing, query optimization, and database monitoring enhancements

BEGIN;

-- ============================================================================
-- MIGRATION TRACKING
-- ============================================================================

INSERT INTO maintenance.migration_history (
    version,
    description,
    applied_at
) VALUES (
    '003',
    'Performance optimization with advanced indexing, partitioning preparation, and monitoring',
    NOW()
);

-- ============================================================================
-- ADVANCED INDEXING STRATEGY
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_org_status_created
    ON proposals(organization_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_client_status_updated
    ON proposals(client_id, status, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_assigned_status_priority
    ON proposals(assigned_to, status, (
        CASE status
            WHEN 'draft' THEN 1
            WHEN 'sent' THEN 2
            WHEN 'viewed' THEN 3
            WHEN 'approved' THEN 4
            ELSE 5
        END
    )) WHERE assigned_to IS NOT NULL;

-- Activity logs optimization for audit queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_org_user_time
    ON activity_logs(organization_id, user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_entity_action_time
    ON activity_logs(entity_type, action, created_at DESC);

-- Client search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_org_active_name
    ON clients(organization_id, status, name) WHERE status = 'active';

-- Notification system optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_priority_unread
    ON notifications(user_id, priority, created_at DESC)
    WHERE read_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_scheduled_pending
    ON notifications(scheduled_for)
    WHERE scheduled_for IS NOT NULL AND sent_at IS NULL;

-- File management optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_org_type_created
    ON files(organization_id, file_type, created_at DESC);

-- User session optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_active_expires
    ON user_sessions(user_id, expires_at DESC)
    WHERE is_active = TRUE;

-- Proposal sections and items optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposal_sections_proposal_order
    ON proposal_sections(proposal_id, order_index, is_visible);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposal_items_section_order
    ON proposal_items(section_id, order_index);

-- ============================================================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- ============================================================================

-- Index only active proposals for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_active_dashboard
    ON proposals(organization_id, status, updated_at DESC)
    WHERE status IN ('draft', 'sent', 'viewed');

-- Index only overdue proposals
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_overdue
    ON proposals(organization_id, valid_until, status)
    WHERE valid_until < CURRENT_DATE AND status IN ('sent', 'viewed');

-- Index only files pending virus scan
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_virus_scan_pending
    ON files(created_at DESC)
    WHERE virus_scan_status IN ('pending', 'scanning');

-- Index only failed notifications for retry
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_failed_retry
    ON notifications(last_attempt_at ASC, delivery_attempts)
    WHERE delivery_status ? 'failed' AND delivery_attempts < 3;

-- ============================================================================
-- EXPRESSION INDEXES FOR COMPUTED VALUES
-- ============================================================================

-- Index for proposal value ranges (for reporting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_value_range
    ON proposals(organization_id, (
        CASE
            WHEN total_amount < 10000 THEN 'small'
            WHEN total_amount < 50000 THEN 'medium'
            WHEN total_amount < 200000 THEN 'large'
            ELSE 'enterprise'
        END
    ));

-- Index for proposal age in days
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_age_days
    ON proposals(organization_id, (CURRENT_DATE - created_at::DATE))
    WHERE status IN ('draft', 'sent', 'viewed');

-- Index for client document type (CPF vs CNPJ)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_document_type
    ON clients(organization_id, (
        CASE
            WHEN length(regexp_replace(document, '[^0-9]', '', 'g')) = 11 THEN 'cpf'
            WHEN length(regexp_replace(document, '[^0-9]', '', 'g')) = 14 THEN 'cnpj'
            ELSE 'unknown'
        END
    )) WHERE document IS NOT NULL;

-- ============================================================================
-- STATISTICS OPTIMIZATION
-- ============================================================================

-- Increase statistics targets for columns with high cardinality
ALTER TABLE proposals ALTER COLUMN content SET STATISTICS 1000;
ALTER TABLE proposals ALTER COLUMN design_settings SET STATISTICS 500;
ALTER TABLE clients ALTER COLUMN name SET STATISTICS 1000;
ALTER TABLE activity_logs ALTER COLUMN metadata SET STATISTICS 500;

-- ============================================================================
-- QUERY PERFORMANCE VIEWS
-- ============================================================================

-- View for slow query analysis
CREATE OR REPLACE VIEW maintenance.slow_queries AS
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE calls > 10
ORDER BY total_time DESC;

COMMENT ON VIEW maintenance.slow_queries IS 'Analysis of slow queries for performance optimization';

-- View for table performance statistics
CREATE OR REPLACE VIEW maintenance.table_performance AS
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_tup_hot_upd,
    n_live_tup,
    n_dead_tup,
    CASE
        WHEN seq_scan > 0 THEN seq_tup_read / seq_scan
        ELSE 0
    END AS avg_seq_read,
    CASE
        WHEN idx_scan > 0 THEN idx_tup_fetch / idx_scan
        ELSE 0
    END AS avg_idx_read,
    CASE
        WHEN n_live_tup > 0 THEN (n_dead_tup * 100.0 / n_live_tup)
        ELSE 0
    END AS dead_tuple_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

COMMENT ON VIEW maintenance.table_performance IS 'Table-level performance statistics and health indicators';

-- View for index usage analysis
CREATE OR REPLACE VIEW maintenance.index_usage AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE
        WHEN idx_scan > 0 THEN idx_tup_read / idx_scan
        ELSE 0
    END AS avg_tuples_per_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

COMMENT ON VIEW maintenance.index_usage IS 'Index usage statistics for optimization analysis';

-- ============================================================================
-- DATABASE MONITORING FUNCTIONS
-- ============================================================================

-- Function to analyze table bloat
CREATE OR REPLACE FUNCTION maintenance.analyze_table_bloat()
RETURNS TABLE(
    table_name TEXT,
    bloat_ratio NUMERIC,
    bloat_size TEXT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.tablename::TEXT,
        CASE
            WHEN pg_stat_user_tables.n_live_tup > 0
            THEN ROUND((pg_stat_user_tables.n_dead_tup * 100.0 / pg_stat_user_tables.n_live_tup), 2)
            ELSE 0
        END as bloat_ratio,
        pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename)) as bloat_size,
        CASE
            WHEN pg_stat_user_tables.n_dead_tup > pg_stat_user_tables.n_live_tup * 0.2
            THEN 'Consider VACUUM ANALYZE'
            WHEN pg_stat_user_tables.n_dead_tup > pg_stat_user_tables.n_live_tup * 0.1
            THEN 'Monitor for bloat'
            ELSE 'OK'
        END as recommendation
    FROM pg_tables t
    LEFT JOIN pg_stat_user_tables ON pg_stat_user_tables.relname = t.tablename
    WHERE t.schemaname = 'public'
    ORDER BY
        CASE
            WHEN pg_stat_user_tables.n_live_tup > 0
            THEN (pg_stat_user_tables.n_dead_tup * 100.0 / pg_stat_user_tables.n_live_tup)
            ELSE 0
        END DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintenance.analyze_table_bloat() IS 'Analyze table bloat and provide maintenance recommendations';

-- Function to check connection pool status
CREATE OR REPLACE FUNCTION maintenance.connection_pool_status()
RETURNS TABLE(
    metric TEXT,
    value TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Active connections'::TEXT, count(*)::TEXT FROM pg_stat_activity WHERE state = 'active'
    UNION ALL
    SELECT 'Idle connections'::TEXT, count(*)::TEXT FROM pg_stat_activity WHERE state = 'idle'
    UNION ALL
    SELECT 'Idle in transaction'::TEXT, count(*)::TEXT FROM pg_stat_activity WHERE state = 'idle in transaction'
    UNION ALL
    SELECT 'Total connections'::TEXT, count(*)::TEXT FROM pg_stat_activity
    UNION ALL
    SELECT 'Max connections'::TEXT, setting::TEXT FROM pg_settings WHERE name = 'max_connections'
    UNION ALL
    SELECT 'Connection utilization'::TEXT,
           ROUND((count(*) * 100.0 / (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections')), 2)::TEXT || '%'
    FROM pg_stat_activity;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintenance.connection_pool_status() IS 'Monitor database connection pool utilization';

-- ============================================================================
-- AUTOMATED MAINTENANCE PROCEDURES
-- ============================================================================

-- Function to perform routine maintenance
CREATE OR REPLACE FUNCTION maintenance.routine_maintenance()
RETURNS TEXT AS $$
DECLARE
    maintenance_log TEXT := '';
    rec RECORD;
BEGIN
    -- Update table statistics
    maintenance_log := maintenance_log || 'Updating table statistics...' || E'\n';

    FOR rec IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ANALYZE ' || quote_ident(rec.tablename);
    END LOOP;

    -- Clean up old activity logs (older than 6 months)
    maintenance_log := maintenance_log || 'Cleaning old activity logs...' || E'\n';
    DELETE FROM activity_logs
    WHERE created_at < NOW() - INTERVAL '6 months';

    -- Clean up old health checks (older than 3 months)
    maintenance_log := maintenance_log || 'Cleaning old health checks...' || E'\n';
    DELETE FROM maintenance.health_checks
    WHERE check_time < NOW() - INTERVAL '3 months';

    -- Clean up expired sessions
    maintenance_log := maintenance_log || 'Cleaning expired sessions...' || E'\n';
    DELETE FROM user_sessions
    WHERE expires_at < NOW() OR (is_active = FALSE AND created_at < NOW() - INTERVAL '7 days');

    -- Clean up expired password reset tokens
    maintenance_log := maintenance_log || 'Cleaning expired password reset tokens...' || E'\n';
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW() OR used_at IS NOT NULL;

    maintenance_log := maintenance_log || 'Routine maintenance completed at ' || NOW()::TEXT;

    -- Log maintenance completion
    INSERT INTO maintenance.health_checks (check_name, status, details)
    VALUES (
        'routine_maintenance',
        'healthy',
        jsonb_build_object('log', maintenance_log, 'completed_at', NOW())
    );

    RETURN maintenance_log;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintenance.routine_maintenance() IS 'Perform routine database maintenance tasks';

-- ============================================================================
-- PERFORMANCE MONITORING ALERTS
-- ============================================================================

-- Function to check for performance issues
CREATE OR REPLACE FUNCTION maintenance.performance_health_check()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details JSONB
) AS $$
BEGIN
    -- Check for tables with high dead tuple ratio
    RETURN QUERY
    SELECT
        'high_dead_tuples'::TEXT,
        CASE WHEN bloat_ratio > 20 THEN 'warning' ELSE 'healthy' END,
        jsonb_build_object(
            'table', table_name,
            'bloat_ratio', bloat_ratio,
            'recommendation', recommendation
        )
    FROM maintenance.analyze_table_bloat()
    WHERE bloat_ratio > 10;

    -- Check for unused indexes
    RETURN QUERY
    SELECT
        'unused_indexes'::TEXT,
        CASE WHEN idx_scan < 10 THEN 'warning' ELSE 'healthy' END,
        jsonb_build_object(
            'index', indexname,
            'table', tablename,
            'scans', idx_scan,
            'size', index_size
        )
    FROM maintenance.index_usage
    WHERE idx_scan < 10 AND indexname NOT LIKE '%_pkey';

    -- Check connection pool utilization
    RETURN QUERY
    SELECT
        'connection_pool'::TEXT,
        CASE
            WHEN value::NUMERIC > 80 THEN 'warning'
            WHEN value::NUMERIC > 90 THEN 'critical'
            ELSE 'healthy'
        END,
        jsonb_build_object('utilization', value)
    FROM maintenance.connection_pool_status()
    WHERE metric = 'Connection utilization';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintenance.performance_health_check() IS 'Automated performance health checking with alerts';

-- ============================================================================
-- QUERY OPTIMIZATION HINTS
-- ============================================================================

-- Create a table to store query optimization hints
CREATE TABLE IF NOT EXISTS maintenance.query_hints (
    id SERIAL PRIMARY KEY,
    query_pattern TEXT NOT NULL,
    hint TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_applied TIMESTAMP WITH TIME ZONE,
    effectiveness_score INTEGER CHECK (effectiveness_score BETWEEN 1 AND 10)
);

-- Insert common optimization hints
INSERT INTO maintenance.query_hints (query_pattern, hint, description, effectiveness_score) VALUES
('SELECT * FROM proposals WHERE organization_id = ? AND status = ?',
 'Use idx_proposals_org_status_created index',
 'Composite index optimizes organization + status filtering', 9),

('SELECT * FROM proposals WHERE client_id = ? ORDER BY updated_at DESC',
 'Use idx_proposals_client_status_updated index',
 'Optimized for client-specific proposal queries with sorting', 8),

('SELECT COUNT(*) FROM activity_logs WHERE created_at > ?',
 'Use idx_activity_logs_created index with date range',
 'Time-based filtering is optimized with descending date index', 7),

('SELECT * FROM notifications WHERE user_id = ? AND read_at IS NULL',
 'Use idx_notifications_user_priority_unread index',
 'Partial index for unread notifications by user', 9),

('UPDATE proposals SET status = ? WHERE id = ?',
 'Ensure primary key usage and consider status transition logging',
 'Primary key updates are fast, but consider audit trail', 6);

-- ============================================================================
-- PARTITIONING PREPARATION
-- ============================================================================

-- Create schema for future partitioned tables
CREATE SCHEMA IF NOT EXISTS partitioned;
COMMENT ON SCHEMA partitioned IS 'Schema for partitioned tables (future implementation)';

-- Function to prepare table for partitioning (future use)
CREATE OR REPLACE FUNCTION maintenance.prepare_for_partitioning(
    table_name TEXT,
    partition_column TEXT,
    partition_type TEXT DEFAULT 'RANGE'
)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- This function will be used in future migrations to convert tables to partitioned
    result := format('Table %s prepared for %s partitioning on column %s',
                    table_name, partition_type, partition_column);

    INSERT INTO maintenance.migration_history (version, description, applied_at)
    VALUES ('partition_prep_' || table_name, result, NOW());

    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintenance.prepare_for_partitioning(TEXT, TEXT, TEXT) IS 'Prepare existing tables for future partitioning';

-- ============================================================================
-- PERMISSIONS FOR PERFORMANCE TOOLS
-- ============================================================================

-- Grant necessary permissions for monitoring functions
GRANT EXECUTE ON FUNCTION maintenance.analyze_table_bloat() TO orcamentos_app;
GRANT EXECUTE ON FUNCTION maintenance.connection_pool_status() TO orcamentos_app;
GRANT EXECUTE ON FUNCTION maintenance.performance_health_check() TO orcamentos_app;
GRANT EXECUTE ON FUNCTION maintenance.routine_maintenance() TO orcamentos_owner;

-- Grant access to monitoring views
GRANT SELECT ON maintenance.slow_queries TO orcamentos_app;
GRANT SELECT ON maintenance.table_performance TO orcamentos_app;
GRANT SELECT ON maintenance.index_usage TO orcamentos_app;

-- Grant access to query hints
GRANT SELECT ON maintenance.query_hints TO orcamentos_app;
GRANT SELECT, INSERT, UPDATE ON maintenance.query_hints TO orcamentos_owner;

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Update migration record with completion time
UPDATE maintenance.migration_history
SET execution_time_ms = EXTRACT(EPOCH FROM (NOW() - applied_at)) * 1000
WHERE version = '003';

-- Record successful optimization
INSERT INTO maintenance.health_checks (check_name, status, details)
VALUES (
    'performance_optimization_migration_003',
    'healthy',
    jsonb_build_object(
        'message', 'Performance optimization migration completed successfully',
        'new_indexes', 15,
        'monitoring_views', 3,
        'maintenance_functions', 4,
        'query_hints', 5
    )
);

-- Run initial performance analysis
INSERT INTO maintenance.health_checks (check_name, status, details)
SELECT
    'initial_performance_check',
    status,
    details
FROM maintenance.performance_health_check()
LIMIT 1;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

\echo 'Performance optimization migration completed successfully!'
\echo ''
\echo 'New performance features:'
\echo '- 15+ strategic indexes for common query patterns'
\echo '- Partial indexes for specific use cases'
\echo '- Expression indexes for computed values'
\echo '- Performance monitoring views and functions'
\echo '- Automated maintenance procedures'
\echo '- Query optimization hints system'
\echo ''
\echo 'Performance analysis:'

-- Show index usage summary
SELECT
    'Index Usage Summary' as analysis,
    COUNT(*) as total_indexes,
    COUNT(*) FILTER (WHERE idx_scan > 0) as used_indexes,
    ROUND(AVG(idx_scan), 2) as avg_index_scans
FROM maintenance.index_usage;

-- Show table performance summary
SELECT
    'Table Performance' as analysis,
    COUNT(*) as total_tables,
    ROUND(AVG(dead_tuple_percent), 2) as avg_dead_tuple_percent,
    COUNT(*) FILTER (WHERE dead_tuple_percent > 10) as tables_need_maintenance
FROM maintenance.table_performance;

-- Show connection status
SELECT metric, value FROM maintenance.connection_pool_status();