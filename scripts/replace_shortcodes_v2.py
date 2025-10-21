#!/usr/bin/env python3
"""
Replace WordPress shortcodes in Strapi posts with simple markers.
The frontend will parse these markers and render proper React components.
"""
import os
import re
import sys
import json
import requests
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.server')

STRAPI_URL = os.getenv('STRAPI_URL', 'http://localhost:1337')
STRAPI_API_TOKEN = os.getenv('STRAPI_API_TOKEN')
SPOTIFY_SHOW_ID = os.getenv('SPOTIFY_SHOW_ID', '0xcYcgrzcnsff0mkNX0fGh')

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


def replace_podcast_subscribe(content: str) -> Tuple[str, int]:
    """Replace [podcast_subscribe] OR existing HTML with simple marker."""
    # Pattern for original WordPress shortcode
    wp_pattern = r'\[podcast_subscribe[^\]]*\]'

    # Pattern for HTML we added in v1
    html_pattern = r'<div class="my-6">\s*<a href="https://open\.spotify\.com/show/[^"]+"\s+[^>]*>\s*<svg[^>]*>.*?</svg>\s*Subscribe on Spotify\s*</a>\s*</div>'

    # Count both types
    wp_count = len(re.findall(wp_pattern, content))
    html_count = len(re.findall(html_pattern, content, re.DOTALL))
    count = wp_count + html_count

    replacement = f'{{{{podcast-subscribe:{SPOTIFY_SHOW_ID}}}}}'

    # Replace both patterns
    new_content = re.sub(wp_pattern, replacement, content)
    new_content = re.sub(html_pattern, replacement, new_content, flags=re.DOTALL)

    return new_content, count


def replace_youtube_embeds(content: str) -> Tuple[str, int]:
    """Replace [youtube URL] OR WordPress YouTube blocks with simple marker."""
    # Pattern for original [youtube URL] shortcode
    shortcode_pattern = r'\[youtube\s+(https?://[^\]]+)\]'

    # Pattern for WordPress block format with URL in block comment and plain text URL in content
    # Matches: <!-- wp:core-embed/youtube ... --> ... https://www.youtube.com/watch?v=... ... <!-- /wp:core-embed/youtube -->
    wp_block_pattern = r'<!-- wp:core-embed/youtube[^>]*-->\s*<figure[^>]*>.*?<div[^>]*>\s*(https?://[^\s<]+)\s*</div>.*?</figure>\s*<!-- /wp:core-embed/youtube -->'

    # Count both types
    shortcode_matches = re.findall(shortcode_pattern, content)
    wp_block_matches = re.findall(wp_block_pattern, content, re.DOTALL)
    count = len(shortcode_matches) + len(wp_block_matches)

    def create_shortcode_marker(match):
        url = match.group(1)
        video_id = extract_youtube_id(url)
        if not video_id:
            return match.group(0)  # Return original if can't parse
        return f'{{{{youtube:{video_id}}}}}'

    def create_wp_block_marker(match):
        url = match.group(1)
        video_id = extract_youtube_id(url)
        if not video_id:
            return match.group(0)  # Return original if can't parse
        return f'{{{{youtube:{video_id}}}}}'

    # Replace both patterns
    new_content = re.sub(shortcode_pattern, create_shortcode_marker, content)
    new_content = re.sub(wp_block_pattern, create_wp_block_marker, new_content, flags=re.DOTALL)

    return new_content, count


def replace_audio_players(content: str) -> Tuple[str, int]:
    """Replace [audio src="..."] OR [buzzsprout episode='...'] with simple marker."""
    # Pattern for [audio src="URL"] shortcode
    audio_pattern = r'\[audio\s+src="([^"]+)"[^\]]*\]'

    # Pattern for Buzzsprout shortcode: [buzzsprout episode='EPISODE_ID' player='true']
    # Note: Buzzsprout episodes are typically embedded as players, but we'll convert to audio tag
    # The user will need to provide the actual audio URL or we'll use Buzzsprout's player URL
    buzzsprout_pattern = r'\[buzzsprout\s+episode=[\'"](\d+)[\'"][^\]]*\]'

    # Also handle <p> tags around Buzzsprout shortcodes
    buzzsprout_in_p_pattern = r'<p>\[buzzsprout\s+episode=[\'"](\d+)[\'"][^\]]*\]</p>'

    # Count matches
    audio_matches = re.findall(audio_pattern, content)
    buzzsprout_matches = re.findall(buzzsprout_pattern, content)
    buzzsprout_in_p_matches = re.findall(buzzsprout_in_p_pattern, content)
    count = len(audio_matches) + len(buzzsprout_matches) + len(buzzsprout_in_p_matches)

    def create_audio_marker(match):
        audio_url = match.group(1)
        return f'{{{{audio:{audio_url}}}}}'

    def create_buzzsprout_marker(match):
        episode_id = match.group(1)
        # Construct Buzzsprout player URL
        # Format: https://www.buzzsprout.com/SHOW_ID/EPISODE_ID.js?container_id=buzzsprout-player-EPISODE_ID&player=small
        # Or for direct audio: Use the mp3 URL if available
        # For now, we'll create a marker and the user can provide the actual URL
        # Common pattern: https://www.buzzsprout.com/SHOW_ID/EPISODE_ID.mp3
        return f'{{{{audio:https://www.buzzsprout.com/2036436/{episode_id}.mp3}}}}'

    # Replace all patterns
    new_content = re.sub(audio_pattern, create_audio_marker, content)
    new_content = re.sub(buzzsprout_in_p_pattern, create_buzzsprout_marker, new_content)
    new_content = re.sub(buzzsprout_pattern, create_buzzsprout_marker, new_content)

    return new_content, count


