# Hardcoded URL Fix

**Date**: 2025-11-10
**Status**: ✅ Completed

## Problem

Many image URLs in the codebase were hardcoded to `https://beta.frankbria.com/uploads/*`, which would cause issues when the site moves to production at `https://frankbria.com`.

## Solution

Replaced all hardcoded absolute URLs with relative paths starting with `/uploads/*`. This makes the URLs work correctly on both staging and production environments.

## Changes Made

### Files Updated

1. **app/page.tsx** (5 images):
   - Frank Bria headshot: `/uploads/2024/01/frank-bria-headshot-pro-400x516.png`
   - HTP Logo: `/uploads/2019/05/HTP-Logo-bk-e1557603932149-400x133.png`
   - Scale book cover: `/uploads/2020/03/3d_book_2_med.png`
   - Seven Billion Banks book: `/uploads/2020/03/3d_book.png`
   - 6 to 7 Figures podcast: `/uploads/2019/05/6_to_7_figures_cover_sq_300.jpg`

2. **components/Header.tsx** (1 image):
   - Logo: `/uploads/2015/12/logo_back_clipped_rev_1-e1572167361317.png`

### Files NOT Changed (Intentional)

- **next.config.js**: Image hostname configuration includes both `beta.frankbria.com` and `frankbria.com` - this is correct
- **scripts/swap-categories-tags.js**: Uses `process.env.STRAPI_URL` with fallback - acceptable for utility script
- **.github/workflows/deploy-frontend.yml**: Uses GitHub variable with fallback - correct for CI/CD
- **Documentation files**: References to beta.frankbria.com in docs are intentional for documentation purposes

## Testing

✅ Dev server starts successfully with relative URLs
✅ Images served correctly from `/uploads/*` paths via nginx proxy

## Impact

- ✅ Site now works correctly on both staging (beta.frankbria.com) and production (frankbria.com)
- ✅ No hardcoded environment-specific URLs in application code
- ✅ Easier production deployment process

## Related Issues

- Addresses production cutover preparation (frankbria-com-8)
- Supports beta testing period (frankbria-com-7)
