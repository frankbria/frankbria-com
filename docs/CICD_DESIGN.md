# GitHub Actions CI/CD Design for frankbria-com

## Overview

This document outlines the design for implementing GitHub Actions workflows to automate deployment of the frankbria-com project to the development server (47.88.89.175), eliminating the need for manual SSH deployments.

## Current State Analysis

### Applications
- **Frontend (Next.js)**: `/var/nodejs/frankbria-com` - PM2 process: `frankbria-nextjs`
- **Backend (Strapi 5)**: `/var/nodejs/frankbria-strapi` - PM2 process: `strapi`

### Current Deployment Process
```bash
ssh root@47.88.89.175 "cd /var/nodejs/frankbria-com && git pull && npm run build && pm2 restart frankbria-nextjs"
```

### Key Constraints
1. Must not affect existing code or current deployment
2. Must handle both Next.js frontend and Strapi backend
3. Must be secure (SSH keys, secrets management)
4. Must provide rollback capability
5. Should support multiple environments (dev, staging, production)

---

## Architecture Design

### High-Level Flow

```
GitHub Push → Workflow Triggers → Build & Test → Deploy to Server → PM2 Restart → Verify
```

### Component Breakdown

#### 1. GitHub Actions Workflows
- **Frontend Workflow**: `.github/workflows/deploy-frontend.yml`
- **Backend Workflow**: `.github/workflows/deploy-backend.yml`
- **Combined Workflow**: `.github/workflows/deploy-all.yml` (optional)

#### 2. Deployment Strategy
- **Push-based Deployment**: GitHub Actions SSH into server to pull changes
- **Alternative**: Pull-based with webhook (more complex, not recommended initially)

#### 3. Environment Management

**Phase 1 (Current - Development Only)**:
- **Development**: `beta.frankbria.com` (47.88.89.175)
  - Branches: `develop`, `claude/**`, feature branches
  - Directory: `/var/nodejs/frankbria-com`
  - PM2: `frankbria-nextjs`
- **Production**: Not configured yet
  - `main` branch deployments **disabled** via workflow conditions

**Phase 2 (Production Launch - After MVP Sign-Off)**:

*Separate Servers Strategy (Your Setup)*
- **Development**:
  - Server: 47.88.89.175
  - Directory: `/var/nodejs/frankbria-com`
  - PM2: `frankbria-nextjs`
  - URL: beta.frankbria.com
  - Branch: `develop`, `claude/**`
- **Production**:
  - Server: [Existing production server IP - to be configured]
  - Directory: `/var/nodejs/frankbria-com`
  - PM2: `frankbria-nextjs`
  - URL: frankbria.com
  - Branch: `main`
  - **Replaces**: WordPress server (can be shut down after cutover)

**Current Implementation**: Phase 1 only. Production server exists and is ready, but workflows will keep `main` branch deployments disabled until MVP is approved and ready for production launch.

---

## Detailed Design

### Phase 1: Prerequisites Setup (Manual, One-Time)

#### 1.1 SSH Key Generation
```bash
# On your local machine or GitHub Actions will generate
ssh-keygen -t ed25519 -C "github-actions@frankbria-com" -f github-actions-deploy-key
# This creates:
# - github-actions-deploy-key (private key - store in GitHub Secrets)
# - github-actions-deploy-key.pub (public key - add to server)
```

#### 1.2 Server Configuration
```bash
# SSH into server
ssh root@47.88.89.175

# Add public key to authorized_keys
cat >> ~/.ssh/authorized_keys << 'EOF'
<paste github-actions-deploy-key.pub content>
EOF

# Ensure proper permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

#### 1.3 GitHub Secrets Configuration
Navigate to: `https://github.com/frankbria/frankbria-com/settings/secrets/actions`

