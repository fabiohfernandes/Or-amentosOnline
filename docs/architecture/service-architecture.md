# Service Architecture Blueprint

**Project:** OrçamentosOnline
**Version:** 1.0
**Date:** September 25, 2025
**ARCHITECT Agent Completion**

## Service Architecture Overview

OrçamentosOnline implements a distributed microservices architecture with clear separation of concerns, designed for scalability, maintainability, and multi-tenant operations.

## Service Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            LOAD BALANCER / NGINX                           │
│                          (SSL, Rate Limiting)                              │
└─────────────────────┬───────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                      │
│                    (Authentication, Routing)                               │
└─────────┬─────────────────────┬─────────────────────┬─────────────────────┘
          │                     │                     │
          ▼                     ▼                     ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API SERVICE   │    │ FRONTEND WEB    │    │  FILE SERVICE   │
│  (Node.js/TS)   │    │  (React/Vite)   │    │   (Optional)    │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 3002    │
└─────────┬───────┘    └─────────────────┘    └─────────┬───────┘
          │                                              │
          ▼                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐     │
│  │   PostgreSQL    │  │      Redis      │  │        S3/MinIO         │     │
│  │   (Database)    │  │ (Cache/Queue)   │  │    (File Storage)       │     │
│  │   Port: 5432    │  │   Port: 6379    │  │       Port: 9000        │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Specifications

### 1. API Service (Core Backend)
**Technology:** Node.js + Express/NestJS + TypeScript
**Container:** `orcamentos-api`
**Port:** 3000
**Dependencies:** PostgreSQL, Redis

**Primary Responsibilities:**
- User authentication and session management
- Organization and multi-tenant operations
- Proposal CRUD operations and business logic
- Client relationship management
- File upload coordination and metadata
- Real-time notification orchestration
- API rate limiting and security enforcement

**Key Features:**
- JWT-based authentication with refresh tokens
- Multi-tenant data isolation with organization scoping
- RESTful API with OpenAPI 3.0 documentation
- Input validation and sanitization
- Audit logging for compliance
- Background job processing with Redis queues

**Environment Variables:**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@postgres:5432/orcamentos
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
AWS_S3_BUCKET=orcamentos-files
AWS_S3_REGION=sa-east-1
```

### 2. Frontend Web Service
**Technology:** React + TypeScript + Vite + TailwindCSS
**Container:** `orcamentos-frontend`
**Port:** 3001
**Dependencies:** API Service

**Primary Responsibilities:**
- Modern, responsive user interface
- Real-time collaboration features with WebSockets
- Design import integration (Canva/Gamma)
- Client-facing proposal presentation
- File upload with progress tracking
- Multi-language support (Portuguese/English)

**Key Features:**
- Component-based architecture with React 18+
- Type-safe development with TypeScript
- Real-time updates using WebSocket connections
- Progressive Web App (PWA) capabilities
- Accessibility compliance (WCAG 2.2 AA)
- Mobile-first responsive design

**Environment Variables:**
```env
NODE_ENV=development
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_PUBLIC_DOMAIN=localhost:3001
```

### 3. Database Service (PostgreSQL)
**Technology:** PostgreSQL 15+
**Container:** `orcamentos-postgres`
**Port:** 5432
**Volume:** `postgres_data`

**Primary Responsibilities:**
- Multi-tenant data storage with strict isolation
- Full-text search capabilities
- ACID compliance for financial data
- Backup and point-in-time recovery
- Connection pooling optimization

**Key Features:**
- Row Level Security (RLS) for tenant isolation
- Full-text search with Portuguese language support
- Automated backups with S3 integration
- Performance monitoring and query optimization
- SSL/TLS encrypted connections

**Configuration:**
```env
POSTGRES_DB=orcamentos
POSTGRES_USER=orcamentos_user
POSTGRES_PASSWORD=secure_password
POSTGRES_MAX_CONNECTIONS=100
```

### 4. Cache & Queue Service (Redis)
**Technology:** Redis 7+
**Container:** `orcamentos-redis`
**Port:** 6379
**Volume:** `redis_data`

**Primary Responsibilities:**
- Session storage and management
- API response caching
- Background job queue processing
- Real-time message broadcasting
- Rate limiting token bucket

**Key Features:**
- Persistence with AOF and RDB snapshots
- Memory optimization with LRU eviction
- Pub/Sub for real-time notifications
- Cluster-ready configuration
- SSL/TLS support

**Configuration:**
```env
REDIS_PASSWORD=secure_redis_password
REDIS_MAXMEMORY=512mb
REDIS_MAXMEMORY_POLICY=allkeys-lru
```

### 5. Reverse Proxy (Nginx)
**Technology:** Nginx 1.25+
**Container:** `orcamentos-nginx`
**Ports:** 80, 443
**Volume:** `ssl_certs`

**Primary Responsibilities:**
- SSL termination and HTTPS enforcement
- Load balancing across service instances
- Static asset serving with caching
- Rate limiting and DDoS protection
- Subdomain routing for multi-tenancy

**Key Features:**
- HTTP/2 and HTTP/3 support
- Gzip compression for performance
- Security headers enforcement
- Access logging and monitoring
- Let's Encrypt integration

## Inter-Service Communication

### 1. Synchronous Communication
- **HTTP/HTTPS REST APIs** for client-server communication
- **Internal service mesh** using Docker network isolation
- **Connection pooling** for database connections
- **Circuit breaker pattern** for resilience

### 2. Asynchronous Communication
- **Redis Pub/Sub** for real-time notifications
- **Background job queues** for heavy processing
- **WebSocket connections** for live collaboration
- **Event sourcing** for audit trails

## Security Architecture

### 1. Authentication & Authorization
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   API Gateway   │    │  Auth Service   │
│                 │    │                 │    │                 │
│ 1. Login        │───▶│ 2. Validate     │───▶│ 3. JWT Token    │
│ Request         │    │ Credentials     │    │ Generation      │
│                 │◀───│                 │◀───│                 │
│ 4. Access Token │    │ 5. Return Token │    │ 6. Store Session│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. Multi-Tenant Data Isolation
- **Organization-scoped queries** with mandatory `organization_id` filters
- **Row Level Security (RLS)** at database level
- **JWT token organization claims** for context
- **Middleware validation** for tenant access

### 3. Security Headers & Policies
```nginx
# Nginx security configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self'" always;
add_header Strict-Transport-Security "max-age=31536000" always;
```

## Performance & Scalability

### 1. Caching Strategy
- **API Response Caching** with Redis (TTL: 5-60 minutes)
- **Database Query Caching** for complex analytics
- **Static Asset Caching** with CDN integration
- **Browser Caching** with appropriate headers

### 2. Database Optimization
- **Connection Pooling** with pgBouncer
- **Read Replicas** for reporting queries
- **Partitioning** for large tables (future)
- **Indexing Strategy** for common query patterns

### 3. Horizontal Scaling
- **Stateless Services** for easy horizontal scaling
- **Load Balancer** with health checks
- **Container Orchestration** with Docker Swarm/Kubernetes
- **Database Clustering** for high availability

## Monitoring & Observability

### 1. Health Checks
```yaml
# Docker Compose health check example
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 2. Logging Strategy
- **Structured JSON Logging** with correlation IDs
- **Log Aggregation** with ELK Stack or similar
- **Error Tracking** with Sentry integration
- **Performance Monitoring** with APM tools

