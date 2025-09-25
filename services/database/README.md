# OrçamentosOnline Database Documentation

**Database Engineering by CASSANDRA Agent**
**Version:** 2.0 - Phase 2 Enhanced
**Date:** September 25, 2025

## Overview

The OrçamentosOnline database system is a comprehensive PostgreSQL-based multi-tenant platform designed specifically for the Brazilian market, incorporating LGPD compliance, performance optimization, and robust monitoring capabilities. This Phase 2 enhancement includes advanced Brazilian compliance features, comprehensive performance optimization, and enterprise-grade monitoring systems.

## 🏗️ Architecture

### Multi-Tenant Design
```
┌─────────────────────────────────────────────────────────────┐
│                    ORGANIZATIONS                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Tenant A  │  │   Tenant B  │  │   Tenant C  │        │
│  │             │  │             │  │             │        │
│  │  ┌───────┐  │  │  ┌───────┐  │  │  ┌───────┐  │        │
│  │  │ Users │  │  │  │ Users │  │  │  │ Users │  │        │
│  │  └───────┘  │  │  └───────┘  │  │  └───────┘  │        │
│  │  ┌───────┐  │  │  ┌───────┐  │  │  ┌───────┐  │        │
│  │  │Clients│  │  │  │Clients│  │  │  │Clients│  │        │
│  │  └───────┘  │  │  └───────┘  │  │  └───────┘  │        │
│  │  ┌───────┐  │  │  ┌───────┐  │  │  ┌───────┐  │        │
│  │  │Propo- │  │  │  │Propo- │  │  │  │Propo- │  │        │
│  │  │sals   │  │  │  │sals   │  │  │  │sals   │  │        │
│  │  └───────┘  │  │  └───────┘  │  │  └───────┘  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Core Tables
- **organizations**: Tenant isolation boundary
- **users**: Multi-role user management
- **clients**: Customer relationship management
- **proposals**: Core business documents
- **proposal_sections**: Structured proposal content
- **proposal_items**: Detailed line items
- **files**: Secure file management
- **activity_logs**: Comprehensive audit trail
- **notifications**: Multi-channel messaging

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for migration tools)
- PostgreSQL client tools (optional)

### Initial Setup
```bash
# Navigate to database service
cd services/database

# Install dependencies
npm install

# Start PostgreSQL container (from project root)
docker-compose up -d postgres

# Wait for database to be ready
sleep 15

# Run initial migrations
npm run migrate

# Seed development data
npm run seed

