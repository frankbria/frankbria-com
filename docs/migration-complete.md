# WordPress to Strapi Migration - Complete

**Date Completed:** 2025-10-14
**Migration Type:** WordPress XML Export → Strapi 5
**Status:** ✅ Successfully Completed

## Overview

Successfully migrated all WordPress content (posts, categories, tags) from WordPress XML export to Strapi 5 headless CMS.

## Migration Results

### Content Migrated
- **Posts:** 210/210 (100% success)
- **Categories:** 8 WordPress categories migrated and linked
- **Tags:** 6 WordPress tags migrated and linked
- **Pages:** 0 (no published pages in WordPress export)

### Categories Migrated
1. 6 to 7 Figures Show (`6-to-7-figures-show`)
2. Coaching Program Templates (`coaching-program-templates`)
3. Group Coaching Model (`group-coaching-model`)
4. Lead Generation Metrics (`lead-generation-metrics`)
5. LinkedIn Business Model (`linkedin-business-model`)
6. Scale to Success (`scale-to-success`)
7. Think Tank (`think-tank`)
8. Time for Money (`time-for-money`)

### Tags Migrated
1. Coaching Calls (`coaching-calls`)
2. coaching program templates (`coaching-program-templates`)
3. Group Coaching Model (`group-coaching-model`)
4. Lead Generation Metrics (`lead-generation-metrics`)
5. LinkedIn Business Model (`linkedin-business-model`)
6. Time for Money (`time-for-money`)

## Technical Implementation

### Files Created/Modified

**Python Scripts:**
- `scripts/migrate_wp_xml.py` - Main post migration script
- `scripts/link_posts_to_categories_tags.py` - Category/tag linking script
- `scripts/migrate_wp_categories_tags.py` - Full category/tag migration with purge
- `scripts/utils/wp_xml_parser.py` - WordPress XML parser with category/tag extraction
- `scripts/utils/strapi_client.py` - Strapi 5 REST API client

**Key Technical Challenges Solved:**

1. **Strapi 5 Pagination**
   - Issue: Default page size of 25 returned only 25 posts
   - Solution: Implemented pagination loop in `get_all_posts()`, `get_all_categories()`, `get_all_tags()`

2. **Strapi 5 documentId vs id**
   - Issue: Strapi 5 requires `documentId` (UUID string) for PUT/DELETE operations, not numeric `id`
   - Solution: Modified `update_post()` to accept and use `documentId` parameter
   - Updated linking script to map `wpPostId → documentId` instead of `wpPostId → id`

3. **Category/Tag Extraction**
   - Enhanced XML parser to extract category/tag associations within each post
   - Built slug-based maps for efficient lookups during linking

### WordPress XML Parser Features
```python
# Extracts per-post categories and tags
post = {
    'id': wp_post_id,
    'title': title,
    'content': content,
    'categories': [{'name': 'Category', 'slug': 'category'}],
    'tags': [{'name': 'Tag', 'slug': 'tag'}]
}
```

### Strapi Client API Methods
- `get_all_posts(page_size=100)` - Paginated post retrieval
- `get_all_categories(page_size=100)` - Paginated category retrieval
- `get_all_tags(page_size=100)` - Paginated tag retrieval
- `update_post(document_id, post_data)` - Update post using documentId
- `create_category(category_data)` - Create category
- `create_tag(tag_data)` - Create tag
- `delete_category(category_id)` - Delete category
- `delete_tag(tag_id)` - Delete tag

## Verification

Sample verified posts with categories/tags:
- "Coaching Calls- Managing Client Emotions" → Think Tank + Coaching Calls tag
- "Your Coaching Program Template" → 3 categories + coaching program templates tag
- "The Time for Money Trap" → Think Tank, time for money + Time for Money tag
- "Lead Generation Metrics" → Lead Generation Metrics, Think Tank + Lead Generation Metrics tag
- "Group Coaching Model - High Ticket Program Design" → Group Coaching Model, Think Tank + Group Coaching Model tag

## Source Files

**WordPress Export:**
- Location: `/mnt/d/dropbox/frankbria.com/website/wordpress-export.xml`
- Export Date: Latest available
- Content: 414 total items, 210 published posts

**Strapi Instance:**
- URL: https://beta.frankbria.com
- API: REST API with Bearer token authentication
- Version: Strapi 5

## Environment Setup

### Prerequisites
- Python 3.x with `uv` package manager
- PostgreSQL database for Strapi
- Strapi 5 instance running
- WordPress XML export file

### Dependencies
```bash
uv sync  # Install from pyproject.toml
```

Key packages:
- `requests` - HTTP client for Strapi API
- `python-dotenv` - Environment variable management
- `xml.etree.ElementTree` - WordPress XML parsing

### Configuration
Environment variables in `.env.server`:
```bash
STRAPI_URL=https://beta.frankbria.com
STRAPI_API_TOKEN=your_strapi_api_token_here
```

## Migration Scripts Usage

### 1. Migrate Posts Only
```bash
python scripts/migrate_wp_xml.py
```
Migrates posts with content but without category/tag links.

### 2. Link Posts to Existing Categories/Tags
```bash
python scripts/link_posts_to_categories_tags.py
```
Links posts to existing categories/tags in Strapi.

### 3. Full Category/Tag Migration (Purge and Recreate)
```bash
python scripts/migrate_wp_categories_tags.py
```
Purges all categories/tags, creates WordPress categories/tags, and links posts.

## Notes

- Strapi 5 uses draft/published system - creates 2 DB rows per content entry
- Posts were auto-published using `publishedAt` field
- WordPress post IDs preserved in `wpPostId` field for reference
- Category slugs must be unique in Strapi
- Rate limiting implemented (0.1-0.3s delays between API calls)

## Next Steps

Migration is complete. Potential follow-up tasks:
1. Review categories/tags in Strapi admin panel
2. Verify SEO metadata (titles, descriptions) on sample posts
3. Test frontend rendering of posts with categories/tags
4. Clean up the 690+ categories if needed (currently only using 8 WordPress categories)
5. Implement category/tag filtering on frontend

## Success Metrics

- ✅ 100% post migration success rate (210/210)
- ✅ All WordPress categories preserved and linked
- ✅ All WordPress tags preserved and linked
- ✅ Post content integrity maintained
- ✅ WordPress post IDs preserved for reference
- ✅ Publication dates preserved
- ✅ Author information migrated
