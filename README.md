# Valund - Competence Marketplace Platform

A complete monorepo for a competence marketplace platform built with Django 5 backend and React frontend.

## Architecture

- **Backend**: Django 5 (ASGI) + DRF, PostgreSQL 16 via PgBouncer, Redis 7, Celery, Stripe Connect
- **Frontend**: Vite + React + TypeScript, Tailwind CSS
- **Edge**: NGINX reverse proxy
- **Infrastructure**: Docker Compose, Prometheus + Grafana monitoring, Sentry error tracking

## Features

### MVP Features
- **Accounts & Roles**: User management with freelancer, client, and admin roles
- **Competence Passport**: Document upload, review, and audit system
- **Search & Discovery**: Skills, location, and availability search with indexing and caching
- **Bookings**: Request, approval, and time tracking system
- **Payments**: Escrow system with Stripe Connect integration
- **Ratings**: Comprehensive rating and review system

### Core Functionality
- JWT-based authentication
- Role-based permissions
- File upload and management
- Real-time search with PostgreSQL full-text search
- Payment processing with escrow hold/release
- Background task processing with Celery
- Comprehensive audit logging

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Development Setup

1. **Clone and start services**:
   ```bash
   git clone <repository-url>
   cd valund
   docker-compose up -d
   ```

2. **Backend setup**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   
   # If running locally without Docker:
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

3. **Frontend setup**:
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with your configuration
   
   npm install
   npm run dev
   ```

### Docker Services

The application includes the following services:

- **postgres**: PostgreSQL 16 database
- **pgbouncer**: Connection pooler for PostgreSQL
- **redis**: Redis for caching and Celery message broker
- **backend**: Django application server
- **celery_worker**: Background task processor
- **celery_beat**: Periodic task scheduler
- **frontend**: React development server
- **nginx**: Reverse proxy and static file server
- **prometheus**: Metrics collection
- **grafana**: Monitoring dashboards

### API Documentation

When running, API documentation is available at:
- Swagger UI: http://localhost/api/schema/swagger-ui/
- ReDoc: http://localhost/api/schema/redoc/

### Monitoring

- Grafana dashboards: http://localhost:3001 (admin/admin)
- Prometheus metrics: http://localhost:9090

## Project Structure

```
valund/
├── backend/                 # Django backend
│   ├── accounts/           # User management
│   ├── competence/         # Document management
│   ├── search/             # Search functionality
│   ├── bookings/           # Booking system
│   ├── payments/           # Payment processing
│   ├── ratings/            # Rating system
│   └── valund/             # Project settings
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
├── docker/                 # Docker configuration
├── nginx/                  # NGINX configuration
├── monitoring/             # Monitoring configuration
└── docs/                   # Documentation

```

## Development Workflow

### Backend Development

1. **Create migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Run tests**:
   ```bash
   python manage.py test
   ```

3. **Create superuser**:
   ```bash
   python manage.py createsuperuser
   ```

### Frontend Development

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Build for production**:
   ```bash
   npm run build
   ```

3. **Run tests**:
   ```bash
   npm run test
   ```

## Environment Variables

### Backend (.env)
- `DEBUG`: Enable/disable debug mode
- `SECRET_KEY`: Django secret key
- `DATABASE_URL`: Database connection string
- `REDIS_URL`: Redis connection string
- `STRIPE_*`: Stripe API keys
- `SENTRY_DSN`: Sentry error tracking

### Frontend (.env.local)
- `VITE_API_URL`: Backend API URL
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

## Deployment

### Production Deployment

1. **Update environment variables** for production
2. **Build and deploy** with Docker Compose:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### Key Production Considerations

- Use PostgreSQL instead of SQLite
- Configure SSL certificates for NGINX
- Set up proper environment variables
- Configure backup strategies
- Set up monitoring and alerting
- Enable Sentry error tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please create an issue in the repository.