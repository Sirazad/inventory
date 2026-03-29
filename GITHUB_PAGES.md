# GitHub Pages Deployment Guide

## Important Limitations

**GitHub Pages can only host static websites** (HTML, CSS, JavaScript). Your inventory management system is a **full-stack application** with:

- **Frontend**: React app (can be deployed to GitHub Pages)
- **Backend**: Spring Boot Java API (cannot run on GitHub Pages)
- **Database**: PostgreSQL (cannot run on GitHub Pages)

### What This Means

If you deploy **only the frontend** to GitHub Pages:
- ✅ The website will load and display
- ❌ **No functionality will work** - no login, no data, no API calls
- ❌ The app will show errors when trying to connect to the backend

## Option 1: Frontend-Only Demo (Limited Functionality)

Deploy the React frontend to GitHub Pages as a **demo/preview** only. This is useful for showcasing the UI but won't have any working features.

### Steps to Deploy Frontend to GitHub Pages

I've created a GitHub Actions workflow that will automatically deploy the frontend to GitHub Pages.

**To activate it:**

1. **Enable GitHub Pages in your repository**:
   - Go to your repository settings: `https://github.com/Sirazad/inventory/settings/pages`
   - Under "Source", select "GitHub Actions"
   - Click "Save"

2. **Merge this PR** - The workflow will automatically deploy on every push to main

3. **Access your site**:
   - Your app will be available at: `https://sirazad.github.io/inventory/`
   - It will show the UI but won't have backend functionality

### What Works and What Doesn't

✅ **Works**:
- UI displays correctly
- Navigation between pages
- Form layouts visible

❌ **Doesn't Work** (requires backend):
- User registration/login
- Viewing/creating characters
- Managing inventory
- Any database operations

## Option 2: Free Full-Stack Hosting (Recommended)

Since GitHub Pages doesn't support full-stack apps, here are **free alternatives** that support your complete application:

### A. Railway (Recommended - Easiest)

**Free Tier**: $5/month credit (enough for small apps)

**Deployment Steps**:

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `inventory` repository
4. Railway will detect docker-compose.yml and deploy all services
5. Your app will be live at `https://your-app.railway.app`

**Pros**: 
- Automatic deployment from GitHub
- Supports Docker Compose
- Includes PostgreSQL database
- Easy setup

### B. Render

**Free Tier**: Available with limitations

**Deployment Steps**:

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Create three services:
   - PostgreSQL database (free tier)
   - Backend Web Service (from backend Dockerfile)
   - Frontend Static Site (from frontend build)
3. Connect them together
4. Deploy and get URLs

**Pros**:
- Free tier available
- Supports databases
- Auto-deploy from GitHub

### C. Fly.io

**Free Tier**: Available (limited resources)

**Deployment Steps**:

1. Install flyctl: `brew install flyctl` (Mac) or follow [fly.io/docs](https://fly.io/docs/hands-on/install-flyctl/)
2. Sign up: `flyctl auth signup`
3. Deploy: `flyctl launch` (in your project directory)
4. Fly.io will detect your Docker setup and deploy

**Pros**:
- Good free tier
- Supports databases
- Global edge deployment

### D. Heroku

**Note**: Heroku eliminated their free tier. Minimum cost is $5/month per dyno.

## Option 3: Hybrid Deployment

Deploy frontend to GitHub Pages and backend elsewhere:

1. Deploy frontend to GitHub Pages (UI only)
2. Deploy backend + database to Railway/Render/Fly.io
3. Configure frontend to connect to hosted backend API

This is complex and requires CORS configuration and environment variable management.

## Recommended Solution

**For a fully working application with zero complexity**: Use **Railway**

1. Sign in to railway.app with your GitHub account
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `Sirazad/inventory`
4. Railway automatically detects your docker-compose.yml
5. Click "Deploy"
6. Wait 2-5 minutes
7. Your app is live!

Railway provides:
- Automatic HTTPS
- Custom domain support
- Auto-deploy on git push
- Database backups
- Environment variables management

## Summary

| Solution | Frontend | Backend | Database | Cost | Complexity |
|----------|----------|---------|----------|------|------------|
| GitHub Pages | ✅ | ❌ | ❌ | Free | Easy |
| Railway | ✅ | ✅ | ✅ | $5/mo credit | Very Easy |
| Render | ✅ | ✅ | ✅ | Free tier | Medium |
| Fly.io | ✅ | ✅ | ✅ | Free tier | Medium |

**My Recommendation**: Use Railway for the complete working application. It's the closest to "one-click deploy" and supports everything your app needs.

If you still want to deploy the frontend to GitHub Pages (for demo purposes), the workflow is already included in this PR. Just enable GitHub Pages in your repository settings.
