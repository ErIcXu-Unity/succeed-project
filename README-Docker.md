# Docker Setup Guide for Escape Room Project

This comprehensive guide covers Docker setup, usage, and deployment for the Escape Room educational platform.

## Docker Files Overview

### Main Docker Files
- `Dockerfile` - Multi-stage build for frontend (development + production)
- `Dockerfile.dev` - Optimized development-only frontend
- `backend/Dockerfile` - Python Flask backend
- `docker-compose.yml` - Orchestrates all services
- `nginx.conf` - Production nginx configuration

## Quick Start Commands

### Production Mode (Default)
```bash
# Build and start all services in production
docker compose up --build

# Run in background
docker compose up -d --build
```
**Access**: http://localhost (nginx-served React build)

### Development Mode 
```bash
# Start with development frontend (hot reload)
docker compose --profile dev up --build

# Alternative development setup
docker compose --profile dev-alt up --build
```
**Access**: http://localhost:3000 (React dev server)

### Mixed Mode (Recommended for Development)
```bash
# Backend & Database in Docker, Frontend locally
docker compose up db backend -d
npm start  # Run locally on port 3000
```

## Available Services & Ports

| Service | Port | Description | Mode |
|---------|------|-------------|------|
| frontend | 80 | Production React (nginx) | Production |
| frontend-dev | 3000 | Development React server | Development |
| frontend-dev-alt | 3001 | Alternative dev React | Development |
| backend | 5001 | Flask API server | Both |
| db | 5433 | PostgreSQL database | Both |

## Docker Commands Reference

### Basic Operations
```bash
# Start all services
docker compose up

# Start specific services
docker compose up db backend

# Start with profiles
docker compose --profile dev up

# Build and start
docker compose up --build

# Run in background
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v
```

### Monitoring & Debugging
```bash
# View logs for all services
docker compose logs

# View logs for specific service
docker compose logs frontend
docker compose logs backend -f  # follow mode

# Check running containers
docker compose ps
docker ps

# Execute commands in containers
docker compose exec backend bash
docker compose exec db psql -U postgres -d escape_room

# Check container resource usage
docker stats
```

### Building & Images
```bash
# Build specific service
docker compose build frontend

# Rebuild without cache
docker compose build --no-cache

# List images
docker images

# Remove unused images
docker image prune

# Remove all containers and images
docker system prune -a
```

## Dockerfile Usage Examples

### Building Frontend Manually

**Development build:**
```bash
# Build development image
docker build --target development -t escape-room-frontend:dev .

# Run development container
docker run -p 3000:3000 -v $(pwd):/app escape-room-frontend:dev
```

**Production build:**
```bash
# Build production image
docker build --target production -t escape-room-frontend:prod .

# Run production container
docker run -p 80:80 escape-room-frontend:prod
```

### Building Backend Manually
```bash
# Build backend image
docker build -t escape-room-backend ./backend

# Run backend container
docker run -p 5001:5001 \
  -e DATABASE_URL=postgresql://postgres:123456@host.docker.internal:5433/escape_room \
  escape-room-backend
```

## Development Workflows

### Frontend Development
```bash
# Option 1: Use Docker dev mode
docker compose --profile dev up frontend-dev

# Option 2: Use separate dev Dockerfile
docker build -f Dockerfile.dev -t frontend-dev .
docker run -p 3000:3000 -v $(pwd):/app frontend-dev

# Option 3: Mixed approach (recommended)
docker compose up db backend -d
npm start
```

### Backend Development
```bash
# Start only database
docker compose up db -d

# Run backend with auto-reload
cd backend
source venv/bin/activate
export DATABASE_URL=postgresql://postgres:123456@localhost:5433/escape_room
python app.py
```

### Full Stack Development
```bash
# All services with hot reload
docker compose --profile dev up

# Database + Backend in Docker, Frontend locally
docker compose up db backend -d
npm start
```

## Environment Configuration

### Environment Variables
Create `.env` files for configuration:

**Root `.env`:**
```bash
COMPOSE_PROJECT_NAME=escape-room
REACT_APP_BACKEND_URL=http://localhost:5001
```

**Backend `.env`:**
```bash
DATABASE_URL=postgresql://postgres:123456@db:5432/escape_room
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key
```

