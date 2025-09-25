#!/bin/bash

# ============================================================================
# OrçamentosOnline - Start All Services Script (Linux/macOS/WSL)
# ============================================================================
# This script starts all Docker services for the OrçamentosOnline application
# Created: September 2025
# Usage: ./start-all.sh [profile]
#   - No arguments: Starts core services (nginx, api, frontend, postgres, redis)
#   - "dev": Includes development tools (adminer, redis-commander)
#   - "monitoring": Includes monitoring stack (prometheus, grafana)
#   - "full": Includes all services (dev + monitoring)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}OrçamentosOnline - Starting All Services${NC}"
echo -e "${CYAN}============================================================================${NC}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker is not running. Please start Docker first.${NC}"
    echo
    exit 1
fi

# Get the profile parameter (default to empty for core services)
PROFILE=$1

# Function to show service URLs
show_urls() {
    echo
    echo -e "${CYAN}============================================================================${NC}"
    echo -e "${CYAN}Service Access URLs:${NC}"
    echo -e "${CYAN}============================================================================${NC}"
    echo -e "${GREEN}Frontend Application:${NC}    http://localhost:3001"
    echo -e "${GREEN}Backend API:${NC}              http://localhost:3000"
    echo -e "${GREEN}Database (PostgreSQL):${NC}    localhost:5432"
    echo -e "${GREEN}Cache (Redis):${NC}            localhost:6379"

    if [[ "$PROFILE" == "dev" ]] || [[ "$PROFILE" == "full" ]]; then
        echo
        echo -e "${YELLOW}Development Tools:${NC}"
        echo -e "${GREEN}Database Admin (Adminer):${NC} http://localhost:8080"
        echo -e "${GREEN}Redis Admin:${NC}              http://localhost:8081"
    fi

    if [[ "$PROFILE" == "monitoring" ]] || [[ "$PROFILE" == "full" ]]; then
        echo
        echo -e "${YELLOW}Monitoring Tools:${NC}"
        echo -e "${GREEN}Prometheus:${NC}               http://localhost:9090"
        echo -e "${GREEN}Grafana:${NC}                  http://localhost:3030"
    fi
}

# Set the appropriate Docker Compose command based on profile
case "$PROFILE" in
    "dev")
        echo -e "${YELLOW}Starting with DEVELOPMENT profile...${NC}"
        echo -e "This includes: Core services + Adminer + Redis Commander"
        echo
        docker-compose --profile development up -d
        ;;
    "monitoring")
        echo -e "${YELLOW}Starting with MONITORING profile...${NC}"
        echo -e "This includes: Core services + Prometheus + Grafana"
        echo
        docker-compose --profile monitoring up -d
        ;;
    "full")
        echo -e "${YELLOW}Starting with ALL profiles...${NC}"
        echo -e "This includes: All services (development + monitoring tools)"
        echo
        docker-compose --profile development --profile monitoring up -d
        ;;
    *)
        echo -e "${YELLOW}Starting CORE services...${NC}"
        echo -e "This includes: nginx, api, frontend, postgres, redis"
        echo
        docker-compose up -d
        ;;
esac

# Check if the command was successful
if [ $? -ne 0 ]; then
    echo
    echo -e "${RED}ERROR: Failed to start services. Check the error messages above.${NC}"
    echo
    exit 1
fi

echo
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}Services started successfully!${NC}"
echo -e "${GREEN}============================================================================${NC}"

# Show service status
echo
echo -e "${BLUE}Current service status:${NC}"
docker-compose ps

# Show service URLs
show_urls

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}Usage Examples:${NC}"
echo -e "${CYAN}============================================================================${NC}"
echo -e "${GREEN}  ./start-all.sh${NC}           - Start core services only"
echo -e "${GREEN}  ./start-all.sh dev${NC}       - Start with development tools"
echo -e "${GREEN}  ./start-all.sh monitoring${NC} - Start with monitoring tools"
echo -e "${GREEN}  ./start-all.sh full${NC}      - Start all services"
echo -e "${CYAN}============================================================================${NC}"
echo