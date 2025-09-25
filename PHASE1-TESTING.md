# 🚀 OrçamentosOnline Phase 1 Testing Guide

**Testing Status**: Ready for comprehensive validation
**Date**: September 25, 2025
**Components**: All core services operational

## 📋 What We're Testing

Phase 1 represents our **Minimum Viable Product (MVP)** with these core components:

✅ **ARCHITECT** - System architecture and planning
✅ **CRONOS** - Docker infrastructure and DevOps
✅ **CASSANDRA** - Database system and data management
✅ **ORION** - Backend API service with security
✅ **NOVA** - Frontend React/Next.js application
✅ **FORTRESS** - Security implementation (JWT, CORS, rate limiting)

## 🎯 Testing Objectives

1. **System Integration**: Verify all services work together seamlessly
2. **Authentication Flow**: Test login/logout and protected routes
3. **API Functionality**: Validate backend endpoints and responses
4. **Frontend Interface**: Ensure UI loads and communicates with backend
5. **Security**: Confirm JWT authentication and rate limiting work
6. **Performance**: Basic responsiveness and error handling

## 🔧 Prerequisites

Before starting, ensure you have:

- **Docker & Docker Compose** installed and running
- **Node.js** 18+ (for testing scripts)
- **Git** (if you want to commit changes)
- Ports **3000, 3001, 5432, 6379, 8080, 8081** available

## 🚀 Quick Start Guide

### Step 1: Start All Services

```bash
# Navigate to project directory
cd "D:\OrçamentosOnline"

# Start all services in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Check service status
docker-compose ps
```

### Step 2: Wait for Services to Initialize

Services need time to start up:
- **Database**: ~30 seconds (PostgreSQL initialization)
- **Redis**: ~10 seconds
- **API**: ~60 seconds (depends on database)
- **Frontend**: ~90 seconds (Vite build process)

### Step 3: Run Automated Tests

```bash
# Run comprehensive Phase 1 tests
node test-phase1.js
```

### Step 4: Manual Testing

#### 🌐 Access Points

- **Frontend Application**: http://localhost:3001
- **Backend API**: http://localhost:3000/api/v1
- **Database Admin (Adminer)**: http://localhost:8080
- **Redis Admin**: http://localhost:8081

#### 🔑 Demo Credentials

For testing authentication:
- **Email**: `demo@orcamentos.com`
- **Password**: `demo123`

## 🧪 Detailed Testing Procedures

### 1. API Service Testing

#### Health Check
```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "orcamentos-online-api",
  "database": { "status": "connected" },
  "redis": { "status": "connected" }
}
```

#### API Documentation
```bash
curl http://localhost:3000/api/v1
```

#### Authentication Test
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@orcamentos.com","password":"demo123"}'
```

#### Protected Route Test
```bash
# Use token from login response
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/user/profile
```

### 2. Frontend Testing

1. **Open**: http://localhost:3001
2. **Verify**: Page loads without errors
3. **Test**: Login form functionality
4. **Check**: Navigation and responsive design

### 3. Database Testing

1. **Access Adminer**: http://localhost:8080
2. **Connect** with:
   - **Server**: `postgres`
   - **Username**: `orcamentos_user`
   - **Password**: `dev_postgres_2025`
   - **Database**: `orcamentos`

### 4. Redis Testing

1. **Access Redis Commander**: http://localhost:8081
2. **Login**: `admin` / `admin123`
3. **Verify**: Redis is running and accessible

## 🔍 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check Docker status
docker ps -a

# View service logs
docker-compose logs api
docker-compose logs frontend
docker-compose logs postgres
```

#### Port Conflicts
```bash
# Check what's using ports
netstat -an | findstr :3000
netstat -an | findstr :3001

# Stop conflicting services or modify docker-compose ports
```

#### Environment Variables
```bash
# Verify .env file exists and has correct values
cat .env

# Regenerate if needed
cp .env.example .env
# Edit with your values
```

### Service-Specific Issues

#### API Service (Port 3000)
- Check database connection
- Verify Redis connection
- Review API logs: `docker-compose logs api`

#### Frontend Service (Port 3001)
- Ensure API is running first
- Check for build errors
- Review frontend logs: `docker-compose logs frontend`

#### Database Issues
- Wait for full initialization (can take 60+ seconds)
- Check PostgreSQL logs: `docker-compose logs postgres`
- Verify data persistence: `docker volume ls`

## 📊 Expected Test Results

### ✅ Success Indicators

- All services show "healthy" status
- Frontend loads at localhost:3001
- API responds to health checks
- Authentication works with demo credentials
- Protected routes require valid JWT tokens
- Database tables are created correctly
- Redis cache is operational

### ❌ Failure Indicators

- Services fail to start or stay running
- API returns 500 errors consistently
- Frontend shows build/runtime errors
- Authentication always fails
- Database connection errors
- Redis connection failures

## 🎯 Success Criteria

Phase 1 is considered **SUCCESSFUL** if:

1. **All services start** without critical errors
2. **Frontend loads** and displays correctly
3. **API endpoints respond** appropriately
4. **Authentication flow works** end-to-end
5. **Database connectivity** is established
6. **Security features function** (JWT, CORS, rate limiting)

## 📋 Testing Checklist

- [ ] Docker services start successfully
- [ ] API health check passes
- [ ] Frontend application loads
- [ ] Login with demo credentials works
- [ ] JWT tokens are generated and validated
- [ ] Protected routes require authentication
- [ ] Database connection established
- [ ] Redis cache operational
- [ ] Basic CRUD operations function
- [ ] Error handling works appropriately
- [ ] Security headers are present
- [ ] Rate limiting activates under load

## 🔄 Next Steps

After successful Phase 1 testing:

1. **Document any issues** found during testing
2. **Performance baseline** measurements
3. **Security audit** of implemented features
4. **User acceptance** testing preparation
5. **Phase 2 planning** and feature prioritization

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Review service logs** for detailed error messages
3. **Verify environment** configuration
4. **Test individual services** in isolation
5. **Document issues** for development team review

---

**Happy Testing!** 🚀

*This Phase 1 represents the foundation of OrçamentosOnline. Your feedback is crucial for Phase 2 development.*