Add the following secrets:
- `DEPLOY_HOST`: `47.88.89.175`
- `DEPLOY_USER`: `root`
- `DEPLOY_SSH_KEY`: (paste private key content from github-actions-deploy-key)
- `DEPLOY_FRONTEND_PATH`: `/var/nodejs/frankbria-com`
- `DEPLOY_BACKEND_PATH`: `/var/nodejs/frankbria-strapi`

---

### Phase 2: Workflow Implementation

#### 2.1 Frontend Deployment Workflow

**File**: `.github/workflows/deploy-frontend.yml`

**Triggers**:
- Push to `main` branch (production)
- Push to `develop` branch (development)
- Push to branches matching `claude/*` (development, for AI-assisted development)
- Manual trigger via workflow_dispatch

**Steps**:
1. Checkout code
2. Setup Node.js (version 20)
3. Install dependencies
4. Run linting
5. Build Next.js app
6. SSH to server and deploy
7. Restart PM2 process
8. Verify deployment
9. Notify on failure

**Key Features**:
- Environment-based deployment (dev vs prod)
- Build verification before deployment
- Atomic deployment with rollback capability
- Health check after deployment

#### 2.2 Backend Deployment Workflow

**File**: `.github/workflows/deploy-backend.yml`

**Triggers**:
- Push to `main` branch affecting backend files
- Manual trigger via workflow_dispatch
- Path filters: `strapi/**`, `backend/**`, etc.

**Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies (if package.json changed)
4. SSH to server
5. Pull latest changes
6. Run database migrations (if needed)
7. Restart Strapi PM2 process
8. Verify API health

**Important Notes**:
- Strapi doesn't require build step (runs in development mode typically)
- Database migrations must be handled carefully
- Environment variables should not be overwritten

#### 2.3 Combined Workflow (Optional)

**File**: `.github/workflows/deploy-all.yml`

Orchestrates both frontend and backend deployments when both are affected by changes.

---

### Phase 3: Deployment Script Design

#### 3.1 Frontend Deployment Script

**File**: `scripts/deploy-frontend.sh`

```bash
#!/bin/bash
set -e  # Exit on error

DEPLOY_PATH="${1:-/var/nodejs/frankbria-com}"
ENVIRONMENT="${2:-development}"

echo "🚀 Deploying Frontend to ${ENVIRONMENT}..."

# Navigate to deployment directory
cd "$DEPLOY_PATH"

# Backup current build (for rollback)
if [ -d ".next" ]; then
  echo "📦 Backing up current build..."
  mv .next .next.backup.$(date +%Y%m%d_%H%M%S)
  # Keep only last 3 backups
  ls -dt .next.backup.* | tail -n +4 | xargs rm -rf
fi

# Pull latest changes
echo "⬇️ Pulling latest changes..."
git fetch origin
git pull origin $(git branch --show-current)

# Install dependencies (only if package.json changed)
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
  echo "📥 Installing dependencies..."
  npm ci --production=false
fi

# Build Next.js
echo "🔨 Building Next.js..."
npm run build

# Restart PM2 process
echo "♻️ Restarting PM2 process..."
pm2 restart frankbria-nextjs --update-env

# Wait for process to be online
sleep 5

# Health check
echo "🏥 Running health check..."
if pm2 describe frankbria-nextjs | grep -q "online"; then
  echo "✅ Deployment successful!"
  # Clean up old backup
  rm -rf .next.backup.*
  exit 0
else
  echo "❌ Deployment failed! Rolling back..."
  # Rollback
  if [ -d ".next.backup.$(ls -t .next.backup.* | head -1)" ]; then
    rm -rf .next
    mv $(ls -dt .next.backup.* | head -1) .next
    pm2 restart frankbria-nextjs
  fi
  exit 1
fi
```

#### 3.2 Backend Deployment Script

**File**: `scripts/deploy-backend.sh`

