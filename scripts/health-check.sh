#!/bin/bash

# Health check script for Valund application
echo "🔍 Valund Health Check"
echo "====================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

echo "✅ Docker is running"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found"
    exit 1
fi

echo "✅ Docker Compose configuration found"

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found"
    exit 1
fi

echo "✅ Backend directory found"

# Check if frontend directory exists  
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found"
    exit 1
fi

echo "✅ Frontend directory found"

# Check if main Django files exist
if [ ! -f "backend/manage.py" ]; then
    echo "❌ Django manage.py not found"
    exit 1
fi

echo "✅ Django project structure found"

# Check if main React files exist
if [ ! -f "frontend/package.json" ]; then
    echo "❌ React package.json not found"
    exit 1
fi

echo "✅ React project structure found"

# Check if environment example files exist
if [ ! -f "backend/.env.example" ]; then
    echo "❌ Backend .env.example not found"
    exit 1
fi

if [ ! -f "frontend/.env.example" ]; then
    echo "❌ Frontend .env.example not found"
    exit 1
fi

echo "✅ Environment configuration files found"

echo ""
echo "🎉 All health checks passed!"
echo ""
echo "📋 Next Steps:"
echo "1. Copy environment files:"
echo "   cp backend/.env.example backend/.env"
echo "   cp frontend/.env.example frontend/.env.local"
echo ""
echo "2. Start services:"
echo "   docker-compose up -d"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:8000"
echo "   - Admin: http://localhost:8000/admin"
echo "   - API Docs: http://localhost:8000/api/schema/swagger-ui/"
echo "   - Monitoring: http://localhost:3001 (Grafana)"
echo ""
echo "4. For local development:"
echo "   cd backend && python manage.py migrate"
echo "   cd frontend && npm install && npm run dev"