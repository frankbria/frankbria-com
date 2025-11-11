# Image Path Fix

**Date**: 2025-11-10
**Status**: ✅ Completed

## Problem

Many image URLs in the codebase were hardcoded to `https://beta.frankbria.com/uploads/*`. The initial attempt to use relative `/uploads/*` paths failed because those images don't exist in the Next.js application - they were served by Strapi on the remote server.

## Solution

Downloaded all required images from beta.frankbria.com and placed them in the `public/images/` directory. Updated all image references to use local `/images/*` paths. This ensures images are bundled with the application and work in all environments.

## Changes Made

### Images Downloaded to public/images/

1. **frank-bria-headshot.png** (376KB) - Homepage headshot
2. **htp-logo.png** (5KB) - High-Ticket Program logo
3. **scale-book.png** (121KB) - Scale book cover
4. **seven-billion-banks-book.png** (432KB) - Seven Billion Banks book cover
5. **podcast-cover.jpg** (21KB) - 6 to 7 Figures podcast cover
6. **logo.png** (7KB) - Site header logo

### Files Updated

1. **app/page.tsx** (5 images):
   - Frank Bria headshot: `/images/frank-bria-headshot.png`
   - HTP Logo: `/images/htp-logo.png`
   - Scale book cover: `/images/scale-book.png`
   - Seven Billion Banks book: `/images/seven-billion-banks-book.png`
   - 6 to 7 Figures podcast: `/images/podcast-cover.jpg`

2. **components/Header.tsx** (1 image):
   - Logo: `/images/logo.png`

### Files NOT Changed (Intentional)

- **next.config.js**: Image hostname configuration includes both `beta.frankbria.com` and `frankbria.com` - this is correct
- **scripts/swap-categories-tags.js**: Uses `process.env.STRAPI_URL` with fallback - acceptable for utility script
- **.github/workflows/deploy-frontend.yml**: Uses GitHub variable with fallback - correct for CI/CD
- **Documentation files**: References to beta.frankbria.com in docs are intentional for documentation purposes

## Testing

✅ Images downloaded successfully using `curl -L` (follow redirects)
✅ Build completes successfully with all images in place
✅ Images load correctly from `/images/*` paths in development

## Impact

- ✅ Images are self-contained in the Next.js application
- ✅ No dependency on external Strapi image serving
- ✅ Works in all environments (local, staging, production)
- ✅ Faster page loads (images served directly from Next.js)
- ✅ No hardcoded environment-specific URLs

## Related Issues

- Addresses production cutover preparation (frankbria-com-8)
- Supports beta testing period (frankbria-com-7)