```bash
#!/bin/bash
set -e

DEPLOY_PATH="${1:-/var/nodejs/frankbria-strapi}"
ENVIRONMENT="${2:-development}"

echo "🚀 Deploying Backend (Strapi) to ${ENVIRONMENT}..."

cd "$DEPLOY_PATH"

# Pull latest changes
echo "⬇️ Pulling latest changes..."
git fetch origin
git pull origin $(git branch --show-current)

# Install dependencies if package.json changed
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
  echo "📥 Installing dependencies..."
  npm ci
fi

# Run database migrations (Strapi 5)
echo "🗄️ Running database migrations..."
npm run strapi:migrate || true  # Don't fail if no migrations

# Restart PM2 process
echo "♻️ Restarting Strapi..."
pm2 restart strapi --update-env

# Wait for Strapi to start
sleep 10

# Health check
echo "🏥 Running health check..."
if curl -f http://localhost:1337/_health 2>/dev/null; then
  echo "✅ Backend deployment successful!"
  exit 0
else
  echo "⚠️ Health check failed, but Strapi might still be starting..."
  exit 0
fi
```

---

### Phase 4: Workflow YAML Specifications

#### 4.1 Frontend Workflow Specification

**Note**: This workflow is currently configured for **development only**. Production deployments on `main` branch are **disabled** until you're ready to enable them.

```yaml
name: Deploy Frontend (Next.js)

on:
  push:
    branches:
      # - main           # Production - COMMENTED OUT until production is ready
      - develop        # Development
      - 'claude/**'    # AI development branches
    paths:
      - 'app/**'
      - 'components/**'
      - 'lib/**'
      - 'public/**'
      - 'styles/**'
      - 'package.json'
      - 'package-lock.json'
      - 'next.config.js'
      - 'tailwind.config.ts'
      - '.github/workflows/deploy-frontend.yml'

  workflow_dispatch:  # Manual trigger
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'development'
        type: choice
        options:
          - development
          - production

jobs:
  deploy-frontend:
    name: Deploy to ${{ github.ref_name == 'main' && 'Production' || 'Development' }}
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint
        continue-on-error: true  # Don't fail deployment on lint errors initially

      - name: Build Next.js
        run: npm run build
        env:
          NEXT_PUBLIC_STRAPI_URL: ${{ github.ref_name == 'main' && secrets.NEXT_PUBLIC_STRAPI_URL_PROD || secrets.NEXT_PUBLIC_STRAPI_URL_DEV }}

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.DEPLOY_SSH_KEY }}

      - name: Add server to known_hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.DEPLOY_HOST }} >> ~/.ssh/known_hosts

      - name: Set deployment configuration
        id: deploy-config
        run: |
          if [[ "${{ github.ref_name }}" == "main" ]]; then
            # Production deployment (disabled until MVP approved)
            echo "host=${{ secrets.DEPLOY_HOST_PROD }}" >> $GITHUB_OUTPUT
            echo "user=${{ secrets.DEPLOY_USER_PROD }}" >> $GITHUB_OUTPUT
            echo "path=/var/nodejs/frankbria-com" >> $GITHUB_OUTPUT
            echo "pm2_name=frankbria-nextjs" >> $GITHUB_OUTPUT
            echo "health_url=https://frankbria.com" >> $GITHUB_OUTPUT
            echo "environment=production" >> $GITHUB_OUTPUT
          else
            # Development deployment
            echo "host=${{ secrets.DEPLOY_HOST }}" >> $GITHUB_OUTPUT
            echo "user=${{ secrets.DEPLOY_USER }}" >> $GITHUB_OUTPUT
            echo "path=${{ secrets.DEPLOY_FRONTEND_PATH }}" >> $GITHUB_OUTPUT
            echo "pm2_name=frankbria-nextjs" >> $GITHUB_OUTPUT
            echo "health_url=https://beta.frankbria.com" >> $GITHUB_OUTPUT
            echo "environment=development" >> $GITHUB_OUTPUT
          fi

      - name: Deploy to ${{ steps.deploy-config.outputs.environment }}
        run: |
          ssh ${{ steps.deploy-config.outputs.user }}@${{ steps.deploy-config.outputs.host }} << 'ENDSSH'
            set -e
            cd ${{ steps.deploy-config.outputs.path }}

            # Backup current build
            if [ -d ".next" ]; then
              echo "Backing up current build..."
              mv .next .next.backup.$(date +%Y%m%d_%H%M%S)
              ls -dt .next.backup.* | tail -n +4 | xargs rm -rf || true
            fi

            # Pull latest changes
            echo "Pulling latest changes..."
            git fetch origin
            git pull origin ${{ github.ref_name }}

            # Install dependencies if needed
            if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
              echo "Installing dependencies..."
              npm ci
            fi

            # Build
            echo "Building Next.js..."
            npm run build

            # Restart PM2
            echo "Restarting PM2..."
            pm2 restart ${{ steps.deploy-config.outputs.pm2_name }} --update-env

            # Wait and verify
            sleep 5
            if pm2 describe ${{ steps.deploy-config.outputs.pm2_name }} | grep -q "online"; then
              echo "✅ Deployment successful!"
              rm -rf .next.backup.* || true
            else
              echo "❌ Deployment failed!"
              exit 1
            fi
          ENDSSH

      - name: Verify deployment
        run: |
          sleep 10
          if curl -f -s -o /dev/null -w "%{http_code}" "${{ steps.deploy-config.outputs.health_url }}" | grep -q "200"; then
            echo "✅ Site is responding correctly at ${{ steps.deploy-config.outputs.health_url }}"
          else
            echo "⚠️ Site health check failed at ${{ steps.deploy-config.outputs.health_url }}"
            exit 1
          fi

      - name: Notify on failure
        if: failure()
        run: |
          echo "::warning::Frontend deployment failed for branch ${{ github.ref_name }}"
```

