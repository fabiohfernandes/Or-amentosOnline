@echo off
REM ============================================================================
REM OrçamentosOnline - Start All Services Script (Windows)
REM ============================================================================
REM This script starts all Docker services for the OrçamentosOnline application
REM Created: September 2025
REM Usage: start-all.bat [profile]
REM   - No arguments: Starts core services (nginx, api, frontend, postgres, redis)
REM   - "dev": Includes development tools (adminer, redis-commander)
REM   - "monitoring": Includes monitoring stack (prometheus, grafana)
REM   - "full": Includes all services (dev + monitoring)

echo ============================================================================
echo OrçamentosOnline - Starting All Services
echo ============================================================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)

REM Get the profile parameter (default to empty for core services)
set PROFILE=%1

REM Set the appropriate Docker Compose command based on profile
if "%PROFILE%"=="dev" (
    echo Starting with DEVELOPMENT profile...
    echo This includes: Core services + Adminer + Redis Commander
    echo.
    docker-compose --profile development up -d
) else if "%PROFILE%"=="monitoring" (
    echo Starting with MONITORING profile...
    echo This includes: Core services + Prometheus + Grafana
    echo.
    docker-compose --profile monitoring up -d
) else if "%PROFILE%"=="full" (
    echo Starting with ALL profiles...
    echo This includes: All services (development + monitoring tools)
    echo.
    docker-compose --profile development --profile monitoring up -d
) else (
    echo Starting CORE services...
    echo This includes: nginx, api, frontend, postgres, redis
    echo.
    docker-compose up -d
)

REM Check if the command was successful
if errorlevel 1 (
    echo.
    echo ERROR: Failed to start services. Check the error messages above.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo Services started successfully!
echo ============================================================================

REM Show service status
echo.
echo Current service status:
docker-compose ps

echo.
echo ============================================================================
echo Service Access URLs:
echo ============================================================================
echo Frontend Application:    http://localhost:3001
echo Backend API:              http://localhost:3000
echo Database (PostgreSQL):    localhost:5432
echo Cache (Redis):            localhost:6379

if "%PROFILE%"=="dev" (
    echo.
    echo Development Tools:
    echo Database Admin (Adminer): http://localhost:8080
    echo Redis Admin:              http://localhost:8081
)

if "%PROFILE%"=="monitoring" (
    echo.
    echo Monitoring Tools:
    echo Prometheus:               http://localhost:9090
    echo Grafana:                  http://localhost:3030
)

if "%PROFILE%"=="full" (
    echo.
    echo Development Tools:
    echo Database Admin (Adminer): http://localhost:8080
    echo Redis Admin:              http://localhost:8081
    echo.
    echo Monitoring Tools:
    echo Prometheus:               http://localhost:9090
    echo Grafana:                  http://localhost:3030
)

echo.
echo ============================================================================
echo Usage Examples:
echo   start-all.bat           - Start core services only
echo   start-all.bat dev       - Start with development tools
echo   start-all.bat monitoring - Start with monitoring tools
echo   start-all.bat full      - Start all services
echo ============================================================================
echo.

REM Keep window open if double-clicked
if "%CMDCMDLINE:~0,4%" equ "cmd " pause