# Check migration status
npm run migrate:status
```

## 📊 Database Schema

### Core Entities

#### Organizations (Multi-tenant Isolation)
```sql
organizations (
    id UUID PRIMARY KEY,
    slug VARCHAR(50) UNIQUE,
    name VARCHAR(255),
    domain VARCHAR(255),
    subscription_tier VARCHAR(20),
    subscription_status VARCHAR(20),
    max_users INTEGER,
    max_proposals INTEGER,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
```

#### Users (Role-based Access)
```sql
users (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    email CITEXT UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20), -- owner, admin, manager, member
    preferences JSONB,
    email_verified BOOLEAN,
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER,
    locked_until TIMESTAMP WITH TIME ZONE
)
```

#### Proposals (Core Business Logic)
```sql
proposals (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    client_id UUID REFERENCES clients(id),
    created_by UUID REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(20), -- draft, sent, viewed, approved, etc.
    content JSONB,
    design_settings JSONB,
    total_amount DECIMAL(12,2),
    currency VARCHAR(3),
    public_token UUID UNIQUE, -- For client access
    view_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
```

### Security Features
- **Row Level Security (RLS)** for multi-tenant isolation
- **Encrypted password storage** with bcrypt
- **Session management** with secure tokens
- **Audit logging** for LGPD compliance
- **Input validation** at database level

## 🛠️ Migration System

### Running Migrations
```bash
# Show current status
npm run migrate:status

# Run pending migrations
npm run migrate

# Preview what would be executed
npm run migrate:dry-run

# Run seed data
npm run seed
```

### Creating New Migrations
1. Create file in `migrations/` directory with format: `XXX_description.sql`
2. Include proper transaction handling
3. Add migration tracking
4. Test thoroughly before deployment

### Migration File Structure
```sql
-- Migration XXX: Description
BEGIN;

-- Record migration start
INSERT INTO maintenance.migration_history (version, description, applied_at)
VALUES ('XXX', 'Migration description', NOW());

-- Your schema changes here
CREATE TABLE example (...);

-- Update migration completion
UPDATE maintenance.migration_history
SET execution_time_ms = EXTRACT(EPOCH FROM (NOW() - applied_at)) * 1000
WHERE version = 'XXX';

COMMIT;
```

## 📦 Backup & Recovery

### Automated Backups
```bash
# Full database backup
npm run backup

# Schema-only backup
npm run backup:schema

# Data-only backup
npm run backup:data

# Verify backup integrity
npm run backup:verify

# Clean old backups
npm run backup:cleanup
```

### Advanced Backup Options
```bash
# Custom backup with compression
./scripts/backup.sh --full --compress

# Backup specific tables
./scripts/backup.sh --tables "users,proposals"

# Backup with encryption (production)
./scripts/backup.sh --full --encrypt

# Restore from backup
./scripts/backup.sh --restore backup_file.sql.gz
```

### Backup Configuration
- **Retention**: 30 days by default
- **Compression**: Gzip enabled
- **Encryption**: GPG support (production)
- **Storage**: Local filesystem (configurable for S3)

## 🔒 Security Implementation

### Multi-Tenant Isolation
```sql
-- Example RLS policy (applied by application)
CREATE POLICY org_isolation ON proposals
FOR ALL TO application_role
USING (organization_id = current_setting('app.current_organization_id')::UUID);
```

### Brazilian Compliance (LGPD)
- **Data masking** functions for PII
- **Audit logging** for all data access
- **CPF/CNPJ validation** functions
- **Data retention** policies
- **Consent tracking** capabilities

### Access Control
```sql
-- Role hierarchy
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO orcamentos_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO orcamentos_readonly;
GRANT ALL ON ALL TABLES IN SCHEMA public TO orcamentos_owner;
```

## 📈 Performance Optimization

### Indexing Strategy
- **Primary keys** on all tables
- **Foreign key indexes** for referential integrity
- **Composite indexes** for common query patterns
- **Partial indexes** for status-based queries
- **GIN indexes** for JSONB and full-text search

### Query Optimization
```sql
-- Full-text search configuration
CREATE TEXT SEARCH CONFIGURATION portuguese_unaccent (COPY = portuguese);
ALTER TEXT SEARCH CONFIGURATION portuguese_unaccent
ALTER MAPPING FOR word WITH unaccent, portuguese_stem;

-- Example optimized query
SELECT p.* FROM proposals p
WHERE p.organization_id = $1
AND to_tsvector('portuguese_unaccent', p.title) @@ plainto_tsquery('portuguese_unaccent', $2)
ORDER BY p.created_at DESC;
```

### Database Tuning
```sql
-- PostgreSQL configuration (via container)
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
random_page_cost = 1.1
effective_io_concurrency = 200
```

## 🧪 Development Tools

### Database Console Access
```bash
# PostgreSQL shell
npm run psql

# View database logs
npm run logs

# Test database connection
npm run test:connection

# Database health check
npm run health:check
```

### Development Data
The seed data includes:
- **3 demo organizations** with different subscription tiers
- **5 test users** with various roles
- **4 sample clients** with realistic Brazilian data
- **4 proposal examples** in different states
- **Proposal templates** for common use cases
- **Activity logs** for testing audit features

### Test Credentials
```
Demo Empresa (demo-empresa):
- Owner: admin@demo.com / admin123
- Manager: gerente@demo.com / admin123
- Member: vendedor@demo.com / admin123

Agência Criativa (agencia-criativa):
- Owner: diretor@criativa.com / admin123
- Member: designer@criativa.com / admin123
```

## 🔧 Maintenance Operations

### Database Maintenance
```bash
# Analyze database statistics
npm run analyze

# Vacuum tables (reclaim space)
npm run vacuum

# Rebuild indexes
npm run reindex
```

### Health Monitoring
```sql
-- Check database size
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor active connections
SELECT
    count(*) as connection_count,
    state,
    usename
FROM pg_stat_activity
GROUP BY state, usename;

-- Check slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

## 🚀 Production Deployment

### Environment Configuration
```env
# Production database settings
POSTGRES_HOST=your-production-host
POSTGRES_PORT=5432
POSTGRES_DB=orcamentos_prod
POSTGRES_USER=orcamentos_prod_user
POSTGRES_PASSWORD=your-secure-production-password

# Backup configuration
BACKUP_ENCRYPTION_KEY=your-gpg-key-id
BACKUP_S3_BUCKET=your-backup-bucket
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret

# Performance tuning
DB_POOL_MIN=5
DB_POOL_MAX=50
DB_TIMEOUT=30000
```

### Production Checklist
- [ ] SSL/TLS encryption enabled
- [ ] Row Level Security (RLS) policies applied
- [ ] Backup automation configured
- [ ] Monitoring and alerting setup
- [ ] Connection pooling optimized
- [ ] Slow query monitoring enabled
- [ ] Database users with minimal permissions
- [ ] Regular maintenance scheduled

### Scaling Considerations
- **Read replicas** for reporting queries
- **Connection pooling** with pgBouncer
- **Partitioning** for large tables (time-based)
- **Archiving** old data to reduce active dataset
- **Caching** frequently accessed data with Redis

## 📚 Additional Resources

### PostgreSQL Features Used
- **JSONB** for flexible schema design
- **Full-text search** with Portuguese language support
- **Row Level Security** for multi-tenant isolation
- **Triggers** for automatic timestamp updates
- **Extensions** (uuid-ossp, pg_trgm, unaccent)
- **Custom functions** for Brazilian business logic

### Brazilian Market Compliance
- **LGPD (Lei Geral de Proteção de Dados)** compliance
- **CPF/CNPJ** validation and formatting
- **Portuguese language** full-text search
- **Brazilian timezone** support (America/Sao_Paulo)
- **Real (BRL) currency** handling

## 🤝 CASSANDRA Agent Mission Complete

The database layer has been successfully implemented with:

✅ **Complete Multi-tenant Schema** with Row Level Security
✅ **Migration System** with Node.js tooling and validation
✅ **Comprehensive Seed Data** for development and testing
✅ **Backup/Restore Tools** with encryption and compression
✅ **Brazilian Market Compliance** with LGPD audit trails
✅ **Performance Optimization** with proper indexing
✅ **Security Hardening** with role-based access control
✅ **Development Tools** for database management

**Next Agent Ready**: ORION for backend API development and business logic implementation.

---

### Support
For database-related issues:
1. Check migration status: `npm run migrate:status`
2. Review database logs: `npm run logs`
3. Test connection: `npm run test:connection`
4. Contact: fabio@metamentes.com