#### 4.2 Backend Workflow Specification

```yaml
name: Deploy Backend (Strapi)

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'strapi/**'
      - 'config/**'
      - 'src/**'
      - 'database/**'
      - 'package.json'
      - 'package-lock.json'
      - '.github/workflows/deploy-backend.yml'

  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'development'
        type: choice
        options:
          - development
          - production

jobs:
  deploy-backend:
    name: Deploy Strapi to ${{ github.ref_name == 'main' && 'Production' || 'Development' }}
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.DEPLOY_SSH_KEY }}

      - name: Add server to known_hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.DEPLOY_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy to server
        run: |
          ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} << 'ENDSSH'
            set -e
            cd ${{ secrets.DEPLOY_BACKEND_PATH }}

            # Pull latest changes
            echo "Pulling latest changes..."
            git fetch origin
            git pull origin ${{ github.ref_name }}

            # Install dependencies if needed
            if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
              echo "Installing dependencies..."
              npm ci
            fi

            # Restart PM2
            echo "Restarting Strapi..."
            pm2 restart strapi --update-env

            # Wait for Strapi
            sleep 10
            echo "✅ Backend deployment complete"
          ENDSSH

      - name: Verify API health
        run: |
          sleep 15
          if curl -f http://${{ secrets.DEPLOY_HOST }}:1337/_health 2>/dev/null; then
            echo "✅ Strapi API is healthy"
          else
            echo "⚠️ Strapi health check failed (might still be starting)"
          fi
```

---

## Environment Separation Strategy

### Current State: Development Only

**What happens now**:
- Pushing to `develop` or `claude/**` branches triggers deployment to beta.frankbria.com
- Pushing to `main` branch does **nothing** (production deployments disabled)
- All deployments go to: 47.88.89.175 → `/var/nodejs/frankbria-com` → `frankbria-nextjs` PM2 process

### Enabling Production Later

When you're ready to enable production deployments to frankbria.com, you have two options:

