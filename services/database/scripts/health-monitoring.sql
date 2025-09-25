-- Database Health Monitoring and Alerting System
-- OrçamentosOnline - Comprehensive Database Health Monitoring
-- CASSANDRA Agent - Database Engineering
-- Version: 1.0
-- Date: September 25, 2025

-- This script provides comprehensive database health monitoring,
-- alerting, and diagnostic tools for production environments

-- ============================================================================
-- COMPREHENSIVE HEALTH CHECK SUITE
-- ============================================================================

-- Main health check function that runs all critical checks
CREATE OR REPLACE FUNCTION maintenance.comprehensive_health_check()
RETURNS TABLE(
    check_category TEXT,
    check_name TEXT,
    status TEXT,
    severity TEXT,
    message TEXT,
    details JSONB,
    checked_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Database connectivity and basic functionality
    RETURN QUERY
    SELECT
        'connectivity'::TEXT,
        'database_accessible'::TEXT,
        'healthy'::TEXT,
        'info'::TEXT,
        'Database is accessible and responding'::TEXT,
        jsonb_build_object(
            'current_time', NOW(),
            'database', current_database(),
            'version', version()
        ),
        NOW();

    -- Connection pool status
    RETURN QUERY
    SELECT
        'connectivity'::TEXT,
        'connection_pool'::TEXT,
        CASE
            WHEN connections_percent::NUMERIC > 90 THEN 'critical'
            WHEN connections_percent::NUMERIC > 75 THEN 'warning'
            ELSE 'healthy'
        END,
        CASE
            WHEN connections_percent::NUMERIC > 90 THEN 'critical'
            WHEN connections_percent::NUMERIC > 75 THEN 'warning'
            ELSE 'info'
        END,
        'Connection pool utilization: ' || connections_percent || '%',
        jsonb_build_object(
            'active_connections', active_connections,
            'total_connections', total_connections,
            'max_connections', max_connections,
            'utilization_percent', connections_percent
        ),
        NOW()
    FROM (
        SELECT
            COUNT(*) FILTER (WHERE state = 'active') as active_connections,
            COUNT(*) as total_connections,
            (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections') as max_connections,
            ROUND((COUNT(*) * 100.0 / (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections')), 2)::TEXT as connections_percent
        FROM pg_stat_activity
    ) conn_stats;

    -- Disk space monitoring
    RETURN QUERY
    SELECT
        'storage'::TEXT,
        'database_size'::TEXT,
        CASE
            WHEN pg_database_size(current_database()) > 50 * 1024^3 THEN 'warning' -- 50GB
            ELSE 'healthy'
        END,
        'info'::TEXT,
        'Database size: ' || pg_size_pretty(pg_database_size(current_database())),
        jsonb_build_object(
            'database_size_bytes', pg_database_size(current_database()),
            'database_size_pretty', pg_size_pretty(pg_database_size(current_database()))
        ),
        NOW();

    -- Table bloat analysis
    RETURN QUERY
    SELECT
        'performance'::TEXT,
        'table_bloat_' || table_name,
        CASE
            WHEN bloat_ratio > 25 THEN 'critical'
            WHEN bloat_ratio > 15 THEN 'warning'
            ELSE 'healthy'
        END,
        CASE
            WHEN bloat_ratio > 25 THEN 'critical'
            WHEN bloat_ratio > 15 THEN 'warning'
            ELSE 'info'
        END,
        table_name || ' bloat: ' || bloat_ratio::TEXT || '%',
        jsonb_build_object(
            'table', table_name,
            'bloat_ratio', bloat_ratio,
            'recommendation', recommendation
        ),
        NOW()
    FROM maintenance.analyze_table_bloat()
    WHERE bloat_ratio > 10;

    -- Long-running queries
    RETURN QUERY
    SELECT
        'performance'::TEXT,
        'long_running_queries'::TEXT,
        CASE
            WHEN query_duration > INTERVAL '10 minutes' THEN 'critical'
            WHEN query_duration > INTERVAL '5 minutes' THEN 'warning'
            ELSE 'healthy'
        END,
        CASE
            WHEN query_duration > INTERVAL '10 minutes' THEN 'critical'
            WHEN query_duration > INTERVAL '5 minutes' THEN 'warning'
            ELSE 'info'
        END,
        'Query running for ' || query_duration::TEXT,
        jsonb_build_object(
            'pid', pid,
            'duration', EXTRACT(EPOCH FROM query_duration),
            'state', state,
            'query_snippet', LEFT(query, 100),
            'application_name', application_name
        ),
        NOW()
    FROM (
        SELECT
            pid,
            NOW() - query_start as query_duration,
            state,
            query,
            application_name
        FROM pg_stat_activity
        WHERE state = 'active'
        AND query NOT LIKE '%pg_stat_activity%'
        AND query_start IS NOT NULL
        ORDER BY query_start ASC
        LIMIT 5
    ) long_queries
    WHERE query_duration > INTERVAL '30 seconds';

    -- Lock monitoring
    RETURN QUERY
    SELECT
        'performance'::TEXT,
        'blocking_locks'::TEXT,
        'warning'::TEXT,
        'warning'::TEXT,
        'Blocking lock detected on ' || blocked_table,
        jsonb_build_object(
            'blocking_pid', blocking_pid,
            'blocked_pid', blocked_pid,
            'blocked_table', blocked_table,
            'lock_type', lock_type,
            'lock_mode', lock_mode
        ),
        NOW()
    FROM (
        SELECT
            blocking.pid as blocking_pid,
            blocked.pid as blocked_pid,
            blocked.relation::regclass::TEXT as blocked_table,
            blocking.mode as lock_type,
            blocked.mode as lock_mode
        FROM pg_locks blocking
        JOIN pg_locks blocked ON blocking.locktype = blocked.locktype
        AND blocking.database = blocked.database
        AND blocking.relation = blocked.relation
        WHERE NOT blocking.granted
        AND blocked.granted
        AND blocking.pid != blocked.pid
    ) locks;

    -- LGPD compliance monitoring
    RETURN QUERY
    SELECT
        'compliance'::TEXT,
        'lgpd_data_requests'::TEXT,
        CASE
            WHEN overdue_requests > 0 THEN 'critical'
            WHEN due_soon_requests > 0 THEN 'warning'
            ELSE 'healthy'
        END,
        CASE
            WHEN overdue_requests > 0 THEN 'critical'
            WHEN due_soon_requests > 0 THEN 'warning'
            ELSE 'info'
        END,
        CASE
            WHEN overdue_requests > 0 THEN overdue_requests::TEXT || ' overdue LGPD requests'
            WHEN due_soon_requests > 0 THEN due_soon_requests::TEXT || ' LGPD requests due soon'
            ELSE 'All LGPD requests on track'
        END,
        jsonb_build_object(
            'total_requests', total_requests,
            'overdue_requests', overdue_requests,
            'due_soon_requests', due_soon_requests,
            'completed_requests', completed_requests
        ),
        NOW()
    FROM (
        SELECT
            COUNT(*) as total_requests,
            COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('completed', 'cancelled')) as overdue_requests,
            COUNT(*) FILTER (WHERE due_date < NOW() + INTERVAL '3 days' AND status NOT IN ('completed', 'cancelled')) as due_soon_requests,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_requests
        FROM data_subject_requests
    ) lgpd_stats;

    -- Replication status (if applicable)
    RETURN QUERY
    SELECT
        'replication'::TEXT,
        'replication_lag'::TEXT,
        CASE
            WHEN pg_is_in_recovery() THEN
                CASE
                    WHEN EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp())) > 300 THEN 'critical'
                    WHEN EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp())) > 60 THEN 'warning'
                    ELSE 'healthy'
                END
            ELSE 'healthy'
        END,
        'info'::TEXT,
        CASE
            WHEN pg_is_in_recovery() THEN 'Replication lag: ' || EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp()))::TEXT || ' seconds'
            ELSE 'Primary database (no replication lag)'
        END,
        jsonb_build_object(
            'is_replica', pg_is_in_recovery(),
            'last_replay_timestamp', pg_last_xact_replay_timestamp(),
            'lag_seconds', CASE WHEN pg_is_in_recovery() THEN EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp())) ELSE 0 END
        ),
        NOW();

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintenance.comprehensive_health_check() IS 'Complete database health assessment with severity levels';

