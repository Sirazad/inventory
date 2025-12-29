# Private Deployment Guide

This guide explains how to deploy the Inventory Management System while keeping both the code and the deployed application private.

## Overview

By default, the workflows publish Docker images to GitHub Container Registry (GHCR) as **public** packages. To keep everything private, you need to:

1. Keep your GitHub repository private
2. Keep Docker images private on GHCR
3. Deploy to a private server/infrastructure
4. Secure the application with proper authentication

## Step 1: Keep Your Repository Private

Your repository is already private, but to verify:

1. Go to your repository settings: `https://github.com/Sirazad/inventory/settings`
2. Scroll down to the "Danger Zone" section
3. Ensure it says "Change repository visibility" and shows "Private"

## Step 2: Make Docker Images Private on GitHub Container Registry

By default, packages published to GHCR from a **private** repository are **private** automatically. However, you should verify:

### Check Package Visibility

1. Go to `https://github.com/Sirazad?tab=packages`
2. Click on the `inventory/backend` and `inventory/frontend` packages
3. Click "Package settings" (on the right side)
4. Under "Danger Zone", verify visibility is set to "Private"

### If Packages Are Public

If the packages are public, change them to private:

1. In Package settings → Danger Zone
2. Click "Change visibility"
3. Select "Private"
4. Confirm the change

**Note**: Private packages require authentication to pull. See authentication section below.

## Step 3: Authenticate to Pull Private Images

To pull private images from GHCR, you need to authenticate:

### Create a Personal Access Token (PAT)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: `GHCR Pull Token for Inventory`
4. Select scopes:
   - ✓ `read:packages` (to pull images)
   - ✓ `write:packages` (if you need to push images manually)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

### Login to GHCR on Your Deployment Server

```bash
# Replace YOUR_TOKEN with your personal access token
# Replace YOUR_USERNAME with your GitHub username
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### Pull Private Images

```bash
# Now you can pull private images
docker pull ghcr.io/sirazad/inventory/backend:latest
docker pull ghcr.io/sirazad/inventory/frontend:latest
```

## Step 4: Private Deployment Options

### Option A: Deploy on Your Own Server (Recommended for Privacy)

**Requirements:**
- A Linux server (VPS, dedicated server, or local machine)
- Docker and Docker Compose installed
- Firewall configured to block external access (optional)

**Steps:**

1. **SSH into your server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Docker** (if not already installed):
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   # Log out and back in for group changes to take effect
   ```

3. **Authenticate to GHCR**:
   ```bash
   echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   ```

4. **Create deployment directory**:
   ```bash
   mkdir -p ~/inventory-deployment
   cd ~/inventory-deployment
   ```

5. **Create docker-compose.yml for private deployment**:
   ```yaml
   services:
     postgres:
       image: postgres:15-alpine
       container_name: inventory-postgres
       environment:
         POSTGRES_DB: inventory
         POSTGRES_USER: inventory_user
         POSTGRES_PASSWORD: CHANGE_THIS_STRONG_PASSWORD
       volumes:
         - postgres-data:/var/lib/postgresql/data
       networks:
         - inventory-network
       restart: unless-stopped
     
     backend:
       image: ghcr.io/sirazad/inventory/backend:latest
       container_name: inventory-backend
       environment:
         SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/inventory
         SPRING_DATASOURCE_USERNAME: inventory_user
         SPRING_DATASOURCE_PASSWORD: CHANGE_THIS_STRONG_PASSWORD
       depends_on:
         - postgres
       networks:
         - inventory-network
       restart: unless-stopped
     
     frontend:
       image: ghcr.io/sirazad/inventory/frontend:latest
       container_name: inventory-frontend
       ports:
         - "127.0.0.1:3000:80"  # Only accessible from localhost
       depends_on:
         - backend
       networks:
         - inventory-network
       restart: unless-stopped
   
   networks:
     inventory-network:
       driver: bridge
   
   volumes:
     postgres-data:
   ```

6. **Start the application**:
   ```bash
   docker compose pull  # Pull latest images
   docker compose up -d  # Start in detached mode
   ```