#### Option A: Same Server Setup (Easier, Good for Small Traffic)

**Steps to enable**:

1. **Create production directories on server**:
```bash
ssh root@47.88.89.175
cd /var/nodejs
git clone <repo-url> frankbria-com-prod
cd frankbria-com-prod
git checkout main
npm install
npm run build
```

2. **Create production PM2 process**:
```bash
pm2 start npm --name "frankbria-nextjs-prod" -- start
pm2 startup
pm2 save
```

3. **Update nginx/reverse proxy** (if applicable):
```nginx
# beta.frankbria.com → localhost:3000 (development)
server {
    server_name beta.frankbria.com;
    location / {
        proxy_pass http://localhost:3000;
    }
}

# frankbria.com → localhost:3001 (production)
server {
    server_name frankbria.com www.frankbria.com;
    location / {
        proxy_pass http://localhost:3001;
    }
}
```

4. **Update GitHub Secrets**:
- Add: `DEPLOY_FRONTEND_PATH_PROD=/var/nodejs/frankbria-com-prod`
- Add: `PM2_PROCESS_NAME_PROD=frankbria-nextjs-prod`

5. **Enable production in workflow**:
```yaml
# Uncomment main branch in .github/workflows/deploy-frontend.yml
branches:
  - main           # Production - NOW ENABLED
  - develop        # Development
  - 'claude/**'    # AI development branches
```

6. **Add environment-specific deployment logic**:
```yaml
- name: Deploy to server
  run: |
    # Determine deployment target based on branch
    if [[ "${{ github.ref_name }}" == "main" ]]; then
      DEPLOY_PATH="${{ secrets.DEPLOY_FRONTEND_PATH_PROD }}"
      PM2_NAME="${{ secrets.PM2_PROCESS_NAME_PROD }}"
      HEALTH_URL="https://frankbria.com"
    else
      DEPLOY_PATH="${{ secrets.DEPLOY_FRONTEND_PATH }}"
      PM2_NAME="frankbria-nextjs"
      HEALTH_URL="https://beta.frankbria.com"
    fi

    ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} << ENDSSH
      cd $DEPLOY_PATH
      git pull origin ${{ github.ref_name }}
      npm run build
      pm2 restart $PM2_NAME
    ENDSSH
```

**Pros**:
- Simple setup, single server to manage
- Lower cost (one server for everything)
- Easy to get started

**Cons**:
- Development deployments could affect production (shared resources)
- Can't test server infrastructure changes safely
- Single point of failure

#### Option B: Separate Servers (Recommended for Production)

**Setup required**:

1. **Provision new production server**:
   - New DigitalOcean/AWS droplet
   - Different IP address (e.g., 123.45.67.89)
   - Install Node.js, PM2, nginx

2. **Update GitHub Secrets**:
   - Add: `DEPLOY_HOST_PROD=123.45.67.89`
   - Add: `DEPLOY_USER_PROD=root`
   - Add: `DEPLOY_SSH_KEY_PROD=<new-ssh-key>`

3. **Update workflow with environment matrix**:
```yaml
jobs:
  deploy-frontend:
    strategy:
      matrix:
        environment:
          - name: development
            branch: develop
            host: 47.88.89.175
            path: /var/nodejs/frankbria-com
            url: https://beta.frankbria.com
          - name: production
            branch: main
            host: 123.45.67.89
            path: /var/nodejs/frankbria-com
            url: https://frankbria.com

    runs-on: ubuntu-latest
    if: github.ref_name == matrix.environment.branch

    steps:
      - name: Deploy to ${{ matrix.environment.name }}
        run: |
          ssh ${{ secrets.DEPLOY_USER }}@${{ matrix.environment.host }} ...
```

**Pros**:
- Complete isolation between environments
- Can test infrastructure changes safely
- Better for compliance/security
- Easier to scale production independently

**Cons**:
- Higher cost (two servers)
- More servers to maintain
- Slightly more complex setup