-- ============================================================================
-- BUSINESS LOGIC HEALTH CHECKS
-- ============================================================================

-- Function to validate business data integrity
CREATE OR REPLACE FUNCTION maintenance.business_integrity_check()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    message TEXT,
    affected_records INTEGER,
    details JSONB
) AS $$
BEGIN
    -- Check for proposals without clients (orphaned proposals)
    RETURN QUERY
    SELECT
        'orphaned_proposals'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'warning' ELSE 'healthy' END,
        CASE WHEN COUNT(*) > 0 THEN COUNT(*)::TEXT || ' proposals without valid clients' ELSE 'All proposals have valid clients' END,
        COUNT(*)::INTEGER,
        jsonb_agg(
            jsonb_build_object(
                'proposal_id', id,
                'title', title,
                'client_id', client_id,
                'created_at', created_at
            )
        )
    FROM proposals
    WHERE client_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM clients WHERE clients.id = proposals.client_id);

    -- Check for invalid CPF/CNPJ documents
    RETURN QUERY
    SELECT
        'invalid_documents'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'warning' ELSE 'healthy' END,
        CASE WHEN COUNT(*) > 0 THEN COUNT(*)::TEXT || ' clients with invalid CPF/CNPJ' ELSE 'All documents are valid' END,
        COUNT(*)::INTEGER,
        jsonb_agg(
            jsonb_build_object(
                'client_id', id,
                'name', name,
                'document', document,
                'organization_id', organization_id
            )
        )
    FROM clients
    WHERE document IS NOT NULL
    AND NOT validate_cpf_cnpj(document);

    -- Check for proposals with inconsistent totals
    RETURN QUERY
    SELECT
        'inconsistent_proposal_totals'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'warning' ELSE 'healthy' END,
        CASE WHEN COUNT(*) > 0 THEN COUNT(*)::TEXT || ' proposals with inconsistent totals' ELSE 'All proposal totals are consistent' END,
        COUNT(*)::INTEGER,
        jsonb_agg(
            jsonb_build_object(
                'proposal_id', p.id,
                'title', p.title,
                'calculated_total', calculated_total,
                'stored_total', p.total_amount,
                'difference', ABS(calculated_total - p.total_amount)
            )
        )
    FROM proposals p
    JOIN (
        SELECT
            proposal_id,
            SUM(total_price) as calculated_total
        FROM proposal_sections ps
        JOIN proposal_items pi ON pi.section_id = ps.id
        GROUP BY proposal_id
    ) calc ON calc.proposal_id = p.id
    WHERE ABS(calc.calculated_total - p.total_amount) > 0.01; -- Allow for minor rounding differences

    -- Check for users without organizations
    RETURN QUERY
    SELECT
        'orphaned_users'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'critical' ELSE 'healthy' END,
        CASE WHEN COUNT(*) > 0 THEN COUNT(*)::TEXT || ' users without valid organizations' ELSE 'All users have valid organizations' END,
        COUNT(*)::INTEGER,
        jsonb_agg(
            jsonb_build_object(
                'user_id', u.id,
                'email', u.email,
                'organization_id', u.organization_id,
                'created_at', u.created_at
            )
        )
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = u.organization_id);

    -- Check for files without virus scan status
    RETURN QUERY
    SELECT
        'unscanned_files'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'warning' ELSE 'healthy' END,
        CASE WHEN COUNT(*) > 0 THEN COUNT(*)::TEXT || ' files without virus scan' ELSE 'All files have been scanned' END,
        COUNT(*)::INTEGER,
        jsonb_agg(
            jsonb_build_object(
                'file_id', id,
                'filename', original_filename,
                'uploaded_at', created_at,
                'virus_scan_status', virus_scan_status
            )
        )
    FROM files
    WHERE virus_scan_status = 'pending'
    AND created_at < NOW() - INTERVAL '1 hour'; -- Files older than 1 hour should be scanned

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintenance.business_integrity_check() IS 'Validate business logic integrity and data consistency';

