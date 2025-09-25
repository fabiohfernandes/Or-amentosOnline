@echo off
REM ============================================================================
REM OrçamentosOnline - Stop All Services Script (Windows)
REM ============================================================================
REM This script stops all Docker services for the OrçamentosOnline application
REM Created: September 2025
REM Usage: stop-all.bat [option]
REM   - No arguments: Stop and remove containers, keep networks and volumes
REM   - "clean": Stop containers and remove networks (keeps volumes for data persistence)
REM   - "purge": Stop and remove everything including volumes (DESTROYS DATA!)

echo ============================================================================
echo OrçamentosOnline - Stopping All Services
echo ============================================================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Cannot stop services.
    echo.
    pause
    exit /b 1
)

REM Get the option parameter
set OPTION=%1

REM Show current running services
echo Current running services:
docker-compose ps
echo.

if "%OPTION%"=="clean" (
    echo Stopping services and removing networks...
    echo WARNING: This will remove custom networks but preserve data volumes.
    echo.
    set /p CONFIRM=Are you sure? [y/N]:
    if /i "!CONFIRM!" neq "y" (
        echo Operation cancelled.
        goto :end
    )
    echo.
    echo Stopping and removing containers and networks...
    docker-compose down --remove-orphans

) else if "%OPTION%"=="purge" (
    echo.
    echo ============================================================================
    echo WARNING: DESTRUCTIVE OPERATION!
    echo ============================================================================
    echo This will PERMANENTLY DELETE all data including:
    echo - Database data ^(PostgreSQL^)
    echo - Cache data ^(Redis^)
    echo - Upload files
    echo - SSL certificates
    echo.
    echo THIS CANNOT BE UNDONE!
    echo ============================================================================
    echo.
    set /p CONFIRM=Type 'DELETE' to confirm PERMANENT data deletion:
    if /i "!CONFIRM!" neq "DELETE" (
        echo Operation cancelled. Data preserved.
        goto :end
    )
    echo.
    echo Stopping and removing containers, networks, and volumes...
    docker-compose down --volumes --remove-orphans
    echo.
    echo Removing any remaining orphaned volumes...
    for /f %%i in ('docker volume ls -q -f "name=orcamentosOnline"') do docker volume rm %%i 2>nul

) else (
    echo Stopping services ^(keeping networks and volumes^)...
    echo This preserves all data and network configurations.
    echo.
    docker-compose down
)

REM Check if the command was successful
if errorlevel 1 (
    echo.
    echo ERROR: Failed to stop services. Check the error messages above.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo Services stopped successfully!
echo ============================================================================

REM Show remaining containers (should be none for this project)
echo.
echo Checking for remaining containers...
for /f %%i in ('docker ps -q --filter "label=com.docker.compose.project=orcamentosOnline"') do (
    echo WARNING: Some containers are still running:
    docker ps --filter "label=com.docker.compose.project=orcamentosOnline"
    goto :show_usage
)

echo All OrçamentosOnline containers stopped.

:show_usage
echo.
echo ============================================================================
echo Usage Examples:
echo   stop-all.bat        - Stop services ^(keep data and networks^)
echo   stop-all.bat clean  - Stop services and remove networks
echo   stop-all.bat purge  - Stop and DELETE ALL DATA ^(destructive!^)
echo ============================================================================
echo.
echo To start services again, use:
echo   start-all.bat       - Start core services
echo   start-all.bat dev   - Start with development tools
echo   start-all.bat full  - Start all services

:end
echo.

REM Keep window open if double-clicked
if "%CMDCMDLINE:~0,4%" equ "cmd " pause