7. **Access the application**:
   - Locally on server: `http://localhost:3000`
   - Via SSH tunnel: `ssh -L 3000:localhost:3000 user@your-server-ip`
   - Then access `http://localhost:3000` on your local machine

### Option B: Deploy Behind a VPN

For team access while maintaining privacy:

1. Set up a VPN server (WireGuard, OpenVPN, Tailscale)
2. Deploy the application as in Option A
3. Configure the application to listen on the VPN network interface
4. Team members connect via VPN to access the application

### Option C: Deploy with Reverse Proxy and Authentication

If you need internet access but want to restrict who can access:

1. Deploy with nginx reverse proxy
2. Add HTTP Basic Authentication or OAuth
3. Use HTTPS with Let's Encrypt certificates

Example nginx configuration with basic auth:

```nginx
server {
    listen 80;
    server_name inventory.yourdomain.com;
    
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Step 5: Firewall Configuration (Optional but Recommended)

Restrict access to your deployment:

### Using UFW (Ubuntu/Debian)

```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTPS (if using reverse proxy)
sudo ufw allow https

# Deny all other incoming connections
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Enable firewall
sudo ufw enable
```

### Using firewalld (CentOS/RHEL)

```bash
# Allow SSH
sudo firewall-cmd --permanent --add-service=ssh

# Allow HTTPS (if using reverse proxy)
sudo firewall-cmd --permanent --add-service=https

# Reload firewall
sudo firewall-cmd --reload
```

## Step 6: Keep Your Deployment Updated

### Manual Updates

```bash
cd ~/inventory-deployment
docker compose pull  # Pull latest images
docker compose up -d  # Restart with new images
```

### Automated Updates (Optional)

Use a tool like Watchtower to automatically update containers:

```yaml
# Add to your docker-compose.yml
watchtower:
  image: containrrr/watchtower
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  environment:
    - WATCHTOWER_POLL_INTERVAL=3600  # Check every hour
    - WATCHTOWER_CLEANUP=true
  command: inventory-backend inventory-frontend
  restart: unless-stopped
```

## Security Checklist for Private Deployment

- [ ] Repository is private on GitHub
- [ ] Docker images are private on GHCR
- [ ] Changed default database password
- [ ] Changed JWT secret in backend configuration
- [ ] Application only accessible via localhost, VPN, or authenticated reverse proxy
- [ ] Firewall configured to block unwanted traffic
- [ ] SSH access secured with key-based authentication
- [ ] Regular backups of PostgreSQL database
- [ ] Docker images updated regularly
- [ ] Server OS updated regularly
- [ ] Monitoring and logging configured

## Backup and Disaster Recovery

### Backup Database

```bash
# Backup
docker exec inventory-postgres pg_dump -U inventory_user inventory > backup-$(date +%Y%m%d).sql

# Restore
cat backup-20231229.sql | docker exec -i inventory-postgres psql -U inventory_user inventory
```

### Backup Docker Volumes

```bash
# Stop containers
docker compose down

# Backup volume
docker run --rm -v inventory-deployment_postgres-data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres-data-backup.tar.gz /data

# Start containers
docker compose up -d
```

## Troubleshooting

### Cannot Pull Private Images

**Error**: `unauthorized: authentication required`

**Solution**: Ensure you're logged in to GHCR:
```bash
docker logout ghcr.io
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### Images Are Public

**Solution**: 
1. Go to package settings on GitHub
2. Change visibility to Private
3. Re-pull images after authenticating

### Application Accessible from Internet

**Solution**:
1. Check your docker-compose.yml ports binding: `127.0.0.1:3000:80` (good) vs `3000:80` (exposes to all interfaces)
2. Check firewall rules
3. Use a VPN or reverse proxy with authentication

## Summary

To keep your deployment completely private:

1. ✅ Repository is private (already done if your repo is private)
2. ✅ Make GHCR packages private (verify in package settings)
3. ✅ Authenticate to pull images (use Personal Access Token)
4. ✅ Deploy on private server or behind VPN
5. ✅ Use firewall to restrict access
6. ✅ Regular security updates and backups

With these steps, your code and deployment will remain completely private and secure.
