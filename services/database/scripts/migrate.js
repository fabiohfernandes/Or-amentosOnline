#!/usr/bin/env node

/**
 * OrçamentosOnline - Database Migration Script
 * CASSANDRA Agent - Database Engineering
 * Version: 1.0
 * Date: September 25, 2025
 *
 * Node.js-based migration runner for PostgreSQL database
 * Handles migration execution, rollbacks, and status tracking
 */

const fs = require('fs').promises;
const path = require('path');
const { Client } = require('pg');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = {
    database: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        database: process.env.POSTGRES_DB || 'orcamentos',
        user: process.env.POSTGRES_USER || 'orcamentos_user',
        password: process.env.POSTGRES_PASSWORD || '',
    },
    migrationsPath: path.join(__dirname, '../migrations'),
    seedsPath: path.join(__dirname, '../seeds'),
    migrationTableName: 'maintenance.migration_history',
    backupBeforeRollback: true,
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message, color = 'reset') {
    const timestamp = new Date().toISOString();
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

function warning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
    log(`ℹ️  ${message}`, 'cyan');
}

function generateChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

async function readFile(filePath) {
    try {
        return await fs.readFile(filePath, 'utf8');
    } catch (err) {
        throw new Error(`Failed to read file ${filePath}: ${err.message}`);
    }
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

class Database {
    constructor(config) {
        this.config = config;
        this.client = null;
    }

    async connect() {
        this.client = new Client(this.config);

        try {
            await this.client.connect();
            info('Connected to PostgreSQL database');
        } catch (err) {
            error(`Failed to connect to database: ${err.message}`);
            throw err;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.end();
            info('Disconnected from database');
        }
    }

    async query(sql, params = []) {
        try {
            const result = await this.client.query(sql, params);
            return result;
        } catch (err) {
            error(`Query failed: ${err.message}`);
            throw err;
        }
    }

    async transaction(callback) {
        try {
            await this.query('BEGIN');
            const result = await callback(this);
            await this.query('COMMIT');
            return result;
        } catch (err) {
            await this.query('ROLLBACK');
            throw err;
        }
    }
}

// ============================================================================
// MIGRATION MANAGER
// ============================================================================

class MigrationManager {
    constructor(database, config) {
        this.db = database;
        this.config = config;
    }

    async ensureMigrationTable() {
        const tableExists = await this.db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'maintenance'
                AND table_name = 'migration_history'
            );
        `);

        if (!tableExists.rows[0].exists) {
            warning('Migration table does not exist, creating it...');
            await this.db.query(`
                CREATE SCHEMA IF NOT EXISTS maintenance;

                CREATE TABLE maintenance.migration_history (
                    id SERIAL PRIMARY KEY,
                    version VARCHAR(50) NOT NULL UNIQUE,
                    description TEXT NOT NULL,
                    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    applied_by TEXT DEFAULT current_user,
                    execution_time_ms INTEGER,
                    checksum TEXT,
                    rollback_sql TEXT
                );

                CREATE INDEX idx_migration_history_version ON maintenance.migration_history(version);
                CREATE INDEX idx_migration_history_applied_at ON maintenance.migration_history(applied_at);
            `);
            success('Migration table created');
        }
    }

    async getAppliedMigrations() {
        const result = await this.db.query(`
            SELECT version, description, applied_at, checksum
            FROM ${this.config.migrationTableName}
            ORDER BY applied_at ASC
        `);
        return result.rows;
    }

    async getMigrationFiles() {
        try {
            const files = await fs.readdir(this.config.migrationsPath);
            return files
                .filter(file => file.endsWith('.sql'))
                .sort()
                .map(file => ({
                    filename: file,
                    version: this.extractVersionFromFilename(file),
                    path: path.join(this.config.migrationsPath, file)
                }));
        } catch (err) {
            error(`Failed to read migrations directory: ${err.message}`);
            return [];
        }
    }

    extractVersionFromFilename(filename) {
        const match = filename.match(/^(\d{3})/);
        return match ? match[1] : filename.replace('.sql', '');
    }

    async getPendingMigrations() {
        const migrationFiles = await this.getMigrationFiles();
        const appliedMigrations = await this.getAppliedMigrations();
        const appliedVersions = new Set(appliedMigrations.map(m => m.version));

        return migrationFiles.filter(file => !appliedVersions.has(file.version));
    }

    async validateMigration(migration) {
        const content = await readFile(migration.path);
        const checksum = generateChecksum(content);

        // Check if this migration was already applied with different content
        const existing = await this.db.query(`
            SELECT checksum FROM ${this.config.migrationTableName}
            WHERE version = $1
        `, [migration.version]);

        if (existing.rows.length > 0 && existing.rows[0].checksum !== checksum) {
            throw new Error(
                `Migration ${migration.version} has been modified since it was applied. ` +
                `Expected checksum: ${existing.rows[0].checksum}, got: ${checksum}`
            );
        }

        return { content, checksum };
    }

    async runMigration(migration) {
        info(`Running migration: ${migration.filename}`);

        const { content, checksum } = await this.validateMigration(migration);
        const startTime = Date.now();

        try {
            await this.db.transaction(async (db) => {
                // Execute migration content
                await db.query(content);

                // Record migration in history
                const executionTime = Date.now() - startTime;
                await db.query(`
                    INSERT INTO ${this.config.migrationTableName}
                    (version, description, execution_time_ms, checksum)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (version) DO UPDATE SET
                        execution_time_ms = $3,
                        checksum = $4,
                        applied_at = NOW()
                `, [
                    migration.version,
                    `Migration ${migration.version}`,
                    executionTime,
                    checksum
                ]);

                success(`Migration ${migration.version} completed in ${executionTime}ms`);
            });
        } catch (err) {
            error(`Migration ${migration.version} failed: ${err.message}`);
            throw err;
        }
    }

    async runAllPendingMigrations() {
        const pendingMigrations = await this.getPendingMigrations();

        if (pendingMigrations.length === 0) {
            info('No pending migrations to run');
            return;
        }

        info(`Found ${pendingMigrations.length} pending migrations`);

        for (const migration of pendingMigrations) {
            await this.runMigration(migration);
        }

        success(`All ${pendingMigrations.length} migrations completed successfully`);
    }

    async rollbackMigration(version) {
        warning(`Rolling back migration: ${version}`);

        const migration = await this.db.query(`
            SELECT * FROM ${this.config.migrationTableName}
            WHERE version = $1
        `, [version]);

        if (migration.rows.length === 0) {
            throw new Error(`Migration ${version} not found in database`);
        }

        // For now, rollback is not implemented as it requires careful planning
        // In production, rollbacks should be handled with specific rollback scripts
        throw new Error('Rollback functionality not implemented. Create a new migration to undo changes.');
    }

    async showStatus() {
        console.log('\n' + colors.bright + 'Migration Status' + colors.reset);
        console.log('================');

        const appliedMigrations = await this.getAppliedMigrations();
        const pendingMigrations = await this.getPendingMigrations();

        console.log(`\n${colors.green}Applied Migrations (${appliedMigrations.length}):${colors.reset}`);
        if (appliedMigrations.length === 0) {
            console.log('  None');
        } else {
            appliedMigrations.forEach(migration => {
                console.log(`  ✅ ${migration.version} - ${migration.description} (${migration.applied_at})`);
            });
        }

        console.log(`\n${colors.yellow}Pending Migrations (${pendingMigrations.length}):${colors.reset}`);
        if (pendingMigrations.length === 0) {
            console.log('  None');
        } else {
            pendingMigrations.forEach(migration => {
                console.log(`  ⏳ ${migration.version} - ${migration.filename}`);
            });
        }

        console.log('');
    }
}

// ============================================================================
// SEED MANAGER
// ============================================================================

class SeedManager {
    constructor(database, config) {
        this.db = database;
        this.config = config;
    }

    async getSeedFiles() {
        try {
            const files = await fs.readdir(this.config.seedsPath);
            return files
                .filter(file => file.endsWith('.sql'))
                .sort()
                .map(file => ({
                    filename: file,
                    path: path.join(this.config.seedsPath, file)
                }));
        } catch (err) {
            error(`Failed to read seeds directory: ${err.message}`);
            return [];
        }
    }

    async runSeed(seedFile) {
        info(`Running seed: ${seedFile.filename}`);

        const content = await readFile(seedFile.path);
        const startTime = Date.now();

        try {
            await this.db.query(content);
            const executionTime = Date.now() - startTime;
            success(`Seed ${seedFile.filename} completed in ${executionTime}ms`);
        } catch (err) {
            error(`Seed ${seedFile.filename} failed: ${err.message}`);
            throw err;
        }
    }

    async runAllSeeds() {
        const seedFiles = await this.getSeedFiles();

        if (seedFiles.length === 0) {
            info('No seed files found');
            return;
        }

        info(`Found ${seedFiles.length} seed files`);

        for (const seedFile of seedFiles) {
            await this.runSeed(seedFile);
        }

        success(`All ${seedFiles.length} seeds completed successfully`);
    }
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

function showUsage() {
    console.log(`
OrçamentosOnline Database Migration Tool

USAGE:
    node migrate.js <command> [options]

COMMANDS:
    status                  Show migration status
    migrate                 Run all pending migrations
    seed                    Run all seed files
    rollback <version>      Rollback a specific migration (not implemented)
    reset                   Drop all tables and re-run migrations
    help                    Show this help message

OPTIONS:
    --dry-run              Show what would be executed without running
    --force                Force execution even with warnings
    --verbose              Show detailed output

EXAMPLES:
    node migrate.js status                    # Show current status
    node migrate.js migrate                   # Run pending migrations
    node migrate.js seed                      # Run seed data
    node migrate.js migrate --dry-run         # Preview migrations
    node migrate.js reset --force             # Reset database

ENVIRONMENT VARIABLES:
    POSTGRES_HOST          Database host (default: localhost)
    POSTGRES_PORT          Database port (default: 5432)
    POSTGRES_DB            Database name (default: orcamentos)
    POSTGRES_USER          Database user (default: orcamentos_user)
    POSTGRES_PASSWORD      Database password (required)
`);
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const options = {
        dryRun: args.includes('--dry-run'),
        force: args.includes('--force'),
        verbose: args.includes('--verbose'),
    };

    if (!command || command === 'help') {
        showUsage();
        return;
    }

    // Validate database configuration
    if (!config.database.password) {
        error('POSTGRES_PASSWORD environment variable is required');
        process.exit(1);
    }

    const database = new Database(config.database);

    try {
        await database.connect();

        const migrationManager = new MigrationManager(database, config);
        const seedManager = new SeedManager(database, config);

        await migrationManager.ensureMigrationTable();

        switch (command) {
            case 'status':
                await migrationManager.showStatus();
                break;

            case 'migrate':
                if (options.dryRun) {
                    const pending = await migrationManager.getPendingMigrations();
                    info(`Would run ${pending.length} migrations:`);
                    pending.forEach(m => console.log(`  - ${m.filename}`));
                } else {
                    await migrationManager.runAllPendingMigrations();
                }
                break;

            case 'seed':
                if (options.dryRun) {
                    const seeds = await seedManager.getSeedFiles();
                    info(`Would run ${seeds.length} seed files:`);
                    seeds.forEach(s => console.log(`  - ${s.filename}`));
                } else {
                    await seedManager.runAllSeeds();
                }
                break;

            case 'rollback':
                const version = args[1];
                if (!version) {
                    error('Version is required for rollback command');
                    process.exit(1);
                }
                await migrationManager.rollbackMigration(version);
                break;

            case 'reset':
                if (!options.force) {
                    error('Reset command requires --force flag for safety');
                    process.exit(1);
                }

                warning('Resetting database - this will drop all data!');
                // Implementation would go here - requires careful consideration
                error('Reset command not implemented for safety. Use backup/restore instead.');
                break;

            default:
                error(`Unknown command: ${command}`);
                showUsage();
                process.exit(1);
        }

    } catch (err) {
        error(`Migration failed: ${err.message}`);
        if (options.verbose) {
            console.error(err.stack);
        }
        process.exit(1);
    } finally {
        await database.disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(err => {
        console.error('Unhandled error:', err);
        process.exit(1);
    });
}

module.exports = { MigrationManager, SeedManager, Database };