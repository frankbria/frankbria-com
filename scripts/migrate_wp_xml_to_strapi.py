#!/usr/bin/env python3
"""
Migrate WordPress content to Strapi CMS from XML export.
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

    if not os.path.exists(WP_XML_EXPORT):
        print(f"❌ Error: WordPress XML export not found: {WP_XML_EXPORT}")
        sys.exit(1)

    print("=" * 70)
    print("🔄 WordPress to Strapi Migration (XML)")
    print("=" * 70)
    print(f"Source: {WP_XML_EXPORT}")
    print(f"Target: {STRAPI_URL}")
    print("=" * 70)

    # Initialize parser and client
    print("\n📊 Parsing WordPress XML export...")
    parser = WordPressXMLParser(WP_XML_EXPORT)
    strapi = StrapiClient(STRAPI_URL, STRAPI_API_TOKEN)

    # Extract WordPress content
    posts = parser.extract_posts()

    posts_only = [p for p in posts if p['type'] == 'post']
    pages_only = [p for p in posts if p['type'] == 'page']

    print(f"\n📝 Content Summary:")
    print(f"   - Posts: {len(posts_only)}")
    print(f"   - Pages: {len(pages_only)}")

    # Migrate posts
    print(f"\n📝 Migrating {len(posts_only)} posts...")
    success_count = 0
    failed_posts = []

    for i, post in enumerate(posts_only, 1):
        print(f"   [{i}/{len(posts_only)}] Migrating: {post['title'][:60]}...")
        result = strapi.create_post(post)

        if result:
            success_count += 1
            print(f"      ✅ Success (ID: {result['data']['id']})")
        else:
            failed_posts.append(post['title'])

        time.sleep(0.5)  # Rate limiting

    print(f"\n   ✅ Successfully migrated {success_count}/{len(posts_only)} posts")
    if failed_posts:
        print(f"   ❌ Failed posts ({len(failed_posts)}):")
        for title in failed_posts[:5]:
            print(f"      - {title}")

    # Migrate pages
    page_success = 0
    failed_pages = []

    if pages_only:
        print(f"\n📄 Migrating {len(pages_only)} pages...")

        for i, page in enumerate(pages_only, 1):
            print(f"   [{i}/{len(pages_only)}] Migrating: {page['title'][:60]}...")
            result = strapi.create_page(page)

            if result:
                page_success += 1
                print(f"      ✅ Success (ID: {result['data']['id']})")
            else:
                failed_pages.append(page['title'])

            time.sleep(0.5)

        print(f"\n   ✅ Successfully migrated {page_success}/{len(pages_only)} pages")
        if failed_pages:
            print(f"   ❌ Failed pages: {', '.join(failed_pages)}")

    # Generate migration report
    print(f"\n{'=' * 70}")
    print(f"🎉 Migration Complete!")
    print(f"{'=' * 70}")
    print(f"Posts: {success_count}/{len(posts_only)} successful")
    if pages_only:
        print(f"Pages: {page_success}/{len(pages_only)} successful")
    print(f"\nNext steps:")
    print(f"  1. Review content in Strapi admin: {STRAPI_URL}/admin")
    print(f"  2. Verify post content and formatting")

    # Save migration report
    report_path = 'docs/migration-report-xml.txt'
    with open(report_path, 'w') as f:
        f.write(f"Migration Report (XML) - {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"{'=' * 70}\n\n")
        f.write(f"Posts: {success_count}/{len(posts_only)} successful\n")
        if pages_only:
            f.write(f"Pages: {page_success}/{len(pages_only)} successful\n")
        if failed_posts:
            f.write(f"\nFailed Posts:\n")
            for post in failed_posts:
                f.write(f"  - {post}\n")
        if pages_only and failed_pages:
            f.write(f"\nFailed Pages:\n")
            for page in failed_pages:
                f.write(f"  - {page}\n")

    print(f"\n📄 Migration report saved to: {report_path}")

    # Verification
    print(f"\n🔍 Verifying migration...")
    strapi_posts = strapi.get_all_posts()
    strapi_pages = strapi.get_all_pages()
    print(f"   Strapi now has {len(strapi_posts)} posts and {len(strapi_pages)} pages")

    if len(strapi_posts) >= success_count and len(strapi_pages) >= page_success:
        print(f"   ✅ Verification passed!")
    else:
        print(f"   ⚠️  Verification mismatch - please review Strapi admin")


if __name__ == '__main__':
    main()
