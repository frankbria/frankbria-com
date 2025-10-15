## Server Infrastructure

### Staging Server (beta.frankbria.com)
- **IP Address**: ************
- **SSH Access**: `ssh root@************` (key: github_deploy_staging_v2)
- **Services**:
  - Next.js on port 3000 (PM2: frankbria-nextjs)
  - Strapi on port 1337 (PM2: frankbria-strapi)
- **Database**: PostgreSQL 16 (user: strapi_user, db: frankbria_strapi)

### Production Server (frankbria.com)
- **IP Address**: ***************
- **SSH Access**: `ssh root@***************` (key: github_actions_prod)
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
- `DEPLOY_HOST`: ***************
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

# Claude Code Instructions for frankbria-com

## Project Overview

WordPress to Next.js migration for frankbria.com using:
- **Frontend**: Next.js 15 with App Router, React 19, Tailwind CSS
- **CMS**: Strapi 5 headless CMS
- **Database**: PostgreSQL
- **Deployment**: PM2 + nginx on Ubuntu server
- **Domain**: beta.frankbria.com (staging) → frankbria.com (production)

## Issue Tracking

This project uses **beads** for dependency-aware issue tracking.

### Quick Commands
```bash
bd list              # List all issues
bd ready             # Show unblocked issues (ready to work)
bd show <issue-id>   # View issue details
bd update <issue-id> --status in_progress  # Start working
bd close <issue-id>  # Mark complete
bd dep tree <issue-id>  # Show dependency tree
```

### Issue Naming Convention
- Prefix: `frankbria-com-`
- Example: `frankbria-com-5`

### Database Location
- Local: `.beads/frankbria-com.db` (committed to git)
- Auto-syncs with JSONL exports

## Development Workflow

### Running Locally
```bash
npm run dev  # Next.js dev server on http://localhost:3000
```

### Environment Variables
Copy `.env.local.example` to `.env.local` and configure:
- `NEXT_PUBLIC_STRAPI_URL` - Strapi API URL
- `STRAPI_API_TOKEN` - API token for content fetching
- `REVALIDATION_SECRET` - Secret for on-demand revalidation

### Key Documentation
- Migration plan: `docs/migration-plan.md`
- Testing checklist: `docs/testing-checklist.md`
- Production cutover: `docs/production-cutover-plan.md`
- Nginx uploads fix: `docs/nginx-uploads-fix.md`
- Blog 404 fix: `docs/blog-404-fix.md`

## Architecture Notes

### Content Rendering
- WordPress content contains Gutenberg blocks (HTML)
- Use `dangerouslySetInnerHTML` to render (content from trusted Strapi source)
- **NOT Markdown** - removed react-markdown dependency

### Strapi 5 API Response Format
Different query types return different structures:
- **Collection queries** (`getAllPosts`): Returns `{id, attributes: {...}}`
- **Filtered queries** (`getPostBySlug`): May return flat structure
- See `lib/strapi.ts` for normalization logic

### ISR Configuration
- Blog posts: 1 hour revalidation + on-demand via webhook
- Pages: 1 hour revalidation
- Homepage: 60 seconds revalidation

### Known Issues
- WordPress shortcodes visible in content (tracked in beads)
- Missing placeholder images (tracked in beads)

## Deployment

### Deploy to Server
```bash
./scripts/deploy.sh beta  # Deploy to beta.frankbria.com
```

### Server Access
```bash
ssh frankbria-server  # Configured in ~/.ssh/config
```

### PM2 Processes
- `nextjs` - Next.js application (port 3000)
- `strapi` - Strapi CMS (port 1337)

## Before Making Changes

1. Check beads for relevant issues: `bd list`
2. Review migration plan status: `docs/migration-plan.md`
3. Understand the architecture (WordPress → Strapi → Next.js)
4. Test locally before deploying

## Current Status

Migration is in **beta testing** phase. All core functionality complete. Outstanding tasks tracked in beads (run `bd ready` to see what's ready to work on).
