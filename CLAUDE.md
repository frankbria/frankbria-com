## Server Infrastructure

### Staging Server (beta.frankbria.com)
- **IP Address**: 47.88.89.175
- **SSH Access**: `ssh root@47.88.89.175` (key: github_deploy_staging_v2)
- **Services**:
  - Next.js on port 3000 (PM2: frankbria-nextjs)
  - Strapi on port 1337 (PM2: frankbria-strapi)
- **Database**: PostgreSQL 16 (user: strapi_user, db: frankbria_strapi)

### Production Server (frankbria.com)
- **IP Address**: 172.236.252.223
- **SSH Access**: `ssh root@172.236.252.223` (key: github_actions_prod)
- **Services**:
  - Next.js on port 3000 (PM2: frankbria-nextjs)
  - Strapi on port 1337 (PM2: frankbria-strapi)
- **Database**: PostgreSQL 16 (user: strapi_user, db: frankbria_strapi)
- **Domains**:
  - https://frankbria.com (Next.js frontend)
  - https://api.frankbria.com (Strapi API)
- **SSL**: Let's Encrypt (auto-renewal configured)

## Environment Configuration

### GitHub Actions Secrets/Variables
**Production Environment**:
- `DEPLOY_HOST`: 172.236.252.223
- `DEPLOY_USER`: root
- `DEPLOY_SSH_KEY`: Production SSH private key
- `DEPLOY_PATH`: /var/nodejs/frankbria-com
- `STRAPI_DEPLOY_PATH`: /var/nodejs/frankbria-strapi
- `PM2_PROCESS_NAME`: frankbria-nextjs
- `STRAPI_PM2_NAME`: frankbria-strapi
- `SITE_URL`: https://frankbria.com
- `STRAPI_URL`: https://api.frankbria.com
- `STRAPI_API_TOKEN`: API token for Next.js to authenticate with Strapi

**Staging Environment**:
- Same structure with staging-specific values
- `SITE_URL`: https://beta.frankbria.com

## Deployment Workflows

### Frontend (Next.js)
- **Workflow**: `.github/workflows/deploy-frontend.yml`
- **Triggers**: Push to master (production), develop/claude/** (staging)
- **Process**:
  1. Build Next.js with environment variables
  2. SSH to server, pull latest code
  3. Install dependencies if package.json changed
  4. Build on server
  5. Restart PM2 process
  6. Health check verification

### Backend (Strapi)
- **Workflow**: `.github/workflows/deploy-backend.yml`
- **Triggers**: Manual only (workflow_dispatch)
- **Note**: Strapi is manually managed, not auto-deployed
- **Process**:
  1. SSH to server
  2. Check for git repository (optional)
  3. Install dependencies if needed
  4. Restart PM2 process

## Important Notes

- Next.js requires `.env.production` on server with `STRAPI_API_TOKEN` for runtime
- Strapi admin panel must be built: `npm run build`
- Database migrations from staging to production require password coordination
- nginx configured for both domains with SSL certificates