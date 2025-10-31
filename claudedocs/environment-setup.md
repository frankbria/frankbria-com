# Environment Setup Notes

## Strapi API Token

**IMPORTANT**: When setting up `.env.local` for the Next.js frontend, always copy the `STRAPI_API_TOKEN` from `.env.server`.

### Token Location
- **Source**: `.env.server` (contains the real Strapi API token)
- **Destination**: `.env.local` (needed for frontend to fetch posts)

### Required Environment Variables in `.env.local`
```
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<copy from .env.server>
REVALIDATION_SECRET=<your secret>
```

### Why This Matters
After context compactification, Claude often finds `.env.local` with placeholder values like `your_api_token_here`. This causes 401 Unauthorized errors when fetching posts from Strapi.

**Solution**: Always check `.env.server` for the real token value.

### SSH Tunnel
Strapi runs on the remote server. Access via SSH tunnel:
```bash
ssh -f -N -L 1337:localhost:1337 frankbria-server
```

Check tunnel is running:
```bash
ps aux | grep "ssh.*1337"
```

### Testing Strapi Connection
Without auth (should return 403):
```bash
curl http://localhost:1337/api/posts
```

With auth (should return posts):
```bash
curl -H "Authorization: Bearer $(grep STRAPI_API_TOKEN .env.local | cut -d'=' -f2)" \
  http://localhost:1337/api/posts?pagination[pageSize]=1
```

## Remote Server and Media Files

### Server Location
- **Remote server**: beta.frankbria.com
- **SSH access**: Available (use `ssh frankbria-server` or configure in ~/.ssh/config)
- **Strapi location**: Running on remote server, accessible via SSH tunnel

### Media Files
- **Image files**: Located at `/var/nodejs/frankbria-strapi/public/uploads/` on remote server
- **Podcast audio files**: **NOT CURRENTLY AVAILABLE** (see `claudedocs/known-issues.md`)
  - Buzzsprout account no longer accessible
  - Files were not migrated during WordPress import
  - Need to locate original .mp3 files before implementing audio playback