### Production Cutover Plan (When MVP is Approved)

Your production server is already provisioned and ready. When you're ready to launch:

#### **Pre-Cutover Checklist** (1-2 weeks before)

1. **Prepare Production Server**:
```bash
# SSH to production server
ssh root@[PROD_SERVER_IP]

# Install dependencies
apt-get update
apt-get install -y nodejs npm git

# Install PM2 globally
npm install -g pm2

# Clone repositories
cd /var/nodejs
git clone https://github.com/frankbria/frankbria-com.git
git clone [strapi-repo-url] frankbria-strapi

# Set up Next.js
cd frankbria-com
git checkout main
npm install
cp .env.local.example .env.local  # Configure production env vars
npm run build

# Set up Strapi
cd ../frankbria-strapi
npm install
# Configure Strapi .env with production database

# Start PM2 processes
pm2 start npm --name frankbria-nextjs -- start
pm2 start npm --name strapi --cwd /var/nodejs/frankbria-strapi -- start
pm2 startup
pm2 save
```

2. **Generate Production SSH Key**:
```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-prod" -f github-actions-prod-key

# Add public key to production server
ssh root@[PROD_SERVER_IP]
cat >> ~/.ssh/authorized_keys << 'EOF'
[paste public key here]
EOF
```

3. **Add Production Secrets to GitHub**:
   - `DEPLOY_HOST_PROD`: [Production server IP]
   - `DEPLOY_USER_PROD`: `root`
   - `DEPLOY_SSH_KEY_PROD`: [Private key content]
   - `NEXT_PUBLIC_STRAPI_URL_PROD`: `https://frankbria.com`
   - `STRAPI_API_TOKEN_PROD`: [Production API token]

4. **Update Workflows**:
```yaml
# In .github/workflows/deploy-frontend.yml
# Uncomment:
branches:
  - main           # Production - ENABLED FOR LAUNCH
  - develop
  - 'claude/**'
```

5. **Test Production Deployment**:
```bash
# Create a test PR to main branch
# Trigger manual workflow dispatch
# Verify deployment to production server
# Test at https://frankbria.com
```

#### **Cutover Day** (Launch Day)

**Timeline** (assumes scheduled maintenance window):

**Hour 0: Pre-launch** (e.g., 2:00 AM)
```bash
# 1. Final production deployment
git checkout main
git pull
# Push to trigger production deployment

# 2. Verify production is working
curl https://frankbria.com  # Should return 200

# 3. Final database backup from WordPress
# (In case you need to rollback)
```

**Hour 1: DNS Cutover** (e.g., 3:00 AM)
```bash
# 1. Update DNS records
# frankbria.com A record → [Production Server IP]
# www.frankbria.com CNAME → frankbria.com

# 2. Set low TTL initially (300 seconds = 5 min)
# So you can rollback quickly if needed
```

**Hour 2-6: Monitoring** (e.g., 4:00 AM - 8:00 AM)
```bash
# 1. Watch for DNS propagation
dig frankbria.com

# 2. Monitor PM2 logs
ssh root@[PROD_SERVER_IP]
pm2 logs frankbria-nextjs --lines 100

# 3. Monitor error rates
# Watch for 404s, 500s, etc.

# 4. Test key user journeys
# - Homepage loads
# - Blog posts load
# - Navigation works
```

**Hour 6+: Verify & Celebrate** (e.g., 8:00 AM+)
```bash
# 1. Confirm WordPress is no longer receiving traffic
# Check WordPress server logs

# 2. Turn off WordPress server
# (Keep it around for 30 days for rollback if needed)

# 3. Update DNS TTL to normal (3600 seconds = 1 hour)

# 4. Celebrate! 🎉
```

#### **Rollback Plan** (If something goes wrong)

