# OrçamentosOnline - Docker Development Environment

**CRONOS Agent Deployment Complete**
**Version:** 1.0
**Date:** September 25, 2025

## Overview

This document provides comprehensive guidance for running OrçamentosOnline in a containerized Docker environment. The setup includes all necessary services for development, testing, and production deployment.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Load Balancer (Nginx)                           │
│                          Port 80/443 → Services                            │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│   API Service   │ │ Frontend Service │
│   (Node.js)     │ │    (React)      │
│   Port 3000     │ │   Port 3001     │
└─────────┬───────┘ └─────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│            Data Layer                   │
│  ┌─────────────┐    ┌─────────────────┐ │
│  │ PostgreSQL  │    │      Redis      │ │
│  │ Port 5432   │    │    Port 6379    │ │
│  └─────────────┘    └─────────────────┘ │
└─────────────────────────────────────────┘
```

## 📋 Prerequisites

- **Docker Desktop**: Version 20.10+ with Docker Compose V2
- **Git**: For version control and repository cloning
- **Make**: For simplified command execution (optional but recommended)
- **Node.js**: Version 18+ (for local development tools)

### System Requirements
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: At least 10GB free space
- **OS**: Windows 10/11, macOS 10.15+, or Linux

## 🚀 Quick Start

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url> orcamentos-online
cd orcamentos-online

# Run initial setup
make setup
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables (required!)
# Update database passwords, JWT secrets, etc.
vim .env
```

### 3. Start Development Environment
```bash
# Start all services
make start

# Or manually with docker-compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 4. Access Services
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3000/api/v1
- **Database Admin**: http://localhost:8080 (Adminer)
- **Redis Admin**: http://localhost:8081 (Redis Commander)
- **API Documentation**: http://localhost:3000/api/docs

## 🛠️ Available Commands

### Development Workflow
```bash
make setup          # Initial project setup
make start          # Start development environment
make stop           # Stop all services
make restart        # Restart all services
make status         # Show service status
make logs           # View all container logs
```

### Database Operations
```bash
make db-setup       # Initialize database with schema
make db-migrate     # Run database migrations
make db-seed        # Seed with development data
make db-reset       # Reset database (destructive!)
make db-backup      # Create database backup
make db-shell       # Open database shell
```

### Testing & Quality
```bash
make test           # Run all tests
make test-api       # Run API tests only
make test-frontend  # Run frontend tests only
make lint           # Run code linting
make format         # Format code with Prettier
make security       # Run security audits
```

### Container Management
```bash
make clean          # Clean up containers and volumes
make clean-all      # Clean up everything including images
make rebuild        # Rebuild images from scratch
make health         # Check service health
```

## 📁 Directory Structure

```
orcamentos-online/
├── docker-compose.yml              # Main compose configuration
├── docker-compose.dev.yml          # Development overrides
├── docker-compose.prod.yml         # Production overrides
├── .env.example                     # Environment template
├── Makefile                        # Development commands
├── services/
│   ├── api/                        # Backend API service
│   │   └── Dockerfile              # API container definition
│   ├── frontend/                   # React frontend service
│   │   └── Dockerfile              # Frontend container definition
│   └── database/                   # Database scripts and data
│       ├── init/                   # Initialization scripts
│       └── backups/                # Database backups
├── infrastructure/
│   ├── nginx/                      # Reverse proxy configuration
│   │   ├── nginx.conf              # Main Nginx config
│   │   └── conf.d/                 # Site configurations
│   ├── redis/                      # Redis configuration
│   │   └── redis.conf              # Redis settings
│   └── monitoring/                 # Monitoring stack configs
└── docs/                          # Documentation
    └── architecture/               # Architecture documentation
```

## 🔧 Environment Configuration

### Required Environment Variables

The `.env` file must contain the following variables:

```env
# Database
POSTGRES_PASSWORD=your_secure_password
POSTGRES_USER=orcamentos_user
POSTGRES_DB=orcamentos

# Redis
REDIS_PASSWORD=your_redis_password

# Authentication
JWT_SECRET=your_jwt_secret_32_chars_minimum
JWT_REFRESH_SECRET=your_refresh_secret_32_chars_minimum
SESSION_SECRET=your_session_secret_32_chars_minimum

# File Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_s3_bucket
```

### Generating Secure Secrets
```bash
# Generate secure JWT secrets
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🌐 Service Details

### API Service (Backend)
- **Framework**: Node.js + Express/NestJS + TypeScript
- **Port**: 3000
- **Health Check**: `GET /api/v1/health`
- **Documentation**: `GET /api/docs`
- **Debug Port**: 9229 (development only)

### Frontend Service
- **Framework**: React + TypeScript + Vite
- **Port**: 3001
- **Hot Reload**: Enabled in development
- **Build Output**: Served by Nginx in production

### Database Service (PostgreSQL)
- **Version**: PostgreSQL 15
- **Port**: 5432
- **Database**: `orcamentos_dev` (development)
- **User**: `orcamentos_user`
- **Extensions**: uuid-ossp, pg_trgm, unaccent