### Production Environment
```bash
# Set production environment
export NODE_ENV=production
export FLASK_ENV=production

# Use production docker-compose
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## Troubleshooting Guide

### Common Issues & Solutions

**Port Conflicts:**
```bash
# Check what's using a port
lsof -i :5001
lsof -i :3000

# Use different ports
docker compose up -d  # Uses 5433 for postgres instead of 5432
```

**Database Connection Issues:**
```bash
# Wait for database to be ready
docker compose exec backend python -c "
from app import create_app
from models import db
app = create_app()
with app.app_context():
    db.create_all()
    print('Database ready!')
"
```

**Volume Permission Issues:**
```bash
# Fix permissions
sudo chown -R $USER:$USER .
docker compose down -v  # Remove volumes
docker compose up --build
```

**Frontend Not Updating:**
```bash
# Clear Docker build cache
docker builder prune

# Rebuild without cache
docker compose build --no-cache frontend-dev

# Check if files are mounted correctly
docker compose exec frontend-dev ls -la /app
```

**Backend Import Errors:**
```bash
# Check Python path
docker compose exec backend python -c "import sys; print(sys.path)"

# Reinstall dependencies
docker compose exec backend pip install -r requirements.txt
```

### Performance Issues

**Slow Build Times:**
```bash
# Use .dockerignore to exclude unnecessary files
echo "node_modules
.git
*.log" > .dockerignore

# Use multi-stage builds (already implemented)
# Enable BuildKit
export DOCKER_BUILDKIT=1
```

**Container Resource Usage:**
```bash
# Monitor resource usage
docker stats

# Limit container resources
docker compose up -d --scale frontend-dev=1 --memory="512m" --cpus="0.5"
```

## Security Best Practices

### Production Deployment
```bash
# Use non-root user (already implemented in Dockerfile)
# Set proper environment variables
# Use secrets instead of environment variables for sensitive data

# Create Docker secrets
echo "your-secret-password" | docker secret create db_password -

# Update docker-compose for secrets
services:
  db:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
```

### Health Checks
Health checks are already configured:
```bash
# Check health status
docker compose ps
docker inspect --format='{{.State.Health.Status}}' <container_id>

# Custom health check
curl http://localhost/health
curl http://localhost:3000  # Frontend dev server
```

## Testing with Docker

### Running Tests
```bash
# Frontend tests
docker compose exec frontend-dev npm test

# Backend tests
docker compose exec backend python -m pytest

# Run tests in separate containers
docker compose -f docker-compose.test.yml up --build
```

## Deployment

### Production Deployment
```bash
# Build production images
docker compose build

# Start production services
docker compose up -d

# Verify deployment
curl http://localhost/health
curl http://localhost:5001/
```

### Using Docker Registry
```bash
# Tag images
docker tag escape-room-frontend:latest your-registry/escape-room-frontend:latest

# Push to registry
docker push your-registry/escape-room-frontend:latest

# Pull on production server
docker pull your-registry/escape-room-frontend:latest
```

## Quick Reference

### Test Accounts
- Teacher: `teacher@unsw.edu.au` / `123456`
- Student: `1234567@stu.com` / (check database)

### Default URLs
- Production: http://localhost
- Development: http://localhost:3000  
- Backend API: http://localhost:5001
- Database: localhost:5433 (PostgreSQL: postgres/123456)

### Essential Commands
```bash
# Start all services (production)
docker compose up -d --build

# Start development mode
docker compose --profile dev up -d --build

# Mixed development (recommended)
docker compose up db backend -d
npm start

# Check status
docker compose ps
docker compose logs backend

# Stop everything
docker compose down

# Stop and delete data (WARNING)
docker compose down -v

# Database shell
docker compose exec db psql -U postgres -d escape_room
```

### Common Issues

**Port conflicts**
```bash
lsof -i :80    # Check what's using port 80
lsof -i :3000  # Check what's using port 3000
```

**Container won't start**
```bash
docker compose logs <service-name>  # Check logs
docker compose down && docker compose up --build
```

**Fresh database needed**
```bash
docker compose down -v  # WARNING: Deletes all data
docker compose up -d
```

### Health Checks
- Frontend health: http://localhost/health
- Backend API: http://localhost:5001
- Development frontend: http://localhost:3000