def replace_intense_tabs(content: str) -> Tuple[str, int]:
    """Replace [intense_tabs] OR existing HTML with simple tab markers."""

    # Count tabs sections - both WordPress shortcode and HTML versions
    wp_tab_pattern = r'\[intense_tabs[^\]]*\].*?\[/intense_tabs\]'
    html_tab_pattern = r'<div class="my-6 space-y-4">.*?</div>\s*</div>'

    wp_count = len(re.findall(wp_tab_pattern, content, re.DOTALL))
    html_count = len(re.findall(html_tab_pattern, content, re.DOTALL))
    count = wp_count + html_count

    # Replace WordPress shortcode format
    content = re.sub(
        r'\[intense_tabs[^\]]*\]',
        '{{tabs-start}}',
        content
    )

    content = re.sub(
        r'\[intense_tab\s+title="([^"]+)"[^\]]*\]',
        r'{{tab:\1}}',
        content
    )

    content = re.sub(r'\[/intense_tab\]', '{{/tab}}', content)
    content = re.sub(r'\[/intense_tabs\]', '{{/tabs}}', content)

    # Replace HTML format we added in v1
    # Opening div with class="my-6 space-y-4"
    content = re.sub(
        r'<div class="my-6 space-y-4">',
        '{{tabs-start}}',
        content
    )

    # Individual tab divs with border-l-4 and title in h3
    content = re.sub(
        r'<div class="border-l-4 border-blue-600 pl-4"><h3 class="text-lg font-semibold mb-2">([^<]+)</h3>',
        r'{{tab:\1}}',
        content
    )

    # Closing divs for tabs
    # This is trickier - we need to identify the closing </div> for each tab
    # For now, let's use a simpler approach and replace specific patterns
    content = re.sub(
        r'</div>\s*<div class="border-l-4 border-blue-600 pl-4">',
        '{{/tab}}\n<div class="border-l-4 border-blue-600 pl-4">',
        content
    )

    content = re.sub(
        r'</div>\s*</div>\s*<!-- /wp:shortcode -->',
        '{{/tab}}{{/tabs}}',
        content
    )

    # Fix standalone </div> tags that appear before {{tab: markers (leftover from incomplete conversion)
    content = re.sub(
        r'</div>\s*\n\s*(\{\{tab:)',
        r'{{/tab}}\n\1',
        content
    )

    return content, count


def transform_post_content(content: str) -> Tuple[str, Dict[str, int]]:
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


def fetch_all_posts(slug_filter: Optional[str] = None) -> List[Dict]:
    """Fetch all posts from Strapi, optionally filtered by slug pattern."""
    if not STRAPI_API_TOKEN:
        print("❌ Error: STRAPI_API_TOKEN not set in .env.server")
        sys.exit(1)

    headers = {
        'Authorization': f'Bearer {STRAPI_API_TOKEN}',
        'Content-Type': 'application/json'
    }

    # Use Strapi's filters for slug pattern
    if slug_filter:
        url = f'{STRAPI_URL}/api/posts?pagination[pageSize]=300&filters[slug][$startsWith]={slug_filter}'
    else:
        url = f'{STRAPI_URL}/api/posts?pagination[pageSize]=300'

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json().get('data', [])
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching posts: {e}")
        sys.exit(1)


def update_post(document_id: str, content: str) -> bool:
    """Update a post's content in Strapi."""
    headers = {
        'Authorization': f'Bearer {STRAPI_API_TOKEN}',
        'Content-Type': 'application/json'
    }

    url = f'{STRAPI_URL}/api/posts/{document_id}'
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
        print(f"❌ Error updating post {document_id}: {e}")
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

    # Check for --filter flag
    slug_filter = None
    for i, arg in enumerate(sys.argv):
        if arg == '--filter' and i + 1 < len(sys.argv):
            slug_filter = sys.argv[i + 1]
            break

    print("=" * 60)
    print("WordPress Shortcode Replacement (v2 - Simple Markers)")
    print("=" * 60)
    print(f"Strapi URL: {STRAPI_URL}")
    if slug_filter:
        print(f"Filter: slugs starting with '{slug_filter}'")
    print()

    # Fetch all posts
    print("📥 Fetching posts from Strapi...")
    posts = fetch_all_posts(slug_filter)
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
        # Use documentId for Strapi 5 API
        document_id = post.get('documentId')
        if not document_id:
            print(f"\n[{i}/{len(posts)}] ⚠️ Skipping post without documentId")
            continue

        # Handle both Strapi 5 response formats (with or without attributes wrapper)
        attrs = post.get('attributes', post)
        title = attrs.get('title', 'Untitled')
        content = attrs.get('content', '')

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
                if update_post(document_id, new_content):
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