-- ============================================================================
-- PERFORMANCE METRICS COLLECTION
-- ============================================================================

-- Function to collect performance metrics
CREATE OR REPLACE FUNCTION maintenance.collect_performance_metrics()
RETURNS TABLE(
    metric_name TEXT,
    metric_value NUMERIC,
    metric_unit TEXT,
    collected_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Database size metrics
    RETURN QUERY
    SELECT
        'database_size_mb'::TEXT,
        ROUND(pg_database_size(current_database()) / (1024*1024)::NUMERIC, 2),
        'MB'::TEXT,
        NOW();

    -- Active connections
    RETURN QUERY
    SELECT
        'active_connections'::TEXT,
        COUNT(*)::NUMERIC,
        'connections'::TEXT,
        NOW()
    FROM pg_stat_activity
    WHERE state = 'active';

    -- Average query response time (from pg_stat_statements if available)
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        RETURN QUERY
        SELECT
            'avg_query_time_ms'::TEXT,
            ROUND(AVG(mean_time), 2),
            'ms'::TEXT,
            NOW()
        FROM pg_stat_statements
        WHERE calls > 10;
    END IF;

    -- Cache hit ratio
    RETURN QUERY
    SELECT
        'cache_hit_ratio'::TEXT,
        ROUND(
            100 * sum(blks_hit)::NUMERIC / (sum(blks_hit) + sum(blks_read)),
            2
        ),
        'percent'::TEXT,
        NOW()
    FROM pg_stat_database
    WHERE datname = current_database();

    -- Transaction throughput (commits + rollbacks per second)
    RETURN QUERY
    SELECT
        'transaction_throughput'::TEXT,
        ROUND(
            (xact_commit + xact_rollback)::NUMERIC /
            GREATEST(EXTRACT(EPOCH FROM (stats_reset - NOW())), 1),
            2
        ),
        'transactions_per_second'::TEXT,
        NOW()
    FROM pg_stat_database
    WHERE datname = current_database();

    -- Table scan vs index scan ratio
    RETURN QUERY
    SELECT
        'index_usage_ratio'::TEXT,
        CASE
            WHEN SUM(seq_scan + idx_scan) > 0 THEN
                ROUND(100.0 * SUM(idx_scan)::NUMERIC / SUM(seq_scan + idx_scan), 2)
            ELSE 0
        END,
        'percent'::TEXT,
        NOW()
    FROM pg_stat_user_tables;

    -- Business metrics
    RETURN QUERY
    SELECT
        'total_proposals'::TEXT,
        COUNT(*)::NUMERIC,
        'count'::TEXT,
        NOW()
    FROM proposals;

    RETURN QUERY
    SELECT
        'active_users_last_30_days'::TEXT,
        COUNT(DISTINCT user_id)::NUMERIC,
        'count'::TEXT,
        NOW()
    FROM activity_logs
    WHERE created_at > NOW() - INTERVAL '30 days';

    RETURN QUERY
    SELECT
        'proposals_created_today'::TEXT,
        COUNT(*)::NUMERIC,
        'count'::TEXT,
        NOW()
    FROM proposals
    WHERE created_at::DATE = CURRENT_DATE;

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintenance.collect_performance_metrics() IS 'Collect comprehensive performance metrics for monitoring';

-- ============================================================================
-- ALERTING SYSTEM
-- ============================================================================

-- Function to generate alerts based on health checks
CREATE OR REPLACE FUNCTION maintenance.generate_alerts()
RETURNS TABLE(
    alert_id UUID,
    alert_level TEXT,
    alert_title TEXT,
    alert_message TEXT,
    alert_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    alert_record RECORD;
BEGIN
    -- Generate alerts from health checks
    FOR alert_record IN
        SELECT * FROM maintenance.comprehensive_health_check()
        WHERE status IN ('warning', 'critical')
    LOOP
        RETURN QUERY
        SELECT
            uuid_generate_v4(),
            alert_record.severity,
            'Database Health Alert: ' || alert_record.check_name,
            alert_record.message,
            jsonb_build_object(
                'category', alert_record.check_category,
                'check_name', alert_record.check_name,
                'status', alert_record.status,
                'details', alert_record.details,
                'checked_at', alert_record.checked_at
            ),
            NOW();
    END LOOP;

    -- Generate alerts from business integrity checks
    FOR alert_record IN
        SELECT * FROM maintenance.business_integrity_check()
        WHERE status IN ('warning', 'critical') AND affected_records > 0
    LOOP
        RETURN QUERY
        SELECT
            uuid_generate_v4(),
            CASE alert_record.status WHEN 'critical' THEN 'critical' ELSE 'warning' END,
            'Data Integrity Alert: ' || alert_record.check_name,
            alert_record.message,
            jsonb_build_object(
                'check_name', alert_record.check_name,
                'affected_records', alert_record.affected_records,
                'details', alert_record.details
            ),
            NOW();
    END LOOP;

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintenance.generate_alerts() IS 'Generate alerts from health checks for external monitoring systems';

-- ============================================================================
-- DIAGNOSTIC QUERIES
-- ============================================================================

-- Function for emergency diagnostics
CREATE OR REPLACE FUNCTION maintenance.emergency_diagnostics()
RETURNS TEXT AS $$
DECLARE
    diagnostic_report TEXT := '';
    rec RECORD;
BEGIN
    diagnostic_report := 'EMERGENCY DIAGNOSTIC REPORT - ' || NOW() || E'\n';
    diagnostic_report := diagnostic_report || '================================================' || E'\n\n';

    -- Current activity
    diagnostic_report := diagnostic_report || 'CURRENT DATABASE ACTIVITY:' || E'\n';
    FOR rec IN
        SELECT
            pid,
            state,
            application_name,
            client_addr,
            query_start,
            LEFT(query, 100) as query_snippet
        FROM pg_stat_activity
        WHERE state != 'idle'
        ORDER BY query_start ASC
        LIMIT 10
    LOOP
        diagnostic_report := diagnostic_report || format(
            'PID: %s, State: %s, App: %s, Query: %s' || E'\n',
            rec.pid, rec.state, rec.application_name, rec.query_snippet
        );
    END LOOP;

    diagnostic_report := diagnostic_report || E'\n';

    -- Blocking locks
    diagnostic_report := diagnostic_report || 'BLOCKING LOCKS:' || E'\n';
    FOR rec IN
        SELECT
            blocking.pid as blocking_pid,
            blocked.pid as blocked_pid,
            blocked.relation::regclass as table_name
        FROM pg_locks blocking
        JOIN pg_locks blocked ON blocking.locktype = blocked.locktype
        WHERE NOT blocking.granted AND blocked.granted
        AND blocking.pid != blocked.pid
    LOOP
        diagnostic_report := diagnostic_report || format(
            'Blocking PID: %s, Blocked PID: %s, Table: %s' || E'\n',
            rec.blocking_pid, rec.blocked_pid, rec.table_name
        );
    END LOOP;

    diagnostic_report := diagnostic_report || E'\n';

    -- Resource usage
    diagnostic_report := diagnostic_report || 'RESOURCE USAGE:' || E'\n';
    SELECT INTO rec
        COUNT(*) as total_connections,
        COUNT(*) FILTER (WHERE state = 'active') as active_connections,
        pg_size_pretty(pg_database_size(current_database())) as db_size
    FROM pg_stat_activity;

    diagnostic_report := diagnostic_report || format(
        'Total Connections: %s, Active: %s, DB Size: %s' || E'\n',
        rec.total_connections, rec.active_connections, rec.db_size
    );

    diagnostic_report := diagnostic_report || E'\n';

    -- Recent errors from logs (if available)
    diagnostic_report := diagnostic_report || 'SYSTEM STATUS: Database responding to queries' || E'\n';

    -- Save diagnostic report
    INSERT INTO maintenance.health_checks (check_name, status, details)
    VALUES (
        'emergency_diagnostic',
        'info',
        jsonb_build_object('diagnostic_report', diagnostic_report)
    );

    RETURN diagnostic_report;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintenance.emergency_diagnostics() IS 'Generate emergency diagnostic report for troubleshooting';

-- ============================================================================
-- AUTOMATED HEALTH MONITORING
-- ============================================================================

-- Create table to store health check history
CREATE TABLE IF NOT EXISTS maintenance.health_check_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    overall_status TEXT NOT NULL CHECK (overall_status IN ('healthy', 'warning', 'critical')),
    total_checks INTEGER NOT NULL,
    warning_checks INTEGER DEFAULT 0,
    critical_checks INTEGER DEFAULT 0,
    check_details JSONB NOT NULL,
    performance_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient querying of health check history
CREATE INDEX IF NOT EXISTS idx_health_check_history_timestamp
    ON maintenance.health_check_history(check_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_health_check_history_status
    ON maintenance.health_check_history(overall_status, check_timestamp DESC);

-- Function to run and store comprehensive health check
CREATE OR REPLACE FUNCTION maintenance.run_health_monitoring()
RETURNS JSONB AS $$
DECLARE
    health_results RECORD;
    metrics_results RECORD;
    warning_count INTEGER := 0;
    critical_count INTEGER := 0;
    total_count INTEGER := 0;
    overall_status TEXT := 'healthy';
    check_details JSONB := '[]'::JSONB;
    performance_metrics JSONB := '[]'::JSONB;
    result_json JSONB;
BEGIN
    -- Collect health check results
    FOR health_results IN
        SELECT * FROM maintenance.comprehensive_health_check()
    LOOP
        total_count := total_count + 1;

        IF health_results.severity = 'warning' THEN
            warning_count := warning_count + 1;
        ELSIF health_results.severity = 'critical' THEN
            critical_count := critical_count + 1;
        END IF;

        check_details := check_details || jsonb_build_object(
            'category', health_results.check_category,
            'name', health_results.check_name,
            'status', health_results.status,
            'severity', health_results.severity,
            'message', health_results.message,
            'details', health_results.details
        );
    END LOOP;

    -- Collect performance metrics
    FOR metrics_results IN
        SELECT * FROM maintenance.collect_performance_metrics()
    LOOP
        performance_metrics := performance_metrics || jsonb_build_object(
            'metric', metrics_results.metric_name,
            'value', metrics_results.metric_value,
            'unit', metrics_results.metric_unit
        );
    END LOOP;

    -- Determine overall status
    IF critical_count > 0 THEN
        overall_status := 'critical';
    ELSIF warning_count > 0 THEN
        overall_status := 'warning';
    ELSE
        overall_status := 'healthy';
    END IF;

    -- Store results in history
    INSERT INTO maintenance.health_check_history (
        overall_status,
        total_checks,
        warning_checks,
        critical_checks,
        check_details,
        performance_metrics
    ) VALUES (
        overall_status,
        total_count,
        warning_count,
        critical_count,
        check_details,
        performance_metrics
    );

    -- Build result JSON
    result_json := jsonb_build_object(
        'timestamp', NOW(),
        'overall_status', overall_status,
        'summary', jsonb_build_object(
            'total_checks', total_count,
            'warning_checks', warning_count,
            'critical_checks', critical_count
        ),
        'health_checks', check_details,
        'performance_metrics', performance_metrics
    );

    RETURN result_json;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintenance.run_health_monitoring() IS 'Run comprehensive health monitoring and store results';

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant permissions for monitoring functions
GRANT EXECUTE ON FUNCTION maintenance.comprehensive_health_check() TO orcamentos_app, orcamentos_readonly;
GRANT EXECUTE ON FUNCTION maintenance.business_integrity_check() TO orcamentos_app, orcamentos_readonly;
GRANT EXECUTE ON FUNCTION maintenance.collect_performance_metrics() TO orcamentos_app, orcamentos_readonly;
GRANT EXECUTE ON FUNCTION maintenance.generate_alerts() TO orcamentos_app;
GRANT EXECUTE ON FUNCTION maintenance.emergency_diagnostics() TO orcamentos_app;
GRANT EXECUTE ON FUNCTION maintenance.run_health_monitoring() TO orcamentos_app;

-- Grant table permissions
GRANT SELECT ON maintenance.health_check_history TO orcamentos_app, orcamentos_readonly;
GRANT INSERT ON maintenance.health_check_history TO orcamentos_app;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA maintenance
    GRANT SELECT ON TABLES TO orcamentos_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA maintenance
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO orcamentos_app;

-- ============================================================================
-- DEMONSTRATION QUERIES
-- ============================================================================

-- Show how to use the monitoring functions
\echo 'Database Health Monitoring System Ready!'
\echo ''
\echo 'Available monitoring functions:'
\echo '1. maintenance.comprehensive_health_check() - Full system health check'
\echo '2. maintenance.business_integrity_check() - Business logic validation'
\echo '3. maintenance.collect_performance_metrics() - Performance metrics collection'
\echo '4. maintenance.generate_alerts() - Alert generation'
\echo '5. maintenance.emergency_diagnostics() - Emergency diagnostics'
\echo '6. maintenance.run_health_monitoring() - Complete monitoring with storage'
\echo ''
\echo 'Example usage:'
\echo 'SELECT * FROM maintenance.comprehensive_health_check();'
\echo 'SELECT * FROM maintenance.collect_performance_metrics();'