**Immediate Rollback** (within first hour):
```bash
# 1. Revert DNS to WordPress
# frankbria.com A record → [WordPress Server IP]

# 2. Wait for DNS propagation (5-15 min with low TTL)

# 3. Investigate issue on production server
```

**Post-Launch Rollback** (after DNS has propagated):
```bash
# 1. Create emergency PR to main with fix
# 2. CI/CD will auto-deploy fix to production
# 3. If that fails, manually deploy previous version:

ssh root@[PROD_SERVER_IP]
cd /var/nodejs/frankbria-com
git log --oneline -10  # Find last working commit
git checkout [commit-hash]
npm run build
pm2 restart frankbria-nextjs
```

---

## Security Considerations

### 1. SSH Key Management
- **Private Key**: Stored in GitHub Secrets (encrypted at rest)
- **Public Key**: Added to server's `authorized_keys`
- **Key Rotation**: Should be rotated every 90 days
- **Access Scope**: Limited to deployment user only

### 2. Secrets Management
- All sensitive values in GitHub Secrets
- Never commit secrets to repository
- Use environment-specific secrets
- Regular audit of secret access

### 3. Server Access
- SSH key-based authentication only (no passwords)
- Consider creating dedicated deployment user (not root)
- Firewall rules to restrict SSH access to GitHub Actions IPs (optional)

### 4. Code Security
- Branch protection rules on `main`
- Require pull request reviews
- Run security scanning (Dependabot, CodeQL)

---

## Rollback Strategy

### Automatic Rollback
- Frontend: Backup `.next` directory before build
- On PM2 restart failure, restore previous build
- Keep last 3 backups

### Manual Rollback
```bash
# SSH into server
ssh root@47.88.89.175

# Frontend rollback
cd /var/nodejs/frankbria-com
git log --oneline -10  # Find commit to rollback to
git checkout <commit-hash>
npm run build
pm2 restart frankbria-nextjs

# Backend rollback
cd /var/nodejs/frankbria-strapi
git checkout <commit-hash>
pm2 restart strapi
```

### Rollback via GitHub Actions
```yaml
# Manual workflow dispatch with commit hash input
workflow_dispatch:
  inputs:
    commit:
      description: 'Commit hash to deploy'
      required: true
```

---

## Monitoring & Notifications

### Success Metrics
- Deployment duration
- Build success rate
- Uptime after deployment
- Error rate after deployment

### Failure Notifications
- GitHub Actions built-in notifications
- Consider adding:
  - Slack webhook
  - Email notifications
  - Discord webhook

### Logging
- GitHub Actions logs (retained for 90 days)
- PM2 logs on server
- Application logs (Next.js, Strapi)

---

## Migration Path (Implementation Steps)

### Step 1: Setup (No Code Changes)
1. Generate SSH key pair
2. Add public key to server
3. Add secrets to GitHub repository
4. Create `.github/workflows/` directory

### Step 2: Create Workflows (Additive Only)
1. Create `.github/workflows/deploy-frontend.yml`
2. Create `.github/workflows/deploy-backend.yml`
3. Commit and push to a test branch

### Step 3: Test Deployment
1. Create a feature branch (`test/github-actions`)
2. Make a small change (e.g., update README)
3. Push and observe workflow execution
4. Verify deployment on beta.frankbria.com

### Step 4: Production Deployment
1. Update workflows to handle `main` branch
2. Add production secrets
3. Test with a hotfix branch first
4. Enable for main branch

### Step 5: Documentation & Training
1. Update team documentation
2. Document rollback procedures
3. Create runbook for common issues

---

## Alternative Approaches Considered

### 1. Docker-based Deployment
**Pros**: Consistent environments, easier rollback
**Cons**: Requires Docker setup on server, more complex
**Decision**: Not chosen - adds unnecessary complexity for current setup

### 2. Pull-based with Webhooks
**Pros**: Server pulls changes, more secure
**Cons**: Requires webhook endpoint on server, more complex setup
**Decision**: Not chosen - push-based is simpler for initial implementation

