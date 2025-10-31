# Quick Start: Swap Categories and Tags

## Problem
- Categories: ~600 (should be ~6)
- Tags: ~6 (should be ~600)

## Solution: 3 Steps

### 1. Backup (CRITICAL!)
```bash
ssh root@47.88.89.175
cd /var/nodejs/frankbria-strapi

# Backup PostgreSQL database
PGPASSWORD='$POSTGRES_PASSWORD' pg_dump -h localhost -U strapi_user -d frankbria_strapi > ~/strapi_backup_$(date +%Y%m%d-%H%M%S).sql

# Verify backup exists
ls -lh ~/strapi_backup*.sql
```

### 2. Get API Token
```bash
ssh root@47.88.89.175 "cat /var/nodejs/frankbria-strapi/.env | grep STRAPI_API_TOKEN"
```

### 3. Run Swap Script
```bash
# On server (recommended - faster)
ssh root@47.88.89.175
cd /var/nodejs/frankbria-com
git pull origin claude/wp-site-deployment-011CULpfpFvx2WjK4FMWRoNf
export STRAPI_API_TOKEN=$(cat /var/nodejs/frankbria-strapi/.env | grep STRAPI_API_TOKEN | cut -d '=' -f2)
node scripts/swap-categories-tags.js
```

## Verify
- Strapi Admin: Categories should be ~6, Tags should be ~600
- Website: Category badges on blog should show actual categories

## Rollback (if needed)
```bash
ssh root@47.88.89.175

# Stop Strapi
pm2 stop strapi

# Restore PostgreSQL database
PGPASSWORD='$POSTGRES_PASSWORD' psql -h localhost -U strapi_user -d frankbria_strapi < ~/strapi_backup_YYYYMMDD-HHMMSS.sql

# Restart Strapi
pm2 restart strapi
pm2 logs strapi --lines 50
```

## Full Documentation
See `docs/SWAP_CATEGORIES_TAGS.md` for complete guide