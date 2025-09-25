@echo off
REM OrçamentosOnline Phase 1 Testing Startup Script
REM CRONOS Agent - Development Environment Management

echo =====================================
echo  OrçamentosOnline Phase 1 Testing
echo =====================================
echo.

echo 🔧 Checking prerequisites...

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running or not installed
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)
echo ✅ Docker is running

REM Check if ports are available
netstat -an | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo ⚠️  Port 3000 is in use - API service may conflict
)

netstat -an | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo ⚠️  Port 3001 is in use - Frontend service may conflict
)

echo.
echo 🚀 Starting OrçamentosOnline services...

REM Stop any existing containers
docker-compose down >nul 2>&1

REM Start services in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start services
    echo Check Docker logs for details
    pause
    exit /b 1
)

echo ✅ Services started successfully

echo.
echo ⏳ Waiting for services to initialize...
echo    Database: ~30 seconds
echo    Redis: ~10 seconds
echo    API: ~60 seconds
echo    Frontend: ~90 seconds

REM Wait for services to be ready
timeout /t 30 /nobreak >nul
echo    🔄 30 seconds elapsed...

timeout /t 30 /nobreak >nul
echo    🔄 60 seconds elapsed...

timeout /t 30 /nobreak >nul
echo    🔄 90 seconds elapsed...

echo.
echo 🧪 Running automated tests...

node test-phase1.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ Phase 1 testing completed successfully!
    echo.
    echo 🔗 Access your application:
    echo    Frontend: http://localhost:3001
    echo    API Docs: http://localhost:3000/api/v1
    echo    Database: http://localhost:8080
    echo    Redis: http://localhost:8081
    echo.
    echo 🔑 Demo credentials:
    echo    Email: demo@orcamentos.com
    echo    Password: demo123
    echo.
    echo 📋 Ready for manual testing!
) else (
    echo.
    echo ❌ Some tests failed - check output above
    echo Services are still running for manual debugging
)

echo.
echo Press any key to continue...
pause >nul