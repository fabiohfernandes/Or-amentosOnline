# Phase 1 Testing Guide - Orçamentos Online

## Overview
This guide will walk you through testing our Phase 1 containerized implementation. We'll validate each component of our platform systematically.

## What We're Testing
- **Frontend**: React application with modern UI
- **Backend**: Node.js API with authentication
- **Database**: PostgreSQL with proper schema
- **Authentication**: JWT-based user system
- **Docker Integration**: All services containerized

## Prerequisites
- Docker and Docker Compose installed ✅
- Project files in place ✅
- Port availability: 3000 (frontend), 8000 (backend), 5432 (database)

## Testing Steps

### Step 1: Start the Development Environment

```bash
# Option 1: Use the convenience script
./start-development.sh

# Option 2: Use Docker Compose directly
docker-compose -f docker-compose.dev.yml up --build
```

**What to expect:**
- All services will build and start
- You should see logs from frontend, backend, and database
- Initial setup might take 2-3 minutes

### Step 2: Verify Service Health

**Check service status:**
```bash
docker-compose -f docker-compose.dev.yml ps
```

**Expected output:** All services should show "Up" status

**Check logs if needed:**
```bash
# Frontend logs
docker-compose -f docker-compose.dev.yml logs frontend

# Backend logs
docker-compose -f docker-compose.dev.yml logs backend

# Database logs
docker-compose -f docker-compose.dev.yml logs postgres
```

### Step 3: Test Frontend Application

1. **Open browser to:** http://localhost:3000
2. **Expected behavior:**
   - Landing page loads with clean, modern design
   - Navigation menu is visible
   - No console errors in browser dev tools
   - Responsive design works on different screen sizes

**Test checklist:**
- [ ] Page loads without errors
- [ ] UI components render correctly
- [ ] Navigation menu works
- [ ] Responsive design functions
- [ ] No JavaScript errors in console

### Step 4: Test Backend API

**Basic health check:**
```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{"status": "OK", "timestamp": "..."}
```

**Test API endpoints:**
```bash
# Test user registration
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpass123"}'

# Test user login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

### Step 5: Test Database Connectivity

**Connect to database:**
```bash
# Access PostgreSQL container
docker-compose -f docker-compose.dev.yml exec postgres psql -U orcamentos_user -d orcamentos_db

# List tables
\dt

# Check users table
SELECT * FROM users;

# Exit
\q
```

### Step 6: Test User Authentication Flow

1. **Register a new user** through the frontend
2. **Login with the user** credentials
3. **Verify JWT token** is stored in browser
4. **Test protected routes** (if available)

### Step 7: Integration Testing

**Run our automated test suite:**
```bash
node test-phase1.js
```

This will test:
- Service connectivity
- API endpoints
- Database operations
- Authentication flow

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :5432
```

**Service not starting:**
```bash
# Rebuild containers
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build

# Check logs for errors
docker-compose -f docker-compose.dev.yml logs [service-name]
```

**Database connection issues:**
```bash
# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

## Success Criteria

✅ **Phase 1 is successful if:**
- All Docker containers start without errors
- Frontend loads and displays correctly
- Backend API responds to requests
- Database accepts connections and queries
- User can register and login
- No critical errors in any service logs

## Next Steps After Testing

Based on test results, we'll:
1. Fix any issues found during testing
2. Document lessons learned
3. Plan Phase 2 enhancements
4. Update our development workflow

## Getting Help

If you encounter issues:
1. Check the logs using the commands above
2. Review the troubleshooting section
3. Check that all required ports are available
4. Ensure Docker has sufficient resources allocated

---

**Remember:** This is Phase 1 - we're testing the foundation. Not everything needs to be perfect, but the core architecture should be solid and working.