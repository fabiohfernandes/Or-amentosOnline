#!/bin/bash

# Database Backup and Recovery System
# OrçamentosOnline - Comprehensive Database Backup & Recovery
# CASSANDRA Agent - Database Engineering
# Version: 1.0
# Date: September 25, 2025

# This script provides comprehensive database backup, recovery, and maintenance
# procedures for production environments with Brazilian compliance considerations

set -euo pipefail  # Exit on error, undefined variables, pipe failures

# ============================================================================
# CONFIGURATION
# ============================================================================

# Default configuration - can be overridden by environment variables or config file
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-orcamentos}"
DB_USER="${DB_USER:-orcamentos_user}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
LOG_DIR="${LOG_DIR:-/var/log/database}"
LOG_FILE="${LOG_DIR}/backup-$(date +%Y%m%d).log"

# Backup types
FULL_BACKUP_SCHEDULE="${FULL_BACKUP_SCHEDULE:-daily}"  # daily, weekly
INCREMENTAL_BACKUP="${INCREMENTAL_BACKUP:-enabled}"
COMPRESS_BACKUPS="${COMPRESS_BACKUPS:-true}"

# LGPD compliance settings
GDPR_RETENTION_YEARS="${GDPR_RETENTION_YEARS:-7}"  # Brazilian business records retention
AUDIT_LOG_RETENTION_MONTHS="${AUDIT_LOG_RETENTION_MONTHS:-24}"

# Notification settings
ALERT_EMAIL="${ALERT_EMAIL:-}"
WEBHOOK_URL="${WEBHOOK_URL:-}"

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_success() { log "SUCCESS" "$@"; }

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

ensure_directories() {
    mkdir -p "$BACKUP_DIR"/{full,incremental,schemas,exports,archive}
    mkdir -p "$LOG_DIR"
    chmod 700 "$BACKUP_DIR"
    chmod 755 "$LOG_DIR"
}

check_dependencies() {
    local missing_deps=()

    for cmd in pg_dump pg_restore psql pg_isready gzip; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi
}

check_database_connection() {
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" &>/dev/null; then
        log_error "Cannot connect to database $DB_HOST:$DB_PORT/$DB_NAME"
        return 1
    fi
    log_info "Database connection verified"
}

send_notification() {
    local subject="$1"
    local message="$2"
    local status="${3:-info}"

    # Email notification
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || true
    fi

    # Webhook notification
    if [ -n "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"subject\":\"$subject\",\"message\":\"$message\",\"status\":\"$status\"}" \
            2>/dev/null || true
    fi
}

# ============================================================================
# BACKUP FUNCTIONS
# ============================================================================

create_full_backup() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/full/orcamentos_full_$backup_date.sql"
    local compressed_file="$backup_file.gz"

    log_info "Starting full database backup: $backup_file"

    # Create backup with Brazilian collation support
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --format=custom \
        --no-password \
        --encoding=UTF8 \
        --create \
        --clean \
        --if-exists \
        --file="$backup_file" \
        2>>"$LOG_FILE"

    if [ $? -eq 0 ]; then
        # Compress backup if enabled
        if [ "$COMPRESS_BACKUPS" = "true" ]; then
            gzip "$backup_file"
            backup_file="$compressed_file"
            log_info "Backup compressed: $backup_file"
        fi

        # Verify backup integrity
        if verify_backup "$backup_file"; then
            log_success "Full backup completed successfully: $backup_file"

            # Record backup metadata
            record_backup_metadata "full" "$backup_file" "$backup_date"

            # Send success notification
            send_notification "Database Backup Success" \
                "Full backup completed successfully: $(basename "$backup_file")" \
                "success"
        else
            log_error "Backup verification failed: $backup_file"
            return 1
        fi
    else
        log_error "Full backup failed"
        send_notification "Database Backup Failed" \
            "Full backup failed at $(date). Check logs for details." \
            "error"
        return 1
    fi
}

create_schema_backup() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/schemas/orcamentos_schema_$backup_date.sql"

    log_info "Creating schema-only backup: $backup_file"

    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --schema-only \
        --verbose \
        --no-password \
        --encoding=UTF8 \
        --create \
        --clean \
        --if-exists \
        --file="$backup_file" \
        2>>"$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_success "Schema backup completed: $backup_file"
    else
        log_error "Schema backup failed"
        return 1
    fi
}