### Cache Service (Redis)
- **Version**: Redis 7
- **Port**: 6379
- **Usage**: Sessions, caching, job queues
- **Persistence**: RDB + AOF enabled

### Reverse Proxy (Nginx)
- **Version**: Nginx 1.25
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Features**: SSL termination, rate limiting, compression
- **Static Files**: Served directly for performance

## 🔐 Security Features

### Network Security
- **Isolated Network**: All services communicate on private network
- **Rate Limiting**: API endpoints protected against abuse
- **CORS**: Configured for allowed origins only
- **Security Headers**: Comprehensive HTTP security headers

### Authentication & Authorization
- **JWT Tokens**: Secure authentication with refresh tokens
- **Password Hashing**: bcrypt with configurable rounds
- **Session Management**: Redis-based session storage
- **Multi-tenant**: Organization-scoped data isolation

### Data Protection
- **Database Encryption**: Encrypted connections and data at rest
- **File Upload Security**: Type validation and size limits
- **Input Validation**: Request sanitization and validation
- **Audit Logging**: Comprehensive activity logging

## 🏭 Production Deployment

### Production Configuration
```bash
# Build production images
make prod-build

# Deploy to production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or with make command
make prod-start
```

### Production Features
- **Multi-replica Services**: Load balancing across instances
- **Resource Limits**: Memory and CPU constraints
- **Health Checks**: Automatic service recovery
- **SSL Certificates**: Let's Encrypt integration
- **Log Aggregation**: ELK stack for centralized logging
- **Monitoring**: Prometheus + Grafana metrics

### Scaling Services
```bash
# Scale API service to 3 replicas
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale api=3

# Scale frontend service
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale frontend=2
```

## 📊 Monitoring & Observability

### Health Monitoring
```bash
# Check all service health
make health

# View service status
make status

# Monitor logs in real-time
make logs
```

### Metrics Collection
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization dashboards
- **Application Metrics**: Response times, error rates
- **Infrastructure Metrics**: CPU, memory, disk usage

### Log Management
- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: Configurable logging levels
- **Log Rotation**: Automatic log file management
- **Centralized Logs**: ELK stack integration

## 🧪 Testing Environment

### Running Tests
```bash
# Run all test suites
make test

# Run specific test types
make test-api        # Backend API tests
make test-frontend   # Frontend component tests
make test-e2e        # End-to-end tests
make test-coverage   # Generate coverage reports
```

### Test Database
- **Separate Database**: Isolated test database
- **Test Data**: Automated test data seeding
- **Cleanup**: Automatic test data cleanup
- **Parallel Tests**: Support for concurrent test execution

## 🚨 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check service status
make status

# View service logs
make logs

# Check for port conflicts
netstat -tulpn | grep :3000
```

#### Database Connection Issues
```bash
# Verify database is running
make db-shell

# Check database logs
docker-compose logs postgres

# Reset database if corrupted
make db-reset
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check service health
make health

# View detailed logs
make logs
```

### Debug Commands
```bash
# Open shell in any service
make shell-api
make shell-frontend
make shell-postgres

# View container resource usage
docker stats $(docker-compose ps -q)

# Inspect network configuration
docker network ls
docker network inspect orcamentos-network
```

## 🔄 Development Workflow

### Daily Development
1. **Start Environment**: `make start`
2. **Check Health**: `make health`
3. **View Logs**: `make logs` (in separate terminal)
4. **Run Tests**: `make test` (before committing)
5. **Code Quality**: `make lint format` (before committing)

### Code Changes
- **Hot Reload**: Frontend and API automatically reload on changes
- **Database Changes**: Run `make db-migrate` for schema changes
- **Dependency Changes**: Rebuild containers with `make rebuild`

### Debugging
- **API Debugging**: Use port 9229 with Node.js debugger
- **Frontend Debugging**: Browser DevTools with source maps
- **Database Debugging**: Use Adminer web interface
- **Redis Debugging**: Use Redis Commander interface

## 📚 Additional Resources

### Documentation
- [API Documentation](http://localhost:3000/api/docs)
- [Architecture Overview](./docs/architecture/system-overview.md)
- [Database Schema](./docs/architecture/database-schema.sql)
- [Service Architecture](./docs/architecture/service-architecture.md)

### External Tools
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Nginx Documentation](https://nginx.org/en/docs/)

## 🤝 Support

For technical issues or questions:
1. Check this documentation first
2. Review service logs with `make logs`
3. Check GitHub issues for known problems
4. Contact the development team

## 📝 CRONOS Agent Mission Complete

The Docker containerization infrastructure is now fully deployed with:

✅ **Complete Docker Compose Setup** with development and production configurations
✅ **Nginx Reverse Proxy** with SSL, rate limiting, and security headers
✅ **Redis Configuration** optimized for caching and job queues
✅ **Environment Management** with comprehensive variable templates
✅ **Development Workflow** with Makefile automation and health monitoring
✅ **Production Deployment** with scaling, monitoring, and SSL support
✅ **Security Hardening** with network isolation and access controls

**Next Agent Ready**: CASSANDRA for database implementation and configuration.