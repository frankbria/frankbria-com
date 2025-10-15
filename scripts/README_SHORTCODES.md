# WordPress Shortcode Replacement Script

## Overview

This script replaces WordPress shortcodes in Strapi blog posts with proper HTML elements. It connects directly to the Strapi API and updates post content in place.

## Replaced Shortcodes

| Shortcode | Replacement |
|-----------|-------------|
| `[podcast_subscribe]` | Spotify subscribe button |
| `[youtube URL]` | Responsive YouTube iframe embed |
| `[audio src="..."]` | HTML5 audio player |
| `[intense_tabs]` | HTML sections with styled headings |

## Prerequisites

1. **Environment Variables** - Create `.env.server` with:
   ```bash
   STRAPI_URL=http://localhost:1337
   STRAPI_API_TOKEN=your_api_token_here
   SPOTIFY_SHOW_ID=your_spotify_show_id
   ```

2. **Python Dependencies**:
   ```bash
   pip install requests python-dotenv
   ```

3. **Strapi API Access** - Need valid API token with read/write permissions for posts

## Usage

### Step 1: Dry Run (Preview Changes)

```bash
python scripts/replace_shortcodes.py
```

This will:
- Fetch all posts from Strapi
- Show what would be changed
- **NOT** modify any content

### Step 2: Review Output

The script will show:
- Which posts contain shortcodes
- What replacements will be made
- Count of each shortcode type

Example output:
```
[15/210] Episode 120: The Best of Series
   Changes:
     - podcast_subscribe: 1 replacement(s)
     - youtube: 2 replacement(s)
```

### Step 3: Execute Changes

**⚠️ WARNING**: This will modify content in Strapi!

```bash
python scripts/replace_shortcodes.py --execute
```

## SSH Tunnel (If Accessing Server Strapi)

If Strapi is running on the server, create an SSH tunnel first:

```bash
ssh -L 1337:localhost:1337 frankbria-server
```

Then run the script in another terminal. It will connect to `localhost:1337` which tunnels to the server.

## HTML Output Examples

### Podcast Subscribe Button
```html
<div class="my-6">
  <a href="https://open.spotify.com/show/YOUR_SHOW_ID"
     target="_blank"
     class="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white...">
    <svg>...</svg>
    Subscribe on Spotify
  </a>
</div>
```

### YouTube Embed
```html
<div class="my-6 relative w-full" style="padding-bottom: 56.25%;">
  <iframe src="https://www.youtube.com/embed/VIDEO_ID" ...></iframe>
</div>
```

### Audio Player
```html
<div class="my-6">
  <audio controls class="w-full">
    <source src="AUDIO_URL" type="audio/mpeg">
  </audio>
</div>
```

### Tabs (Simplified)
```html
<div class="my-6 space-y-4">
  <div class="border-l-4 border-blue-600 pl-4">
    <h3 class="text-lg font-semibold mb-2">Tab Title</h3>
    <!-- Tab content -->
  </div>
</div>
```

## Rollback

If something goes wrong:

1. **Via Strapi Admin**: Edit posts individually to revert
2. **Via Backup**: Restore from PostgreSQL backup if available
3. **Via Git**: The script doesn't modify your codebase, only Strapi content

## Testing Strategy

1. **Start with dry run** to see what would change
2. **Test on a few posts first**: Modify the script to process only specific post IDs
3. **Verify in Strapi admin** before and after
4. **Check blog posts on site** after changes

## Troubleshooting

**Script can't connect to Strapi:**
- Check `STRAPI_URL` is correct
- Verify API token is valid
- Ensure Strapi is running
- Check firewall/network access

**No changes detected:**
- Verify posts actually contain shortcodes
- Check shortcode format matches patterns in script

**Changes don't appear on site:**
- Clear Next.js cache: `rm -rf .next && npm run build`
- Trigger revalidation via webhook
- Check browser cache

## Notes

- Script is idempotent - safe to run multiple times
- Already-replaced content won't be re-replaced
- Script preserves all other content exactly as-is
- Uses Tailwind CSS classes for styling