create_data_export() {
    local export_date=$(date +%Y%m%d_%H%M%S)
    local export_dir="$BACKUP_DIR/exports/export_$export_date"

    mkdir -p "$export_dir"
    log_info "Creating data export: $export_dir"

    # Export critical tables with LGPD compliance
    local tables=(
        "organizations"
        "users"
        "clients"
        "proposals"
        "proposal_sections"
        "proposal_items"
        "files"
        "data_classification"
        "data_subject_requests"
    )

    for table in "${tables[@]}"; do
        local export_file="$export_dir/${table}.csv"
        log_info "Exporting table: $table"

        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            -c "\COPY $table TO '$export_file' WITH (FORMAT CSV, HEADER true, ENCODING 'UTF8')" \
            2>>"$LOG_FILE"

        if [ $? -eq 0 ]; then
            log_info "Table $table exported successfully"
        else
            log_warn "Failed to export table: $table"
        fi
    done

    # Create export manifest
    cat > "$export_dir/manifest.json" <<EOF
{
    "export_date": "$export_date",
    "database": "$DB_NAME",
    "export_type": "csv_data_export",
    "tables": [$(printf '"%s",' "${tables[@]}" | sed 's/,$//')]
    "compliance": {
        "gdpr_retention_years": $GDPR_RETENTION_YEARS,
        "audit_retention_months": $AUDIT_LOG_RETENTION_MONTHS
    },
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    # Compress export directory
    if [ "$COMPRESS_BACKUPS" = "true" ]; then
        tar -czf "$export_dir.tar.gz" -C "$(dirname "$export_dir")" "$(basename "$export_dir")"
        rm -rf "$export_dir"
        log_info "Export compressed: $export_dir.tar.gz"
    fi

    log_success "Data export completed: $export_dir"
}

verify_backup() {
    local backup_file="$1"

    log_info "Verifying backup integrity: $backup_file"

    if [[ "$backup_file" == *.gz ]]; then
        # Verify compressed file integrity
        if ! gzip -t "$backup_file"; then
            log_error "Compressed backup file is corrupted: $backup_file"
            return 1
        fi

        # Test backup content by attempting a dry-run restore to temp database
        local temp_db="temp_verify_$(date +%s)"

        # Create temporary database
        createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$temp_db" 2>/dev/null || true

        # Attempt restore (dry-run)
        if pg_restore \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$temp_db" \
            --verbose \
            --no-password \
            --single-transaction \
            "$backup_file" &>>"$LOG_FILE"; then

            # Cleanup temporary database
            dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$temp_db" 2>/dev/null || true
            log_info "Backup verification successful: $backup_file"
            return 0
        else
            # Cleanup temporary database
            dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$temp_db" 2>/dev/null || true
            log_error "Backup verification failed: $backup_file"
            return 1
        fi
    else
        # For uncompressed files, just check if pg_restore can read the header
        if pg_restore --list "$backup_file" &>/dev/null; then
            log_info "Backup file structure is valid: $backup_file"
            return 0
        else
            log_error "Backup file is corrupted or invalid: $backup_file"
            return 1
        fi
    fi
}

record_backup_metadata() {
    local backup_type="$1"
    local backup_file="$2"
    local backup_date="$3"
    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "unknown")

    # Create backup metadata record
    local metadata_file="$BACKUP_DIR/backup_metadata.jsonl"

    cat >> "$metadata_file" <<EOF
{"timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","backup_type":"$backup_type","backup_file":"$backup_file","backup_date":"$backup_date","file_size_bytes":$file_size,"database":"$DB_NAME","host":"$DB_HOST","status":"completed"}
EOF

    # Also record in database if possible
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "INSERT INTO maintenance.health_checks (check_name, status, details) VALUES ('backup_completed', 'healthy', '{\"backup_type\":\"$backup_type\",\"backup_file\":\"$(basename "$backup_file")\",\"file_size\":$file_size}');" \
        2>/dev/null || log_warn "Could not record backup in database health checks"
}

# ============================================================================
# RECOVERY FUNCTIONS
# ============================================================================

