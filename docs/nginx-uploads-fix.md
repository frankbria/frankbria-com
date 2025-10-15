# Nginx Uploads Path Fix

## Issue
Images uploaded to Strapi admin panel were returning 404 errors when accessed via `https://beta.frankbria.com/uploads/*`

## Root Cause
The nginx configuration was missing a location block for `/uploads`, causing requests to fall through to the Next.js application (port 3001) instead of being routed to Strapi (port 1337) where the uploaded files are stored.

## Diagnosis
1. **Verified files exist**: Located in `/var/nodejs/frankbria-strapi/public/uploads/`
   ```bash
   ls -la /var/nodejs/frankbria-strapi/public/uploads/
   # Files present: frankbria_logo_small_091c8a4dc5.png, etc.
   ```

2. **Confirmed Strapi serves files locally**:
   ```bash
   curl -I http://localhost:1337/uploads/frankbria_logo_small_091c8a4dc5.png
   # HTTP/1.1 200 OK ✅
   ```

3. **Identified nginx routing issue**:
   ```bash
   curl -I https://beta.frankbria.com/uploads/frankbria_logo_small_091c8a4dc5.png
   # HTTP/2 404 with Next.js headers (x-powered-by: Next.js) ❌
   ```

## Solution
Added `/uploads` location block to nginx configuration to route upload requests to Strapi:

```nginx
location /uploads {
    proxy_pass http://localhost:1337/uploads;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Optional: Add caching for uploaded images
    proxy_cache_valid 200 7d;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
}
```

## Implementation Steps
1. Backed up nginx configuration
2. Created corrected configuration with `/uploads` block
3. Tested configuration: `nginx -t` ✅
4. Reloaded nginx: `systemctl reload nginx`
5. Verified fix: `curl -I https://beta.frankbria.com/uploads/...` returns HTTP 200 ✅

## Files Modified
- `/etc/nginx/sites-available/frankbria-beta`

## Verification
```bash
curl -I https://beta.frankbria.com/uploads/frankbria_logo_small_091c8a4dc5.png
# HTTP/2 200 ✅
# content-type: image/png ✅
# x-powered-by: Strapi <strapi.io> ✅
```

## Impact
- ✅ Images uploaded via Strapi admin now display correctly
- ✅ Media library no longer shows broken images
- ✅ Images persist after page refresh/save
- ✅ Frontend can now display Strapi-uploaded images

## Date
2025-10-15

## Related Tasks
- Task 13: Nginx Configuration and SSL (initial setup)
- Task 7: Media Migration (uploads directory setup)
