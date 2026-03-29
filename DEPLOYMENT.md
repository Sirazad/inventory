# Deployment Guide

> **🔒 For Private Deployments**: If you want to keep your code and deployment completely private (not accessible to others), please refer to [PRIVATE_DEPLOYMENT.md](PRIVATE_DEPLOYMENT.md) for detailed instructions on private repository settings, Docker image authentication, and secure deployment options.

## GitHub Actions CI/CD

This repository includes automated workflows for continuous integration and deployment:

### Workflows

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Triggers on: Pull requests and pushes to main/master branch
   - Actions:
     - Builds and tests the backend (Java 17, Maven)
     - Builds and tests the frontend (Node.js 18, npm)
     - Builds Docker images for both services

2. **CD Workflow** (`.github/workflows/cd.yml`)
   - Triggers on: Pushes to main/master branch, tags (v*), and releases
   - Actions:
     - Builds and publishes Docker images to GitHub Container Registry (ghcr.io)
     - Tags images with multiple strategies (branch name, SHA, version tags)
     - Images published to:
       - `ghcr.io/sirazad/inventory/backend:latest`
       - `ghcr.io/sirazad/inventory/frontend:latest`
     - **Note**: If your repository is private, the Docker images will be private by default and require authentication to pull. See [PRIVATE_DEPLOYMENT.md](PRIVATE_DEPLOYMENT.md) for details.

3. **Docker Compose Validation** (`.github/workflows/docker-compose.yml`)
   - Triggers on: Changes to docker-compose.yml or Dockerfiles
   - Actions:
     - Validates docker-compose.yml syntax
     - Builds all services
     - Starts the full stack and checks health

### Using Pre-built Docker Images from GitHub Container Registry

**For Private Deployments**: If you want to keep your code and deployment private, see the [PRIVATE_DEPLOYMENT.md](PRIVATE_DEPLOYMENT.md) guide for complete instructions on authentication and private deployment.

Instead of building locally, you can use the pre-built images:

```bash
# Pull the latest images
docker pull ghcr.io/sirazad/inventory/backend:latest
docker pull ghcr.io/sirazad/inventory/frontend:latest

# Use the repository's docker-compose.yml, but pull images instead of building
docker compose pull
docker compose up -d
```

To use specific versions or tags:

```bash
# Pull a specific version
docker pull ghcr.io/sirazad/inventory/backend:v1.0.0
docker pull ghcr.io/sirazad/inventory/frontend:v1.0.0

# Pull by commit SHA
docker pull ghcr.io/sirazad/inventory/backend:main-abc1234
docker pull ghcr.io/sirazad/inventory/frontend:main-abc1234
```

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
The frontend connects to the backend via the nginx proxy configuration.

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

Note: Update the API URL in `frontend/src/services/api.ts` if the backend is running on a different port.

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

### Using GitHub Container Registry Images

For production deployment using pre-built images from GitHub Container Registry:

1. **Pull the Images**
   ```bash
   docker pull ghcr.io/sirazad/inventory/backend:latest
   docker pull ghcr.io/sirazad/inventory/frontend:latest
   ```

2. **Create Production docker-compose.yml**
   ```yaml
   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: inventory
         POSTGRES_USER: ${DB_USER}
         POSTGRES_PASSWORD: ${DB_PASSWORD}
       volumes:
         - postgres-data:/var/lib/postgresql/data
     
     backend:
       image: ghcr.io/sirazad/inventory/backend:latest
       environment:
         SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/inventory
         SPRING_DATASOURCE_USERNAME: ${DB_USER}
         SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
       depends_on:
         - postgres
     
     frontend:
       image: ghcr.io/sirazad/inventory/frontend:latest
       ports:
         - "80:80"
       depends_on:
         - backend
   
   volumes:
     postgres-data:
   ```

3. **Set Environment Variables**
   Create a `.env` file:
   ```
   DB_USER=your_db_user
   DB_PASSWORD=your_secure_password
   ```

4. **Deploy**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

### GitHub Packages Authentication

If the images are private, authenticate with GitHub Container Registry:

```bash
# Create a personal access token with read:packages scope
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Then pull images
docker compose pull
```

### Best Practices for Production

1. Update JWT secret in `backend/src/main/resources/application.properties`
2. Use environment-specific configuration
3. Set up proper CORS origins
4. Use HTTPS with reverse proxy (nginx, Caddy)
5. Configure proper database with backups
6. Set up monitoring and logging
7. Use specific version tags instead of `latest`
8. Implement health checks
9. Set resource limits for containers
10. Use secrets management (Docker secrets, Kubernetes secrets)

## Security Considerations

- Change default database credentials
- Use strong JWT secret
- Enable HTTPS in production
- Implement rate limiting
- Regular security updates
- Database backups
- Keep Docker images updated
- Review GitHub security alerts for dependencies
