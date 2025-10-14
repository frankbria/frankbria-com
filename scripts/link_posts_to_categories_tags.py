#!/usr/bin/env python3
"""
Link WordPress posts to their correct categories and tags in Strapi.
"""
import os
import sys
import time
from dotenv import load_dotenv
from utils.wp_xml_parser import WordPressXMLParser
from utils.strapi_client import StrapiClient


def main():
    # Load environment variables
    load_dotenv('.env.server')

    # Configuration
    WP_XML_EXPORT = '/mnt/d/dropbox/frankbria.com/website/wordpress-export.xml'
    STRAPI_URL = os.getenv('STRAPI_URL', 'https://beta.frankbria.com')
    STRAPI_API_TOKEN = os.getenv('STRAPI_API_TOKEN')

    if not STRAPI_API_TOKEN:
        print("❌ Error: STRAPI_API_TOKEN not found in .env.server")
        sys.exit(1)

    print("=" * 70)
    print("🔗 Linking Posts to Categories & Tags")
    print("=" * 70)
    print(f"Source: {WP_XML_EXPORT}")
    print(f"Target: {STRAPI_URL}")
    print("=" * 70)

    # Initialize parser and client
    parser = WordPressXMLParser(WP_XML_EXPORT)
    strapi = StrapiClient(STRAPI_URL, STRAPI_API_TOKEN)

    # Step 1: Get existing categories and tags from Strapi
    print("\n📁 Step 1: Fetching existing categories and tags...")

    all_categories = strapi.get_all_categories()
    category_map = {cat.get('slug'): cat.get('id') for cat in all_categories if cat.get('slug')}
    print(f"   ✅ Found {len(all_categories)} categories")

    all_tags = strapi.get_all_tags()
    tag_map = {tag.get('slug'): tag.get('id') for tag in all_tags if tag.get('slug')}
    print(f"   ✅ Found {len(all_tags)} tags")

    # Step 2: Extract posts with categories/tags from WordPress XML
    print("\n📊 Step 2: Extracting posts from WordPress XML...")

    posts = parser.extract_posts()
    posts_only = [p for p in posts if p['type'] == 'post']
    print(f"   ✅ Found {len(posts_only)} posts")

    # Step 3: Get all posts from Strapi
    print("\n🔍 Step 3: Fetching posts from Strapi...")

    strapi_posts = strapi.get_all_posts()
    print(f"   ✅ Found {len(strapi_posts)} posts in Strapi")

    # Create a map of wpPostId to Strapi post documentId
    wp_to_strapi_map = {}
    for strapi_post in strapi_posts:
        wp_id = strapi_post.get('wpPostId')
        document_id = strapi_post.get('documentId')
        if wp_id and document_id:
            wp_to_strapi_map[wp_id] = document_id

    # Step 4: Link posts to categories and tags
    print("\n🔗 Step 4: Linking posts to categories and tags...")

    updated_count = 0
    skipped_count = 0
    failed_count = 0

    for i, post in enumerate(posts_only, 1):
        wp_post_id = post['id']
        strapi_document_id = wp_to_strapi_map.get(wp_post_id)

        if not strapi_document_id:
            print(f"   [{i}/{len(posts_only)}] ⚠️  Post ID {wp_post_id} not found in Strapi")
            failed_count += 1
            continue

        # Get category and tag IDs for this post
        post_category_ids = []
        for cat in post.get('categories', []):
            cat_id = category_map.get(cat['slug'])
            if cat_id:
                post_category_ids.append(cat_id)

        post_tag_ids = []
        for tag in post.get('tags', []):
            tag_id = tag_map.get(tag['slug'])
            if tag_id:
                post_tag_ids.append(tag_id)

        if not post_category_ids and not post_tag_ids:
            skipped_count += 1
            continue  # No categories or tags for this post

        # Update post with category and tag links
        update_data = {}
        if post_category_ids:
            update_data['categories'] = post_category_ids
        if post_tag_ids:
            update_data['tags'] = post_tag_ids

        print(f"   [{i}/{len(posts_only)}] {post['title'][:50]}...")
        result = strapi.update_post(strapi_document_id, update_data)

        if result:
            updated_count += 1
            cats_str = f"{len(post_category_ids)} cat" if post_category_ids else ""
            tags_str = f"{len(post_tag_ids)} tag" if post_tag_ids else ""
            sep = " + " if cats_str and tags_str else ""
            print(f"      ✅ Linked: {cats_str}{sep}{tags_str}")
        else:
            failed_count += 1

        time.sleep(0.2)  # Rate limiting

    # Final report
    print(f"\n{'=' * 70}")
    print(f"🎉 Linking Complete!")
    print(f"{'=' * 70}")
    print(f"Posts updated: {updated_count}/{len(posts_only)}")
    print(f"Posts skipped (no categories/tags): {skipped_count}")
    if failed_count > 0:
        print(f"Failed: {failed_count}")


if __name__ == '__main__':
    main()
