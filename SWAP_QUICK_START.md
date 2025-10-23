# Quick Start: Swap Categories and Tags

## Problem
- Categories: ~600 (should be ~6)
- Tags: ~6 (should be ~600)

## Solution: 3 Steps

### 1. Backup (CRITICAL!)
```bash
ssh root@47.88.89.175
cd /var/nodejs/frankbria-strapi
cp .tmp/data.db .tmp/data.db.backup-$(date +%Y%m%d-%H%M%S)
ls -lh .tmp/data.db.backup*  # Verify backup exists
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
cd /var/nodejs/frankbria-strapi
pm2 stop strapi
cp .tmp/data.db.backup-YYYYMMDD-HHMMSS .tmp/data.db
pm2 restart strapi
```

## Full Documentation
See `docs/SWAP_CATEGORIES_TAGS.md` for complete guide