list_available_backups() {
    log_info "Available backups:"
    echo

    echo "FULL BACKUPS:"
    if ls "$BACKUP_DIR"/full/*.{sql,sql.gz} &>/dev/null; then
        ls -lah "$BACKUP_DIR"/full/*.{sql,sql.gz} 2>/dev/null | awk '{print $9, $5, $6, $7, $8}'
    else
        echo "  No full backups found"
    fi

    echo
    echo "SCHEMA BACKUPS:"
    if ls "$BACKUP_DIR"/schemas/*.sql &>/dev/null; then
        ls -lah "$BACKUP_DIR"/schemas/*.sql | awk '{print $9, $5, $6, $7, $8}'
    else
        echo "  No schema backups found"
    fi

    echo
    echo "DATA EXPORTS:"
    if ls "$BACKUP_DIR"/exports/* &>/dev/null; then
        ls -lah "$BACKUP_DIR"/exports/ | grep -E "\.(tar\.gz|csv)$" | awk '{print $9, $5, $6, $7, $8}'
    else
        echo "  No data exports found"
    fi
}

restore_from_backup() {
    local backup_file="$1"
    local target_db="${2:-$DB_NAME}"
    local restore_options="${3:-}"

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    log_warn "Starting database restore from: $backup_file to database: $target_db"
    log_warn "This will OVERWRITE the target database. Continue? (Press Enter to continue, Ctrl+C to abort)"
    read -r

    # Create target database if it doesn't exist
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$target_db" 2>/dev/null || true

    # Perform restore
    log_info "Restoring database from backup..."

    if pg_restore \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$target_db" \
        --verbose \
        --no-password \
        --clean \
        --if-exists \
        --single-transaction \
        $restore_options \
        "$backup_file" 2>>"$LOG_FILE"; then

        log_success "Database restore completed successfully"

        # Verify restored database
        if verify_restored_database "$target_db"; then
            log_success "Restored database verification passed"

            # Record restore in health checks
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" \
                -c "INSERT INTO maintenance.health_checks (check_name, status, details) VALUES ('database_restored', 'healthy', '{\"restored_from\":\"$(basename "$backup_file")\",\"restored_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}');" \
                2>/dev/null || true

            send_notification "Database Restore Success" \
                "Database $target_db restored successfully from $(basename "$backup_file")" \
                "success"
        else
            log_error "Restored database verification failed"
            return 1
        fi
    else
        log_error "Database restore failed"
        send_notification "Database Restore Failed" \
            "Database restore failed. Check logs for details." \
            "error"
        return 1
    fi
}

verify_restored_database() {
    local database="$1"

    log_info "Verifying restored database: $database"

    # Check if database exists and is accessible
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$database" -c "SELECT 1;" &>/dev/null; then
        log_error "Cannot connect to restored database: $database"
        return 1
    fi

    # Check critical tables exist
    local critical_tables=(
        "organizations"
        "users"
        "clients"
        "proposals"
        "maintenance.migration_history"
    )

    for table in "${critical_tables[@]}"; do
        if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$database" \
            -c "SELECT 1 FROM $table LIMIT 1;" &>/dev/null; then
            log_error "Critical table missing or inaccessible: $table"
            return 1
        fi
    done

    # Run basic integrity checks
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$database" \
        -c "SELECT maintenance.business_integrity_check();" &>/dev/null; then
        log_info "Database integrity checks passed"
    else
        log_warn "Database integrity checks failed or function not available"
    fi

    log_info "Database verification completed successfully"
    return 0
}

# ============================================================================
# MAINTENANCE FUNCTIONS
# ============================================================================

cleanup_old_backups() {
    log_info "Cleaning up backups older than $BACKUP_RETENTION_DAYS days"

    # Find and remove old backup files
    find "$BACKUP_DIR" -type f -name "*.sql*" -mtime +$BACKUP_RETENTION_DAYS -print0 | while IFS= read -r -d '' file; do
        log_info "Removing old backup: $file"
        rm -f "$file"
    done

    # Find and remove old export directories/files
    find "$BACKUP_DIR/exports" -type f -name "*.tar.gz" -mtime +$BACKUP_RETENTION_DAYS -print0 | while IFS= read -r -d '' file; do
        log_info "Removing old export: $file"
        rm -f "$file"
    done

    # Archive very old backups instead of deleting (for compliance)
    local archive_days=$((BACKUP_RETENTION_DAYS + 30))
    find "$BACKUP_DIR" -type f -name "*.sql*" -mtime +$archive_days -print0 | while IFS= read -r -d '' file; do
        local archive_file="$BACKUP_DIR/archive/$(basename "$file")"
        log_info "Archiving very old backup: $file -> $archive_file"
        mv "$file" "$archive_file" 2>/dev/null || rm -f "$file"
    done
}

vacuum_and_analyze() {
    log_info "Running VACUUM ANALYZE on database"

    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "VACUUM (VERBOSE, ANALYZE);" \
        2>>"$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_success "VACUUM ANALYZE completed successfully"
    else
        log_error "VACUUM ANALYZE failed"
        return 1
    fi
}

reindex_database() {
    log_info "Reindexing database for optimal performance"

    # Reindex system tables
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "REINDEX DATABASE $DB_NAME;" \
        2>>"$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_success "Database reindex completed successfully"
    else
        log_error "Database reindex failed"
        return 1
    fi
}

# ============================================================================
# LGPD COMPLIANCE FUNCTIONS
# ============================================================================

export_user_data_lgpd() {
    local user_email="$1"
    local export_date=$(date +%Y%m%d_%H%M%S)
    local export_dir="$BACKUP_DIR/exports/lgpd_user_data_$export_date"

    if [ -z "$user_email" ]; then
        log_error "User email required for LGPD data export"
        return 1
    fi

    mkdir -p "$export_dir"
    log_info "Creating LGPD user data export for: $user_email"

    # Export user's personal data
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
\o '$export_dir/user_data.json'
SELECT row_to_json(u.*) FROM users u WHERE email = '$user_email';

\o '$export_dir/user_proposals.json'
SELECT json_agg(row_to_json(p.*)) FROM proposals p
JOIN users u ON u.id = p.created_by
WHERE u.email = '$user_email';

\o '$export_dir/user_clients.json'
SELECT json_agg(row_to_json(c.*)) FROM clients c
JOIN users u ON u.id = c.created_by
WHERE u.email = '$user_email';

\o '$export_dir/user_activity.json'
SELECT json_agg(row_to_json(a.*)) FROM activity_logs a
JOIN users u ON u.id = a.user_id
WHERE u.email = '$user_email';
EOF

    # Create LGPD export manifest
    cat > "$export_dir/lgpd_manifest.json" <<EOF
{
    "export_type": "lgpd_user_data_export",
    "data_subject_email": "$user_email",
    "export_date": "$export_date",
    "legal_basis": "Art. 15 LGPD - Direito de acesso do titular",
    "retention_policy": "Data exported under LGPD Article 15 - Right of access",
    "files": [
        "user_data.json",
        "user_proposals.json",
        "user_clients.json",
        "user_activity.json"
    ],
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    # Compress export
    tar -czf "$export_dir.tar.gz" -C "$(dirname "$export_dir")" "$(basename "$export_dir")"
    rm -rf "$export_dir"

    log_success "LGPD user data export completed: $export_dir.tar.gz"

    # Record the export in the database
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "INSERT INTO data_subject_requests (request_type, data_subject_email, request_details, status, completed_date, response_details) VALUES ('access', '$user_email', 'Automated LGPD data export', 'completed', NOW(), 'Data exported to file: $(basename "$export_dir.tar.gz")');" \
        2>/dev/null || log_warn "Could not record LGPD export in database"
}

# ============================================================================
# MAIN FUNCTIONS
# ============================================================================

show_usage() {
    cat << EOF
Database Backup and Recovery System
OrçamentosOnline - CASSANDRA Agent

USAGE:
    $0 [COMMAND] [OPTIONS]

COMMANDS:
    backup-full                     Create full database backup
    backup-schema                   Create schema-only backup
    backup-data                     Create data export (CSV format)
    list-backups                    List available backups
    restore <backup_file> [db_name] Restore from backup file
    cleanup                         Remove old backups based on retention policy
    maintenance                     Run database maintenance (VACUUM, ANALYZE, REINDEX)
    health-check                    Run comprehensive database health check
    lgpd-export <email>             Export user data for LGPD compliance

ENVIRONMENT VARIABLES:
    DB_HOST                         Database host (default: postgres)
    DB_PORT                         Database port (default: 5432)
    DB_NAME                         Database name (default: orcamentos)
    DB_USER                         Database user (default: orcamentos_user)
    BACKUP_DIR                      Backup directory (default: /backups)
    BACKUP_RETENTION_DAYS           Backup retention in days (default: 30)
    COMPRESS_BACKUPS                Enable backup compression (default: true)
    ALERT_EMAIL                     Email for notifications
    WEBHOOK_URL                     Webhook URL for notifications

EXAMPLES:
    # Create full backup
    $0 backup-full

    # Restore from backup
    $0 restore /backups/full/orcamentos_full_20250925_120000.sql.gz

    # Export user data for LGPD compliance
    $0 lgpd-export user@example.com

    # Run maintenance
    $0 maintenance

    # Clean up old backups
    $0 cleanup

EOF
}

main() {
    local command="${1:-help}"

    # Initialize
    ensure_directories
    check_dependencies

    case "$command" in
        "backup-full")
            check_database_connection
            create_full_backup
            ;;
        "backup-schema")
            check_database_connection
            create_schema_backup
            ;;
        "backup-data")
            check_database_connection
            create_data_export
            ;;
        "list-backups"|"list")
            list_available_backups
            ;;
        "restore")
            local backup_file="${2:-}"
            local target_db="${3:-$DB_NAME}"
            if [ -z "$backup_file" ]; then
                log_error "Backup file required for restore"
                show_usage
                exit 1
            fi
            check_database_connection
            restore_from_backup "$backup_file" "$target_db"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "maintenance")
            check_database_connection
            vacuum_and_analyze
            reindex_database
            ;;
        "health-check"|"health")
            check_database_connection
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                -c "SELECT * FROM maintenance.run_health_monitoring();" \
                2>>"$LOG_FILE"
            ;;
        "lgpd-export")
            local user_email="${2:-}"
            if [ -z "$user_email" ]; then
                log_error "User email required for LGPD export"
                show_usage
                exit 1
            fi
            check_database_connection
            export_user_data_lgpd "$user_email"
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"