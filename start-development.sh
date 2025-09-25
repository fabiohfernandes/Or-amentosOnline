#!/bin/bash

# OrçamentosOnline - Development Environment Startup Script
# Following CLAUDE.md guidelines: ALL SERVICES MUST BE CONTAINERIZED

echo "🚀 Starting OrçamentosOnline Development Environment..."
echo "📋 Following Vibe Coding methodology with Docker containerization"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Clean up any existing containers
echo "🧹 Cleaning up previous containers..."
docker-compose down --remove-orphans

# Build and start all services
echo "🏗️  Building and starting all containerized services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check Database
if docker-compose exec -T database pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database (PostgreSQL) is ready"
else
    echo "❌ Database is not ready"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Cache (Redis) is ready"
else
    echo "❌ Cache is not ready"
fi

# Check Backend API
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend API is ready"
else
    echo "❌ Backend API is not ready"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is ready"
else
    echo "❌ Frontend is not ready"
fi

echo ""
echo "🎉 OrçamentosOnline Development Environment Started!"
echo ""
echo "📱 Frontend:  http://localhost:3000"
echo "🔧 Backend:   http://localhost:3001"
echo "🗄️  Database: localhost:5432 (postgres/postgres123)"
echo "⚡ Cache:     localhost:6379"
echo ""
echo "📝 To view logs: docker-compose logs -f [service-name]"
echo "🛑 To stop:     docker-compose down"
echo ""
echo "✨ Ready for testing following Vibe Coding principles!"