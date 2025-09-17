#!/bin/bash

# Quick setup script for Valund application
echo "🚀 Valund Quick Setup"
echo "===================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend environment file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your actual configuration"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Creating frontend environment file..."
    cp frontend/.env.example frontend/.env.local
    echo "⚠️  Please edit frontend/.env.local with your actual configuration"
fi

# Build and start services
echo "🐳 Building and starting Docker services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Application URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - Admin Panel: http://localhost:8000/admin"
echo "   - API Documentation: http://localhost:8000/api/schema/swagger-ui/"
echo "   - Grafana Monitoring: http://localhost:3001 (admin/admin)"
echo "   - Prometheus: http://localhost:9090"
echo ""
echo "📖 Next Steps:"
echo "1. Create a superuser: docker-compose exec backend python manage.py createsuperuser"
echo "2. Access the admin panel and create some initial data"
echo "3. Start developing!"
echo ""
echo "🛠️  Useful Commands:"
echo "   - View logs: docker-compose logs -f [service_name]"
echo "   - Stop services: docker-compose down"
echo "   - Restart: docker-compose restart [service_name]"
echo "   - Run Django commands: docker-compose exec backend python manage.py [command]"