### 3. Metrics Collection
- **Application Metrics** (response times, error rates)
- **Infrastructure Metrics** (CPU, memory, disk)
- **Business Metrics** (proposals created, conversion rates)
- **Custom Dashboards** with Grafana

## Development Workflow

### 1. Local Development
```bash
# Start all services
docker-compose up -d

# Run database migrations
npm run migrate

# Start development with hot reload
npm run dev
```

### 2. Testing Strategy
- **Unit Tests** for business logic (Jest/Vitest)
- **Integration Tests** for API endpoints
- **End-to-End Tests** with Playwright
- **Performance Tests** with Artillery

### 3. CI/CD Pipeline
- **Code Quality** checks with ESLint/Prettier
- **Security Scanning** with Snyk
- **Automated Testing** on pull requests
- **Container Image Building** and registry push

## Deployment Architecture

### 1. Production Environment
```yaml
# Production scaling configuration
services:
  api:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: '1.0'

  postgres:
    deploy:
      replicas: 1
      resources:
        limits:
          memory: 2G
          cpus: '2.0'
```

### 2. Infrastructure as Code
- **Docker Compose** for local development
- **AWS CloudFormation** for production infrastructure
- **Terraform** for multi-cloud deployments
- **Kubernetes Manifests** for container orchestration

## ARCHITECT Agent Handoff Summary

The foundational architecture is now complete with the following deliverables:

✅ **System Architecture Overview** - High-level service design
✅ **Database Schema Design** - Complete multi-tenant data model
✅ **API Specification** - OpenAPI 3.0 contract definition
✅ **Service Architecture Blueprint** - Detailed implementation guide

**Next Phase - Agent Deployment Sequence:**

1. **CRONOS Agent** → Docker containerization and DevOps setup
2. **CASSANDRA Agent** → Database implementation and seeding
3. **ORION Agent** → Backend API service development
4. **NOVA Agent** → Frontend React application
5. **FORTRESS Agent** → Security implementation and hardening

Each subsequent agent should reference these architectural documents for consistency and alignment with the overall system design.

**Key Architectural Decisions Finalized:**
- Multi-tenant PostgreSQL with Row Level Security
- JWT-based authentication with refresh token rotation
- Docker containerized microservices architecture
- Redis for caching, sessions, and background jobs
- React + TypeScript frontend with real-time capabilities
- OpenAPI 3.0 documented RESTful API
- HTTPS-only communication with comprehensive security headers

The architecture provides a solid foundation for the 16-23 week development timeline while maintaining flexibility for future enhancements and scaling requirements.