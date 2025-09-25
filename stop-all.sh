#!/bin/bash

# ============================================================================
# OrçamentosOnline - Stop All Services Script (Linux/macOS/WSL)
# ============================================================================
# This script stops all Docker services for the OrçamentosOnline application
# Created: September 2025
# Usage: ./stop-all.sh [option]
#   - No arguments: Stop and remove containers, keep networks and volumes
#   - "clean": Stop containers and remove networks (keeps volumes for data persistence)
#   - "purge": Stop and remove everything including volumes (DESTROYS DATA!)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}OrçamentosOnline - Stopping All Services${NC}"
echo -e "${CYAN}============================================================================${NC}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker is not running. Cannot stop services.${NC}"
    echo
    exit 1
fi

# Get the option parameter
OPTION=$1

# Show current running services
echo -e "${BLUE}Current running services:${NC}"
docker-compose ps
echo

case "$OPTION" in
    "clean")
        echo -e "${YELLOW}Stopping services and removing networks...${NC}"
        echo -e "${YELLOW}WARNING: This will remove custom networks but preserve data volumes.${NC}"
        echo
        read -p "Are you sure? [y/N]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}Operation cancelled.${NC}"
            exit 0
        fi
        echo
        echo -e "${BLUE}Stopping and removing containers and networks...${NC}"
        docker-compose down --remove-orphans
        ;;

    "purge")
        echo
        echo -e "${RED}============================================================================${NC}"
        echo -e "${RED}WARNING: DESTRUCTIVE OPERATION!${NC}"
        echo -e "${RED}============================================================================${NC}"
        echo -e "${RED}This will PERMANENTLY DELETE all data including:${NC}"
        echo -e "${RED}- Database data (PostgreSQL)${NC}"
        echo -e "${RED}- Cache data (Redis)${NC}"
        echo -e "${RED}- Upload files${NC}"
        echo -e "${RED}- SSL certificates${NC}"
        echo
        echo -e "${RED}THIS CANNOT BE UNDONE!${NC}"
        echo -e "${RED}============================================================================${NC}"
        echo
        read -p "Type 'DELETE' to confirm PERMANENT data deletion: " CONFIRM
        if [ "$CONFIRM" != "DELETE" ]; then
            echo -e "${GREEN}Operation cancelled. Data preserved.${NC}"
            exit 0
        fi
        echo
        echo -e "${BLUE}Stopping and removing containers, networks, and volumes...${NC}"
        docker-compose down --volumes --remove-orphans
        echo
        echo -e "${BLUE}Removing any remaining orphaned volumes...${NC}"
        docker volume ls -q -f "name=orcamentosOnline" | xargs -r docker volume rm 2>/dev/null || true
        ;;

    *)
        echo -e "${BLUE}Stopping services (keeping networks and volumes)...${NC}"
        echo -e "This preserves all data and network configurations."
        echo
        docker-compose down
        ;;
esac

# Check if the command was successful
if [ $? -ne 0 ]; then
    echo
    echo -e "${RED}ERROR: Failed to stop services. Check the error messages above.${NC}"
    echo
    exit 1
fi

echo
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}Services stopped successfully!${NC}"
echo -e "${GREEN}============================================================================${NC}"

# Show remaining containers (should be none for this project)
echo
echo -e "${BLUE}Checking for remaining containers...${NC}"
REMAINING=$(docker ps -q --filter "label=com.docker.compose.project=orcamentosOnline" | wc -l)

if [ $REMAINING -gt 0 ]; then
    echo -e "${YELLOW}WARNING: Some containers are still running:${NC}"
    docker ps --filter "label=com.docker.compose.project=orcamentosOnline"
else
    echo -e "${GREEN}All OrçamentosOnline containers stopped.${NC}"
fi

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}Usage Examples:${NC}"
echo -e "${CYAN}============================================================================${NC}"
echo -e "${GREEN}  ./stop-all.sh${NC}        - Stop services (keep data and networks)"
echo -e "${GREEN}  ./stop-all.sh clean${NC}  - Stop services and remove networks"
echo -e "${GREEN}  ./stop-all.sh purge${NC}  - Stop and DELETE ALL DATA (destructive!)"
echo -e "${CYAN}============================================================================${NC}"
echo
echo -e "${BLUE}To start services again, use:${NC}"
echo -e "${GREEN}  ./start-all.sh${NC}       - Start core services"
echo -e "${GREEN}  ./start-all.sh dev${NC}   - Start with development tools"
echo -e "${GREEN}  ./start-all.sh full${NC}  - Start all services"
echo