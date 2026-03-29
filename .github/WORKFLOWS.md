# GitHub Workflows Documentation

This repository uses GitHub Actions for automated CI/CD. This document explains each workflow and how to use them.

## Available Workflows

### 1. CI Workflow (`ci.yml`)

**Purpose**: Continuous Integration - builds and tests the application on every pull request and push.

**Triggers**:
- Pull requests to `main` or `master` branches
- Direct pushes to `main` or `master` branches

**Jobs**:

1. **backend-build**
   - Sets up Java 17 with Temurin distribution
   - Uses Maven cache for faster builds
   - Runs `mvn clean install -DskipTests`
   - Runs `mvn test`

2. **frontend-build**
   - Sets up Node.js 18
   - Uses npm cache for faster builds
   - Runs `npm ci` (clean install)
   - Runs `npm run build`
   - Runs `npm test` with `--watchAll=false --passWithNoTests`

3. **docker-build**
   - Runs only after backend-build and frontend-build succeed
   - Builds both Docker images without pushing
   - Uses GitHub Actions cache for layer caching

**What to watch for**:
- Build failures indicate code issues
- Test failures need to be fixed before merging
- Docker build failures indicate Dockerfile or build context issues

---

### 2. CD Workflow (`cd.yml`)

**Purpose**: Continuous Deployment - builds and publishes Docker images to GitHub Container Registry.

**Triggers**:
- Pushes to `main` or `master` branches
- Tags matching `v*` pattern (e.g., `v1.0.0`, `v2.1.3`)
- Published releases

**Environment Variables**:
- `REGISTRY`: `ghcr.io` (GitHub Container Registry)
- `BACKEND_IMAGE_NAME`: `${{ github.repository }}/backend`
- `FRONTEND_IMAGE_NAME`: `${{ github.repository }}/frontend`

**Jobs**:

1. **build-and-push**
   - Requires `packages: write` permission
   - Logs in to GitHub Container Registry using `GITHUB_TOKEN`
   - Builds and pushes both backend and frontend images
   - Creates multiple tags for each image:
     - `latest` (only on default branch)
     - Branch name (e.g., `main`)
     - Commit SHA (e.g., `main-abc1234`)
     - Semantic version tags (e.g., `1.0.0`, `1.0`)

**Published Images**:
- Backend: `ghcr.io/sirazad/inventory/backend`
- Frontend: `ghcr.io/sirazad/inventory/frontend`

**How to use published images**:
```bash
# Pull latest
docker pull ghcr.io/sirazad/inventory/backend:latest
docker pull ghcr.io/sirazad/inventory/frontend:latest

# Pull specific version
docker pull ghcr.io/sirazad/inventory/backend:v1.0.0
docker pull ghcr.io/sirazad/inventory/frontend:v1.0.0
```

---

### 3. Docker Compose Validation (`docker-compose.yml`)

**Purpose**: Validates that the full stack works together correctly.

**Triggers**:
- Pull requests or pushes that modify:
  - `docker-compose.yml`
  - `backend/Dockerfile`
  - `frontend/Dockerfile`
  - `.github/workflows/docker-compose.yml`

**Jobs**:

1. **validate-docker-compose**
   - Validates `docker-compose.yml` syntax with `docker compose config`
   - Builds all services with `docker compose build`
   - Starts all services with `docker compose up -d`
   - Waits for services to be healthy:
     - PostgreSQL: Uses `pg_isready`
     - Backend: Checks health endpoint or root endpoint
     - Frontend: Checks root endpoint
   - Shows logs on failure
   - Always cleans up with `docker compose down -v`

**What to watch for**:
- Configuration errors in docker-compose.yml
- Build failures in Dockerfiles
- Service startup issues
- Health check failures

---

### 4. GitHub Pages Deployment (`github-pages.yml`)

**Purpose**: Deploys the frontend React app to GitHub Pages as a static site demo.

**Triggers**:
- Pushes to `main` or `master` branches
- Manual trigger via `workflow_dispatch`

**Important Limitations**:
- **Only deploys the frontend UI** (HTML, CSS, JavaScript)
- **Backend API and database do NOT run** on GitHub Pages
- The deployed site will show the UI but won't have any working functionality (no login, no data, no API calls)
- This is useful as a **demo/preview** of the user interface only

**Jobs**:

