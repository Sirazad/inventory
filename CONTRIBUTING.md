# Contributing to Inventory Management System

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/inventory.git
   cd inventory
   ```
3. **Set up the development environment**:
   ```bash
   docker compose up --build
   ```

## Development Workflow

### Making Changes

1. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards:
   - **Backend**: Follow Java coding conventions, use meaningful variable names
   - **Frontend**: Follow TypeScript and React best practices
   - **Write tests** for new functionality
   - **Update documentation** if needed

3. **Test your changes**:
   ```bash
   # Test backend
   cd backend
   mvn test
   
   # Test frontend
   cd frontend
   npm test
   
   # Test full stack
   docker compose up --build
   ```

4. **Commit your changes** with a descriptive message:
   ```bash
   git add .
   git commit -m "Add feature: description of your changes"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

### Pull Request Process

1. **Ensure all CI checks pass**:
   - Backend builds and tests pass
   - Frontend builds and tests pass
   - Docker images build successfully
   - Docker Compose validation passes

2. **Provide a clear description**:
   - What changes you made
   - Why you made them
   - How to test them

3. **Link related issues** if applicable

4. **Wait for review** and address any feedback

## Automated Testing

This project uses GitHub Actions for continuous integration:

- **CI Workflow**: Runs on all pull requests
  - Builds backend (Java/Maven)
  - Builds frontend (TypeScript/React)
  - Runs tests
  - Builds Docker images

- **Docker Compose Validation**: Runs when Docker files change
  - Validates docker-compose.yml
  - Tests full stack deployment

See [.github/WORKFLOWS.md](.github/WORKFLOWS.md) for detailed workflow documentation.

## Coding Standards

### Backend (Java/Spring Boot)

- Use Java 17 features
- Follow Spring Boot best practices
- Write unit tests for services and controllers
- Use meaningful class and method names
- Add JavaDoc for public APIs
- Handle exceptions properly
- Validate inputs

### Frontend (TypeScript/React)

- Use TypeScript strict mode
- Follow React Hooks best practices
- Use functional components
- Write meaningful component and function names
- Keep components focused and small
- Handle errors gracefully
- Add comments for complex logic

### General

- **No hardcoded credentials**: Use environment variables
- **Security first**: Validate inputs, sanitize outputs
- **Keep it simple**: Don't over-engineer
- **Document your code**: Add comments where needed
- **Write tests**: Test new functionality

## Commit Messages

Write clear, concise commit messages:

```
Add feature: user profile picture upload

- Add profile picture field to User model
- Create upload endpoint in UserController
- Add frontend component for image upload
- Update user profile page to display picture
```

## Testing

### Backend Tests

```bash
cd backend
mvn test                    # Run all tests
mvn test -Dtest=TestClass   # Run specific test class
```

### Frontend Tests

```bash
cd frontend
npm test                    # Run all tests
npm test -- --coverage      # Run with coverage report
```

### Integration Tests

```bash
docker compose up --build
# Test the full application at http://localhost:3000
```

## Docker Images

### Building Locally

```bash
# Build backend
docker build -t inventory-backend ./backend

# Build frontend
docker build -t inventory-frontend ./frontend

# Build with compose
docker compose build
```

### Testing Docker Images

```bash
docker compose up --build
# Verify all services start correctly
# Test functionality at http://localhost:3000
```

## Reporting Issues

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Docker version, browser, etc.)
- Screenshots if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use case / motivation
- Proposed implementation (optional)
- Any alternatives considered

## Questions?

- Check the [README.md](README.md) for basic information
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment details
- Check [.github/WORKFLOWS.md](.github/WORKFLOWS.md) for CI/CD information
- Open an issue for questions or discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Give constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

Thank you for contributing! 🎉
