# Deployment Guide

## Quick Start with Docker

The easiest way to run the inventory management system is using Docker Compose:

```bash
# Build and start all services
docker compose up --build

# Or run in detached mode
docker compose up -d --build
```

This will:
1. Start PostgreSQL database on port 5432
2. Build and start the backend on port 8080
3. Build and start the frontend on port 3000

Access the application at: http://localhost:3000

## Stopping the Application

```bash
# Stop all services
docker compose down

# Stop and remove all data
docker compose down -v
```

## Environment Variables

### Backend (backend/src/main/resources/application.properties)
- `SPRING_DATASOURCE_URL`: PostgreSQL connection URL
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password
- `jwt.secret`: Secret key for JWT token generation
- `jwt.expiration`: Token expiration time in milliseconds

### Frontend
The frontend connects to the backend via:
- **Docker Compose**: nginx proxy configuration (see `frontend/nginx.conf`) - uses relative `/api` path
- **Individual Service Deployment** (e.g., Zeabur): Set `REACT_APP_API_URL` environment variable to your backend URL
- **Local Development**: Create React App proxy (see `proxy` setting in `frontend/package.json`)

#### Frontend Environment Variables
- `REACT_APP_API_URL`: (Optional) Full backend API URL including protocol and path
  - If not set: Uses relative `/api` path (suitable for Docker Compose with nginx proxy)
  - If set: Uses the specified URL (e.g., `https://your-backend.zeabur.app/api` for individual deployment)

See `frontend/.env.example` for configuration examples.

## Manual Development Setup

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- Node.js 18+
- PostgreSQL 15+

### Backend Setup

1. Install PostgreSQL and create database:
```sql
CREATE DATABASE inventory;
CREATE USER inventory WITH PASSWORD 'inventory123';
GRANT ALL PRIVILEGES ON DATABASE inventory TO inventory;
```

2. Run the backend:
```bash
cd backend
mvn spring-boot:run
```

Backend will be available at http://localhost:8080

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

Frontend will be available at http://localhost:3000

Note: The frontend is configured to proxy API requests to `http://localhost:8080` via the `proxy` setting in `package.json`. If your backend runs on a different port, update the `proxy` value in `frontend/package.json`.

## Testing the Application

### 1. User Registration
- Navigate to http://localhost:3000
- Click "Register"
- Create an account with username, email, and password

### 2. Character Management
- After login, you'll see the Characters page
- Add a new character
- Click "View Inventory" to manage character items

### 3. Inventory Management
- Add items with required fields (category, item, description, quantity)
- Use filters to search items
- Edit or remove items as needed

## Troubleshooting

### Port Conflicts
If you have services already running on ports 3000, 8080, or 5432:

```bash
# Check what's using the port
lsof -i :3000
lsof -i :8080
lsof -i :5432

# Kill the process or modify docker-compose.yml to use different ports
```

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in application.properties
- Verify network connectivity between containers

### Build Failures
```bash
# Clean and rebuild
docker compose down
docker compose build --no-cache
docker compose up
```

## Production Deployment

### Docker Compose Deployment

For production deployment with Docker Compose:

1. Update JWT secret in `backend/src/main/resources/application.properties`
2. Use environment-specific configuration
3. Set up proper CORS origins
4. Use HTTPS
5. Configure proper database with backups
6. Set up monitoring and logging

### Individual Service Deployment (Zeabur, Railway, etc.)

When deploying services individually on platforms like Zeabur:

#### Backend Deployment
1. Deploy the backend service first
2. Note the backend's public URL (e.g., `https://inventory-backend.zeabur.app`)
3. Configure database connection via environment variables
4. Update CORS settings to allow your frontend domain

#### Frontend Deployment
1. Set the `REACT_APP_API_URL` build argument/environment variable:
   ```bash
   # For Zeabur, Railway, or similar platforms
   REACT_APP_API_URL=https://your-backend-url.zeabur.app/api
   ```
2. Build the frontend with this environment variable:
   ```bash
   docker build --build-arg REACT_APP_API_URL=https://your-backend-url.zeabur.app/api -t frontend .
   ```
3. Deploy the built image

**Note**: With individual deployment, the nginx proxy in `frontend/nginx.conf` won't be used for backend communication since the frontend will connect directly to the backend's public URL. The nginx server only serves static files in this scenario.

## Security Considerations

- Change default database credentials
- Use strong JWT secret
- Enable HTTPS in production
- Implement rate limiting
- Regular security updates
- Database backups
