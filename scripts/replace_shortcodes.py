#!/usr/bin/env python3
"""
Replace WordPress shortcodes in Strapi posts with proper HTML.
This script directly updates the content in Strapi via the API.
"""
import os
import re
import sys
import json
import requests
from typing import Dict, List, Optional
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.server')

STRAPI_URL = os.getenv('STRAPI_URL', 'http://localhost:1337')
STRAPI_API_TOKEN = os.getenv('STRAPI_API_TOKEN')
SPOTIFY_SHOW_ID = os.getenv('SPOTIFY_SHOW_ID', 'YOUR_SHOW_ID')  # Update this

# Dry run mode - won't actually update Strapi
DRY_RUN = True


def extract_youtube_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats."""
    # Handle youtube.com/watch?v=ID
    if 'youtube.com/watch' in url:
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        return params.get('v', [None])[0]

    # Handle youtu.be/ID
    if 'youtu.be/' in url:
        return url.split('youtu.be/')[-1].split('?')[0]

    # Handle youtube.com/embed/ID
    if 'youtube.com/embed/' in url:
        return url.split('/embed/')[-1].split('?')[0]

    return None


def replace_podcast_subscribe(content: str) -> tuple[str, int]:
    """Replace [podcast_subscribe] with Spotify button HTML."""
    pattern = r'\[podcast_subscribe[^\]]*\]'
    count = len(re.findall(pattern, content))

    replacement = f'''<div class="my-6">
  <a href="https://open.spotify.com/show/{SPOTIFY_SHOW_ID}"
     target="_blank"
     rel="noopener noreferrer"
     class="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
    Subscribe on Spotify
  </a>
</div>'''

    new_content = re.sub(pattern, replacement, content)
    return new_content, count


def replace_youtube_embeds(content: str) -> tuple[str, int]:
    """Replace [youtube URL] with iframe embed."""
    pattern = r'\[youtube\s+(https?://[^\]]+)\]'
    matches = re.findall(pattern, content)
    count = len(matches)

    def create_embed(match):
        url = match.group(1)
        video_id = extract_youtube_id(url)
        if not video_id:
            return match.group(0)  # Return original if can't parse

        return f'''<div class="my-6 relative w-full" style="padding-bottom: 56.25%;">
  <iframe
    class="absolute top-0 left-0 w-full h-full rounded-lg"
    src="https://www.youtube.com/embed/{video_id}"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen>
  </iframe>
</div>'''

    new_content = re.sub(pattern, create_embed, content)
    return new_content, count


def replace_audio_players(content: str) -> tuple[str, int]:
    """Replace [audio src="..."] with HTML5 audio element."""
    pattern = r'\[audio\s+src="([^"]+)"[^\]]*\]'
    matches = re.findall(pattern, content)
    count = len(matches)

    def create_player(match):
        audio_url = match.group(1)
        return f'''<div class="my-6">
  <audio controls class="w-full">
    <source src="{audio_url}" type="audio/mpeg">
    Your browser does not support the audio element.
  </audio>
</div>'''

    new_content = re.sub(pattern, create_player, content)
    return new_content, count


def replace_intense_tabs(content: str) -> tuple[str, int]:
    """Replace [intense_tabs] with HTML sections.
    Note: This is a simplified replacement - complex tabs may need manual review."""

    # Count tabs sections
    tab_pattern = r'\[intense_tabs[^\]]*\].*?\[/intense_tabs\]'
    count = len(re.findall(tab_pattern, content, re.DOTALL))

    # Replace opening tag
    content = re.sub(
        r'\[intense_tabs[^\]]*\]',
        '<div class="my-6 space-y-4">',
        content
    )

    # Replace individual tab with section
    content = re.sub(
        r'\[intense_tab\s+title="([^"]+)"[^\]]*\]',
        r'<div class="border-l-4 border-blue-600 pl-4"><h3 class="text-lg font-semibold mb-2">\1</h3>',
        content
    )

    # Replace closing tags
    content = re.sub(r'\[/intense_tab\]', '</div>', content)
    content = re.sub(r'\[/intense_tabs\]', '</div>', content)

    return content, count


def transform_post_content(content: str) -> tuple[str, Dict[str, int]]:
    """Apply all shortcode replacements to content."""
    stats = {}

    # Replace podcast subscribe buttons
    content, count = replace_podcast_subscribe(content)
    stats['podcast_subscribe'] = count

    # Replace YouTube embeds
    content, count = replace_youtube_embeds(content)
    stats['youtube'] = count

    # Replace audio players
    content, count = replace_audio_players(content)
    stats['audio'] = count

    # Replace intense tabs
    content, count = replace_intense_tabs(content)
    stats['intense_tabs'] = count

    return content, stats


def fetch_all_posts() -> List[Dict]:
    """Fetch all posts from Strapi."""
    if not STRAPI_API_TOKEN:
        print("❌ Error: STRAPI_API_TOKEN not set in .env.server")
        sys.exit(1)

    headers = {
        'Authorization': f'Bearer {STRAPI_API_TOKEN}',
        'Content-Type': 'application/json'
    }

    url = f'{STRAPI_URL}/api/posts?pagination[pageSize]=300'

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json().get('data', [])
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching posts: {e}")
        sys.exit(1)


def update_post(post_id: int, content: str) -> bool:
    """Update a post's content in Strapi."""
    headers = {
        'Authorization': f'Bearer {STRAPI_API_TOKEN}',
        'Content-Type': 'application/json'
    }

    url = f'{STRAPI_URL}/api/posts/{post_id}'
    payload = {
        'data': {
            'content': content
        }
    }

    try:
        response = requests.put(url, json=payload, headers=headers)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Error updating post {post_id}: {e}")
        return False


