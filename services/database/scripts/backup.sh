#!/bin/bash
# OrçamentosOnline - Database Backup Script
# CASSANDRA Agent - Database Engineering
# Version: 1.0
# Date: September 25, 2025

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../" && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/services/database/backups"

# Database configuration
DB_CONTAINER="orcamentos-postgres"
DB_NAME="${POSTGRES_DB:-orcamentos}"
DB_USER="${POSTGRES_USER:-orcamentos_user}"

# Backup configuration
BACKUP_PREFIX="orcamentos_backup"
RETENTION_DAYS=30
COMPRESS_BACKUPS=true
ENCRYPT_BACKUPS=false  # Set to true for production

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

usage() {
    cat << EOF
Database Backup Script for OrçamentosOnline

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -h, --help          Show this help message
    -f, --full          Create full database backup (default)
    -s, --schema        Create schema-only backup
    -d, --data          Create data-only backup
    -t, --tables        Backup specific tables (comma-separated)
    -c, --compress      Compress backup file (default: true)
    -e, --encrypt       Encrypt backup file (requires GPG setup)
    -r, --retention     Retention period in days (default: 30)
    -o, --output        Custom output directory
    --cleanup           Only run cleanup of old backups
    --verify            Verify existing backups
    --restore FILE      Restore from backup file

EXAMPLES:
    $0                              # Full backup with compression
    $0 --schema                     # Schema-only backup
    $0 --tables "users,proposals"   # Backup specific tables
    $0 --cleanup                    # Clean old backups
    $0 --restore backup_file.sql    # Restore from backup

ENVIRONMENT VARIABLES:
    POSTGRES_DB         Database name (default: orcamentos)
    POSTGRES_USER       Database user (default: orcamentos_user)
    BACKUP_ENCRYPTION_KEY   GPG key ID for encryption
EOF
}

check_dependencies() {
    local deps=("docker" "docker-compose")
    local missing=()

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done

    if [ ${#missing[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing[*]}"
    fi
}

check_docker_container() {
    if ! docker ps --format "table {{.Names}}" | grep -q "^${DB_CONTAINER}$"; then
        error "Database container '${DB_CONTAINER}' is not running"
    fi
}

# ============================================================================
# BACKUP FUNCTIONS
# ============================================================================

create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    if [ ! -w "$BACKUP_DIR" ]; then
        error "Backup directory '$BACKUP_DIR' is not writable"
    fi
}

generate_backup_filename() {
    local type="$1"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    echo "${BACKUP_PREFIX}_${type}_${timestamp}.sql"
}

create_full_backup() {
    local filename="$1"
    local filepath="${BACKUP_DIR}/${filename}"

    log "Creating full database backup: $filename"

    docker exec "$DB_CONTAINER" pg_dump \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --clean \
        --create \
        --if-exists \
        --format=plain \
        --encoding=UTF8 \
        --no-password \
        > "$filepath" 2>/dev/null

    if [ $? -eq 0 ]; then
        success "Full backup completed: $(du -h "$filepath" | cut -f1)"
    else
        error "Full backup failed"
    fi
}

create_schema_backup() {
    local filename="$1"
    local filepath="${BACKUP_DIR}/${filename}"

    log "Creating schema-only backup: $filename"

    docker exec "$DB_CONTAINER" pg_dump \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --clean \
        --create \
        --if-exists \
        --schema-only \
        --format=plain \
        --encoding=UTF8 \
        --no-password \
        > "$filepath" 2>/dev/null

    if [ $? -eq 0 ]; then
        success "Schema backup completed: $(du -h "$filepath" | cut -f1)"
    else
        error "Schema backup failed"
    fi
}

create_data_backup() {
    local filename="$1"
    local filepath="${BACKUP_DIR}/${filename}"

    log "Creating data-only backup: $filename"

    docker exec "$DB_CONTAINER" pg_dump \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --data-only \
        --format=plain \
        --encoding=UTF8 \
        --no-password \
        > "$filepath" 2>/dev/null

    if [ $? -eq 0 ]; then
        success "Data backup completed: $(du -h "$filepath" | cut -f1)"
    else
        error "Data backup failed"
    fi
}

create_table_backup() {
    local tables="$1"
    local filename="$2"
    local filepath="${BACKUP_DIR}/${filename}"

    log "Creating backup of tables: $tables"

    IFS=',' read -ra TABLE_ARRAY <<< "$tables"
    local table_args=()
    for table in "${TABLE_ARRAY[@]}"; do
        table_args+=(--table="$table")
    done

    docker exec "$DB_CONTAINER" pg_dump \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --format=plain \
        --encoding=UTF8 \
        --no-password \
        "${table_args[@]}" \
        > "$filepath" 2>/dev/null

    if [ $? -eq 0 ]; then
        success "Table backup completed: $(du -h "$filepath" | cut -f1)"
    else
        error "Table backup failed"
    fi
}

compress_backup() {
    local filepath="$1"

    if [ "$COMPRESS_BACKUPS" = true ]; then
        log "Compressing backup file..."
        gzip "$filepath"
        if [ $? -eq 0 ]; then
            success "Backup compressed: ${filepath}.gz"
            echo "${filepath}.gz"
        else
            warning "Compression failed, keeping uncompressed file"
            echo "$filepath"
        fi
    else
        echo "$filepath"
    fi
}

encrypt_backup() {
    local filepath="$1"

    if [ "$ENCRYPT_BACKUPS" = true ] && [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
        log "Encrypting backup file..."
        gpg --trust-model always --encrypt \
            --recipient "$BACKUP_ENCRYPTION_KEY" \
            --output "${filepath}.gpg" \
            "$filepath"

        if [ $? -eq 0 ]; then
            rm "$filepath"
            success "Backup encrypted: ${filepath}.gpg"
            echo "${filepath}.gpg"
        else
            warning "Encryption failed, keeping unencrypted file"
            echo "$filepath"
        fi
    else
        echo "$filepath"
    fi
}

# ============================================================================
# MAINTENANCE FUNCTIONS
# ============================================================================

cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."

    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "${BACKUP_PREFIX}_*.sql*" -type f -mtime +$RETENTION_DAYS -print0)

    if [ $deleted_count -eq 0 ]; then
        log "No old backups to clean up"
    else
        success "Cleaned up $deleted_count old backup files"
    fi
}

