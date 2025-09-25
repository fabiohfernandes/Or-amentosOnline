# OrçamentosOnline - System Architecture Overview

**Version:** 1.0
**Date:** September 25, 2025
**Status:** Foundation Phase

## Executive Summary

OrçamentosOnline implements a cloud-native, microservices architecture designed for scalability, security, and multi-tenant operations. The system leverages Docker containers, AWS services, and modern JavaScript/TypeScript technologies to deliver a comprehensive proposal management platform.

## Architecture Principles

### 1. Multi-Tenant Isolation
- **Organization-based tenancy** with secure data isolation
- **Subdomain routing** for brand customization (client.infigital.net)
- **Database-level tenant isolation** using tenant_id foreign keys

### 2. Microservices Design
- **API Gateway** for centralized routing and authentication
- **Service Discovery** through Docker Compose networking
- **Event-driven architecture** for service communication
- **Independent deployments** with container orchestration

### 3. Security-First Approach
- **JWT-based authentication** with refresh token rotation
- **RBAC (Role-Based Access Control)** at organization and user levels
- **HTTPS-only communication** with SSL termination
- **Input validation and sanitization** at all service boundaries

## System Components

### Core Services

#### 1. API Service (`services/api`)
**Technology:** Node.js + Express/NestJS + TypeScript
**Port:** 3000
**Responsibilities:**
- Authentication and authorization
- Organization and user management
- Proposal CRUD operations
- File upload and processing
- Notification orchestration

#### 2. Frontend Service (`services/frontend`)
**Technology:** React + TypeScript + Vite
**Port:** 3001
**Responsibilities:**
- User interface and experience
- Real-time collaboration features
- Design import integration
- Client-facing proposal views

#### 3. Database Service (`services/database`)
**Technology:** PostgreSQL + Redis
**Ports:** 5432, 6379
**Responsibilities:**
- Multi-tenant data persistence
- Session and cache management
- Full-text search capabilities
- Audit logging and compliance

### Infrastructure Components

#### 1. Reverse Proxy (Nginx)
**Port:** 80, 443
**Responsibilities:**
- SSL termination and HTTPS enforcement
- Load balancing across service instances
- Static asset serving
- Rate limiting and DDoS protection

#### 2. Message Queue (Redis)
**Port:** 6379
**Responsibilities:**
- Asynchronous job processing
- Real-time notifications
- Cache layer for performance
- Session storage

## Database Architecture

### Multi-Tenant Data Model

```sql
-- Core tenant isolation
organizations (id, slug, domain, created_at, updated_at)
  |-- users (id, organization_id, email, role, created_at)
  |-- proposals (id, organization_id, title, status, created_at)
  |-- clients (id, organization_id, name, email, created_at)
  |-- templates (id, organization_id, name, content, created_at)

-- Security and audit
user_sessions (id, user_id, token_hash, expires_at)
audit_logs (id, organization_id, user_id, action, details, created_at)
```

### Key Relationships
- **Organizations** serve as tenant boundaries
- **Users** belong to organizations with specific roles
- **Proposals** are scoped to organizations
- **All data** includes organization_id for tenant isolation

## API Architecture

### RESTful Endpoints
```
/api/v1/auth          # Authentication endpoints
/api/v1/organizations # Organization management
/api/v1/users         # User management
/api/v1/proposals     # Proposal operations
/api/v1/clients       # Client management
/api/v1/files         # File upload/download
/api/v1/notifications # Notification system
```

### Authentication Flow
1. **Login** → JWT access token + refresh token
2. **API Requests** → Bearer token validation
3. **Token Refresh** → Automatic renewal before expiration
4. **Logout** → Token invalidation and cleanup

## Deployment Architecture

### Docker Composition
```yaml
services:
  nginx:      # Reverse proxy (80, 443)
  api:        # Backend API (3000)
  frontend:   # React app (3001)
  postgres:   # Database (5432)
  redis:      # Cache/Queue (6379)

volumes:
  postgres_data:  # Database persistence
  uploads:        # File storage
```

### Environment Configuration
- **Development:** Docker Compose with hot reload
- **Production:** AWS ECS with auto-scaling
- **Staging:** Kubernetes for testing

## Security Considerations

### Data Protection
- **Encryption at rest** for database and file storage
- **Encryption in transit** with TLS 1.3
- **PII handling** in compliance with LGPD requirements
- **Backup encryption** for disaster recovery

### Access Control
- **Multi-factor authentication** for administrative users
- **API rate limiting** to prevent abuse
- **Input validation** using schema validation
- **SQL injection prevention** through parameterized queries

## Performance Targets

### Response Times
- **API Endpoints:** < 200ms average
- **Database Queries:** < 100ms average
- **File Uploads:** < 5s for 10MB files
- **Page Load:** < 3s initial load globally

### Scalability
- **Concurrent Users:** 1,000+ per organization
- **Database Connections:** Connection pooling with max 100
- **File Storage:** S3-compatible with CDN distribution
- **Cache Hit Ratio:** > 80% for frequently accessed data

## Next Steps - ARCHITECT Handoff

This architecture document serves as the foundation for subsequent development phases:

1. **CRONOS Agent** will implement Docker containerization
2. **CASSANDRA Agent** will create the database schema
3. **ORION Agent** will build the API services
4. **NOVA Agent** will develop the frontend interface
5. **FORTRESS Agent** will implement security measures

Each agent should reference this document for architectural consistency and alignment with the overall system design.