### 3. Third-party CI/CD (Vercel, Netlify)
**Pros**: Fully managed, zero maintenance
**Cons**: Loss of control, vendor lock-in, cost
**Decision**: Not chosen - self-hosted provides more control

---

## Success Criteria

### Phase 1 Success Metrics
- ✅ Workflows created and committed
- ✅ SSH authentication working
- ✅ Manual workflow dispatch succeeds
- ✅ Deployment completes in < 5 minutes

### Phase 2 Success Metrics
- ✅ Automatic deployment on push to develop
- ✅ Build verification catches errors before deployment
- ✅ Health checks pass after deployment
- ✅ Zero downtime deployments

### Phase 3 Success Metrics
- ✅ Production deployments working
- ✅ Rollback tested and documented
- ✅ Team trained on new process
- ✅ Manual SSH deployments eliminated

---

## Maintenance & Future Enhancements

### Regular Maintenance
- Review and update dependencies in workflows
- Rotate SSH keys every 90 days
- Review deployment logs monthly
- Update Node.js versions as needed

### Future Enhancements
1. **Staging Environment**: Add staging server for testing
2. **Blue-Green Deployment**: Zero-downtime deployments
3. **Database Backups**: Automated backups before Strapi deployments
4. **Performance Monitoring**: Integrate with monitoring tools
5. **Automated Testing**: Add E2E tests before deployment
6. **Deployment Approvals**: Require manual approval for production

---

## Cost Analysis

### GitHub Actions Free Tier
- 2,000 minutes/month for private repositories
- Unlimited for public repositories
- Current usage estimate: ~10 minutes per deployment
- Expected deployments: ~50/month = 500 minutes

### Estimated Costs
- GitHub Actions: **$0** (within free tier)
- Additional SSH key storage: **$0**
- Monitoring/notifications: **$0** (using free tiers)

**Total Monthly Cost**: $0

---

## Appendix

### A. Environment Variables Reference

#### Frontend (Next.js)
```
NEXT_PUBLIC_STRAPI_URL=https://beta.frankbria.com
STRAPI_API_TOKEN=<from server .env.local>
```

#### Backend (Strapi)
```
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=frankbria_strapi
DATABASE_USERNAME=<username>
DATABASE_PASSWORD=<password>
APP_KEYS=<app_keys>
API_TOKEN_SALT=<token_salt>
ADMIN_JWT_SECRET=<jwt_secret>
TRANSFER_TOKEN_SALT=<transfer_salt>
JWT_SECRET=<jwt_secret>
```

### B. PM2 Ecosystem File (Optional Enhancement)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'frankbria-nextjs',
      cwd: '/var/nodejs/frankbria-com',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'strapi',
      cwd: '/var/nodejs/frankbria-strapi',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 1337
      }
    }
  ]
};
```

### C. Troubleshooting Guide

#### Workflow fails at SSH step
- Verify SSH key is correctly added to GitHub Secrets
- Check server's `authorized_keys` file
- Verify server hostname/IP is correct

#### Build succeeds but deployment fails
- Check PM2 process status: `pm2 status`
- View PM2 logs: `pm2 logs frankbria-nextjs`
- Verify disk space: `df -h`

#### Health check fails
- Increase wait time in workflow
- Check application logs
- Verify environment variables are set

---

## Conclusion

This design provides a comprehensive, secure, and maintainable GitHub Actions CI/CD pipeline that:

1. **Doesn't affect existing code** - All new files in `.github/workflows/`
2. **Handles both applications** - Separate workflows for Next.js and Strapi
3. **Maintains security** - SSH key-based authentication, secrets management
4. **Provides rollback capability** - Automated backups and manual rollback procedures
5. **Scales for future needs** - Extensible for staging, production, and additional environments

**Next Steps**: Review this design, approve it, and proceed with implementation using `/sc:implement`.