1. **build**
   - Checks out code
   - Sets up Node.js 18
   - Installs npm dependencies
   - Builds the React app with `PUBLIC_URL=/inventory` for GitHub Pages subdirectory
   - Uploads build artifacts for deployment

2. **deploy**
   - Deploys the built frontend to GitHub Pages
   - Site will be available at: `https://sirazad.github.io/inventory/`

**Prerequisites**:
- Enable GitHub Pages in repository settings
- Go to Settings → Pages → Source: Select "GitHub Actions"

**What to watch for**:
- Build failures indicate frontend compilation issues
- Deployment failures may indicate Pages configuration issues
- The deployed site will load but API calls will fail (expected - no backend)

**For Full-Stack Deployment**:
GitHub Pages cannot run backend services or databases. For a fully working application, see [GITHUB_PAGES.md](../GITHUB_PAGES.md) for free alternatives like Railway, Render, or Fly.io.

---

## Working with Workflows

### Viewing Workflow Runs

1. Go to the [Actions tab](https://github.com/Sirazad/inventory/actions)
2. Click on a specific workflow to see all runs
3. Click on a run to see job details and logs

### Debugging Failures

1. Check the workflow run logs in the Actions tab
2. Look for error messages in the failed job
3. Common issues:
   - **Build failures**: Check code compilation errors
   - **Test failures**: Review test output
   - **Docker build failures**: Check Dockerfile syntax and build context
   - **Timeout failures**: May need to increase wait times

### Manual Workflow Triggers

Some workflows can be triggered manually from the Actions tab (if configured with `workflow_dispatch`).

### Secrets and Environment Variables

The workflows use these automatically provided secrets:
- `GITHUB_TOKEN`: Automatically provided for authentication

No additional secrets are required for the current workflows.

### Customizing Workflows

To modify workflows:

1. Edit files in `.github/workflows/`
2. Test changes on a feature branch first
3. Validate YAML syntax:
   ```bash
   python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"
   ```

### Cache Management

Workflows use caching to speed up builds:
- Maven dependencies (backend)
- npm packages (frontend)
- Docker layers (build cache)

Caches are scoped to branches and automatically cleaned up after 7 days of inactivity.

---

## Best Practices

1. **Before Pushing**:
   - Run tests locally: `mvn test` and `npm test`
   - Build locally: `docker compose build`

2. **Pull Requests**:
   - Ensure CI passes before requesting review
   - Address any build or test failures
   - Keep PRs focused and small

3. **Releases**:
   - Use semantic versioning tags: `v1.0.0`, `v1.1.0`, `v2.0.0`
   - Create GitHub releases for major versions
   - Update CHANGELOG with release notes

4. **Docker Images**:
   - Use specific version tags in production
   - Don't rely on `latest` tag for production deployments
   - Test images before promoting to production

---

## Monitoring

### Status Badges

Add these badges to your README to show workflow status:

```markdown
[![CI](https://github.com/Sirazad/inventory/actions/workflows/ci.yml/badge.svg)](https://github.com/Sirazad/inventory/actions/workflows/ci.yml)
[![CD](https://github.com/Sirazad/inventory/actions/workflows/cd.yml/badge.svg)](https://github.com/Sirazad/inventory/actions/workflows/cd.yml)
[![Docker Compose](https://github.com/Sirazad/inventory/actions/workflows/docker-compose.yml/badge.svg)](https://github.com/Sirazad/inventory/actions/workflows/docker-compose.yml)
[![GitHub Pages](https://github.com/Sirazad/inventory/actions/workflows/github-pages.yml/badge.svg)](https://github.com/Sirazad/inventory/actions/workflows/github-pages.yml)
```

### Email Notifications

GitHub sends email notifications for workflow failures by default. Configure in your GitHub notification settings.

---

## Troubleshooting

### "Image not found" when pulling from GHCR

**Solution**: Ensure the image is public or authenticate:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Workflows not triggering

**Possible causes**:
- Check the workflow trigger conditions
- Ensure the workflow file is on the correct branch
- Check GitHub Actions is enabled for the repository

### Build timeouts

**Solution**: 
- Increase timeout in workflow (default is 360 minutes)
- Optimize build steps
- Use more aggressive caching

### Permission denied when pushing images

**Solution**:
- Check repository settings → Actions → General → Workflow permissions
- Should be set to "Read and write permissions"

---

## Support

For issues with workflows:
1. Check the [Actions documentation](https://docs.github.com/en/actions)
2. Review workflow logs
3. Open an issue in this repository
