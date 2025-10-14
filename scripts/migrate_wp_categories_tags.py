#!/usr/bin/env python3
"""
Migrate WordPress categories and tags to Strapi and link them to posts.
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
    print("🏷️  WordPress Categories & Tags Migration")
    print("=" * 70)
    print(f"Source: {WP_XML_EXPORT}")
    print(f"Target: {STRAPI_URL}")
    print("=" * 70)

    # Initialize parser and client
    parser = WordPressXMLParser(WP_XML_EXPORT)
    strapi = StrapiClient(STRAPI_URL, STRAPI_API_TOKEN)

    # Step 1: Purge existing categories and tags
    print("\n🗑️  Step 1: Purging existing categories and tags...")

    existing_categories = strapi.get_all_categories()
    print(f"   Found {len(existing_categories)} existing categories")

    if existing_categories:
        print(f"   Deleting categories...")
        deleted_cats = 0
        for cat in existing_categories:
            cat_id = cat.get('id')
            if strapi.delete_category(cat_id):
                deleted_cats += 1
            time.sleep(0.1)  # Rate limiting
        print(f"   ✅ Deleted {deleted_cats}/{len(existing_categories)} categories")

    existing_tags = strapi.get_all_tags()
    print(f"   Found {len(existing_tags)} existing tags")

    if existing_tags:
        print(f"   Deleting tags...")
        deleted_tags = 0
        for tag in existing_tags:
            tag_id = tag.get('id')
            if strapi.delete_tag(tag_id):
                deleted_tags += 1
            time.sleep(0.1)  # Rate limiting
        print(f"   ✅ Deleted {deleted_tags}/{len(existing_tags)} tags")

    # Step 2: Extract unique categories and tags from WordPress XML
    print("\n📊 Step 2: Extracting categories and tags from WordPress XML...")

    posts = parser.extract_posts()

    # Collect all unique categories and tags
    unique_categories = {}
    unique_tags = {}

    for post in posts:
        for cat in post.get('categories', []):
            if cat['slug'] not in unique_categories:
                unique_categories[cat['slug']] = cat

        for tag in post.get('tags', []):
            if tag['slug'] not in unique_tags:
                unique_tags[tag['slug']] = tag

    print(f"   ✅ Found {len(unique_categories)} unique categories")
    print(f"   ✅ Found {len(unique_tags)} unique tags")

    # Step 3: Create categories in Strapi
    print("\n📁 Step 3: Creating categories in Strapi...")

    category_map = {}  # Maps WordPress slug to Strapi ID

    for slug, cat_data in sorted(unique_categories.items()):
        print(f"   Creating category: {cat_data['name']}")
        result = strapi.create_category(cat_data)

        if result:
            strapi_id = result['data']['id']
            category_map[slug] = strapi_id
            print(f"      ✅ Created (ID: {strapi_id})")
        else:
            print(f"      ❌ Failed to create category: {cat_data['name']}")

        time.sleep(0.3)

    print(f"\n   ✅ Successfully created {len(category_map)}/{len(unique_categories)} categories")

    # Step 4: Create tags in Strapi
    print("\n🏷️  Step 4: Creating tags in Strapi...")

    tag_map = {}  # Maps WordPress slug to Strapi ID

    for slug, tag_data in sorted(unique_tags.items()):
        print(f"   Creating tag: {tag_data['name']}")
        result = strapi.create_tag(tag_data)

        if result:
            strapi_id = result['data']['id']
            tag_map[slug] = strapi_id
            print(f"      ✅ Created (ID: {strapi_id})")
        else:
            print(f"      ❌ Failed to create tag: {tag_data['name']}")

        time.sleep(0.3)

    print(f"\n   ✅ Successfully created {len(tag_map)}/{len(unique_tags)} tags")

    # Step 5: Update posts to link to categories and tags
    print("\n🔗 Step 5: Linking posts to categories and tags...")

    # Get all posts from Strapi
    strapi_posts = strapi.get_all_posts()
    print(f"   Found {len(strapi_posts)} posts in Strapi")

    # Create a map of wpPostId to Strapi post ID
    wp_to_strapi_map = {}
    for strapi_post in strapi_posts:
        wp_id = strapi_post.get('wpPostId')
        strapi_id = strapi_post.get('id')
        if wp_id and strapi_id:
            wp_to_strapi_map[wp_id] = strapi_id

    # Update each post with its categories and tags
    updated_count = 0
    failed_count = 0

    posts_only = [p for p in posts if p['type'] == 'post']

    for post in posts_only:
        wp_post_id = post['id']
        strapi_post_id = wp_to_strapi_map.get(wp_post_id)

        if not strapi_post_id:
            print(f"   ⚠️  Warning: Post '{post['title'][:50]}' not found in Strapi")
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
            continue  # No categories or tags for this post

        # Update post with category and tag links
        update_data = {}
        if post_category_ids:
            update_data['categories'] = post_category_ids
        if post_tag_ids:
            update_data['tags'] = post_tag_ids

        print(f"   [{updated_count + 1}/{len(posts_only)}] Updating: {post['title'][:50]}...")
        result = strapi.update_post(strapi_post_id, update_data)

        if result:
            updated_count += 1
            cats_str = f"{len(post_category_ids)} categories" if post_category_ids else ""
            tags_str = f"{len(post_tag_ids)} tags" if post_tag_ids else ""
            sep = " and " if cats_str and tags_str else ""
            print(f"      ✅ Linked to {cats_str}{sep}{tags_str}")
        else:
            failed_count += 1

        time.sleep(0.3)

    # Final report
    print(f"\n{'=' * 70}")
    print(f"🎉 Category & Tag Migration Complete!")
    print(f"{'=' * 70}")
    print(f"Categories created: {len(category_map)}/{len(unique_categories)}")
    print(f"Tags created: {len(tag_map)}/{len(unique_tags)}")
    print(f"Posts updated: {updated_count}/{len(posts_only)}")
    if failed_count > 0:
        print(f"Failed updates: {failed_count}")
    print(f"\nNext steps:")
    print(f"  1. Review categories and tags in Strapi admin")
    print(f"  2. Verify posts are linked to correct categories/tags")


if __name__ == '__main__':
    main()