verify_backups() {
    log "Verifying existing backup files..."

    local backup_count=0
    local valid_count=0
    local invalid_count=0

    for file in "$BACKUP_DIR"/${BACKUP_PREFIX}_*.sql*; do
        if [ -f "$file" ]; then
            ((backup_count++))

            # Basic file integrity check
            if [ "${file##*.}" = "gz" ]; then
                if gzip -t "$file" 2>/dev/null; then
                    ((valid_count++))
                    log "✓ Valid compressed backup: $(basename "$file")"
                else
                    ((invalid_count++))
                    warning "✗ Corrupted backup: $(basename "$file")"
                fi
            elif [ "${file##*.}" = "sql" ]; then
                if head -1 "$file" | grep -q "PostgreSQL database dump"; then
                    ((valid_count++))
                    log "✓ Valid SQL backup: $(basename "$file")"
                else
                    ((invalid_count++))
                    warning "✗ Invalid SQL backup: $(basename "$file")"
                fi
            fi
        fi
    done

    if [ $backup_count -eq 0 ]; then
        warning "No backup files found in $BACKUP_DIR"
    else
        success "Backup verification complete: $valid_count valid, $invalid_count invalid out of $backup_count total"
    fi
}

# ============================================================================
# RESTORE FUNCTION
# ============================================================================

restore_backup() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi

    log "WARNING: This will replace the current database!"
    read -p "Are you sure you want to restore from '$backup_file'? (yes/no): " -r

    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        log "Restore cancelled"
        return 0
    fi

    log "Restoring database from: $(basename "$backup_file")"

    # Handle compressed files
    if [ "${backup_file##*.}" = "gz" ]; then
        zcat "$backup_file" | docker exec -i "$DB_CONTAINER" psql \
            --username="$DB_USER" \
            --dbname="postgres" \
            --quiet
    else
        cat "$backup_file" | docker exec -i "$DB_CONTAINER" psql \
            --username="$DB_USER" \
            --dbname="postgres" \
            --quiet
    fi

    if [ $? -eq 0 ]; then
        success "Database restored successfully from $(basename "$backup_file")"
    else
        error "Database restore failed"
    fi
}

# ============================================================================
# MAIN FUNCTION
# ============================================================================

main() {
    local backup_type="full"
    local tables=""
    local custom_output=""
    local cleanup_only=false
    local verify_only=false
    local restore_file=""

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -f|--full)
                backup_type="full"
                shift
                ;;
            -s|--schema)
                backup_type="schema"
                shift
                ;;
            -d|--data)
                backup_type="data"
                shift
                ;;
            -t|--tables)
                backup_type="tables"
                tables="$2"
                shift 2
                ;;
            -c|--compress)
                COMPRESS_BACKUPS=true
                shift
                ;;
            -e|--encrypt)
                ENCRYPT_BACKUPS=true
                shift
                ;;
            -r|--retention)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            -o|--output)
                custom_output="$2"
                shift 2
                ;;
            --cleanup)
                cleanup_only=true
                shift
                ;;
            --verify)
                verify_only=true
                shift
                ;;
            --restore)
                restore_file="$2"
                shift 2
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done

    # Override backup directory if custom output specified
    if [ -n "$custom_output" ]; then
        BACKUP_DIR="$custom_output"
    fi

    # Check dependencies
    check_dependencies
    create_backup_dir

    # Handle special operations
    if [ "$cleanup_only" = true ]; then
        cleanup_old_backups
        exit 0
    fi

    if [ "$verify_only" = true ]; then
        verify_backups
        exit 0
    fi

    if [ -n "$restore_file" ]; then
        check_docker_container
        restore_backup "$restore_file"
        exit 0
    fi

    # Regular backup operations
    check_docker_container

    log "Starting OrçamentosOnline database backup"
    log "Backup type: $backup_type"
    log "Database: $DB_NAME"
    log "Container: $DB_CONTAINER"
    log "Output directory: $BACKUP_DIR"

    # Generate filename and create backup
    local filename
    case $backup_type in
        full)
            filename=$(generate_backup_filename "full")
            create_full_backup "$filename"
            ;;
        schema)
            filename=$(generate_backup_filename "schema")
            create_schema_backup "$filename"
            ;;
        data)
            filename=$(generate_backup_filename "data")
            create_data_backup "$filename"
            ;;
        tables)
            if [ -z "$tables" ]; then
                error "Table names must be specified with --tables option"
            fi
            filename=$(generate_backup_filename "tables")
            create_table_backup "$tables" "$filename"
            ;;
        *)
            error "Invalid backup type: $backup_type"
            ;;
    esac

    # Post-process backup file
    local final_file="${BACKUP_DIR}/${filename}"
    final_file=$(compress_backup "$final_file")
    final_file=$(encrypt_backup "$final_file")

    # Cleanup old backups
    cleanup_old_backups

    success "Backup process completed: $(basename "$final_file")"
    log "Backup location: $final_file"
}

# Run main function if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi