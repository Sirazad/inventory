# Inventory Management System

[![CI](https://github.com/Sirazad/inventory/actions/workflows/ci.yml/badge.svg)](https://github.com/Sirazad/inventory/actions/workflows/ci.yml)
[![CD - Publish Docker Images](https://github.com/Sirazad/inventory/actions/workflows/cd.yml/badge.svg)](https://github.com/Sirazad/inventory/actions/workflows/cd.yml)
[![Docker Compose Validation](https://github.com/Sirazad/inventory/actions/workflows/docker-compose.yml/badge.svg)](https://github.com/Sirazad/inventory/actions/workflows/docker-compose.yml)

A full-stack inventory management application with TypeScript React frontend and Java Spring Boot backend, all containerized with Docker.

## Features

### Authentication
- User registration with email validation
- Login with JWT token authentication
- Account deletion with password confirmation

### Character Management
- Create multiple characters per account
- View list of all characters
- Delete characters (cascades to their inventory)

### Inventory System
Each character has their own inventory with the following features:
- **Required fields**: Category, Item, Description, Quantity
- **Optional fields**: Quality, Price (in fantasy currency: gold/silver/copper), Weight (kg per item), Added/Updated notes
- **Soft delete**: Items are marked as removed and kept in database with removal reason
- **Filtering**: Filter by category, minimum price (in copper), and maximum weight (kg per item)

## Tech Stack

### Frontend
- TypeScript
- React 18
- React Router for navigation
- Axios for API calls
- Responsive design with inline styles

### Backend
- Java 17
- Spring Boot 3.2
- Spring Security with JWT
- Spring Data JPA
- PostgreSQL database
- Maven

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 15
- Nginx (for frontend serving)

## Getting Started

### Prerequisites
- Docker
- Docker Compose

### Running the Application

1. Clone the repository:
```bash
git clone https://github.com/Sirazad/inventory.git
cd inventory
```

2. Start all services with Docker Compose:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### First Time Setup

1. Navigate to http://localhost:3000
2. Click "Register" to create a new account
3. Enter username, email, and password (min 6 characters)
4. You'll be automatically logged in and redirected to the Characters page

## Usage

### Managing Characters
1. From the Characters page, enter a character name and click "Add Character"
2. Click "View Inventory" to manage that character's items
3. Click "Delete" to remove a character (this also removes their inventory)

### Managing Inventory
1. Click "Add New Item" to open the form
2. Fill in required fields (marked with *)
3. Click "Add Item" to save
4. Use the filter section to find specific items
5. Click "Edit" to modify an item
6. Click "Remove" to soft-delete an item (you'll be prompted for a reason)

### Account Management
1. Click "Delete Account" button on the Characters page
2. Confirm with your password
3. Your account and all associated data will be permanently deleted

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `DELETE /api/auth/account` - Delete account

### Characters
- `GET /api/characters` - Get user's characters
- `POST /api/characters` - Create character
- `DELETE /api/characters/{id}` - Delete character

### Inventory
- `GET /api/characters/{characterId}/inventory` - Get inventory (supports filtering)
- `POST /api/characters/{characterId}/inventory` - Create inventory item
- `PUT /api/characters/{characterId}/inventory/{inventoryId}` - Update item
- `DELETE /api/characters/{characterId}/inventory/{inventoryId}` - Remove item (soft delete)

## Development

### Running Backend Locally
```bash
cd backend
mvn spring-boot:run
```

### Running Frontend Locally
```bash
cd frontend
npm install
npm start
```

### Database
The PostgreSQL database is automatically initialized with the required schema through Spring Data JPA.

## Deployment

> **🔒 Private Deployment?** If you want to keep your deployment completely private and restrict access, see [PRIVATE_DEPLOYMENT.md](PRIVATE_DEPLOYMENT.md) for authentication, firewall configuration, and secure deployment options.

### Using Pre-built Docker Images

Docker images are automatically built and published to GitHub Container Registry on every push to the main branch.

Pull and run the latest images:

```bash
# Pull the images (requires authentication if repository is private)
docker pull ghcr.io/sirazad/inventory/backend:latest
docker pull ghcr.io/sirazad/inventory/frontend:latest

# Create a custom docker-compose.yml or use the one from the repository
docker compose up -d
```

For detailed deployment options, see [DEPLOYMENT.md](DEPLOYMENT.md).

### CI/CD Workflows

This repository includes GitHub Actions workflows for:

- **CI**: Builds and tests both frontend and backend on every pull request
- **CD**: Publishes Docker images to GitHub Container Registry on pushes to main branch
- **Docker Compose Validation**: Validates the full stack deployment

## Security
- Passwords are encrypted using BCrypt
- JWT tokens for stateless authentication
- CORS configured for frontend-backend communication
- All authenticated endpoints require valid JWT token

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our development workflow, coding standards, and how to submit pull requests.

For information about GitHub Actions workflows, see [.github/WORKFLOWS.md](.github/WORKFLOWS.md).

## License
This project is open source and available under the MIT License.