def main():
    """Main transformation logic."""
    global DRY_RUN

    # Check for --execute flag
    if '--execute' in sys.argv:
        DRY_RUN = False
        print("⚠️  LIVE MODE: Changes will be written to Strapi")
    else:
        print("🔍 DRY RUN MODE: No changes will be made")
        print("   Run with --execute to apply changes\n")

    print("=" * 60)
    print("WordPress Shortcode Replacement")
    print("=" * 60)
    print(f"Strapi URL: {STRAPI_URL}\n")

    # Fetch all posts
    print("📥 Fetching posts from Strapi...")
    posts = fetch_all_posts()
    print(f"   Found {len(posts)} posts\n")

    # Track statistics
    total_stats = {
        'posts_processed': 0,
        'posts_modified': 0,
        'posts_failed': 0,
        'podcast_subscribe': 0,
        'youtube': 0,
        'audio': 0,
        'intense_tabs': 0
    }

    # Process each post
    print("🔄 Processing posts...")
    for i, post in enumerate(posts, 1):
        post_id = post['id']
        title = post['attributes'].get('title', 'Untitled')
        content = post['attributes'].get('content', '')

        # Transform content
        new_content, stats = transform_post_content(content)

        # Check if content changed
        if new_content != content:
            print(f"\n[{i}/{len(posts)}] {title}")
            print(f"   Changes:")
            for shortcode, count in stats.items():
                if count > 0:
                    print(f"     - {shortcode}: {count} replacement(s)")
                    total_stats[shortcode] += count

            # Update in Strapi (if not dry run)
            if not DRY_RUN:
                if update_post(post_id, new_content):
                    print(f"   ✅ Updated in Strapi")
                    total_stats['posts_modified'] += 1
                else:
                    print(f"   ❌ Failed to update")
                    total_stats['posts_failed'] += 1
            else:
                total_stats['posts_modified'] += 1

        total_stats['posts_processed'] += 1

    # Print summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Posts processed: {total_stats['posts_processed']}")
    print(f"Posts modified: {total_stats['posts_modified']}")
    if not DRY_RUN:
        print(f"Posts failed: {total_stats['posts_failed']}")
    print(f"\nShortcodes replaced:")
    print(f"  - [podcast_subscribe]: {total_stats['podcast_subscribe']}")
    print(f"  - [youtube]: {total_stats['youtube']}")
    print(f"  - [audio]: {total_stats['audio']}")
    print(f"  - [intense_tabs]: {total_stats['intense_tabs']}")

    if DRY_RUN:
        print("\n⚠️  This was a DRY RUN - no changes were made")
        print("   Run with --execute to apply changes")
    else:
        print("\n✅ Shortcode replacement complete!")


if __name__ == '__main__':
    main()
