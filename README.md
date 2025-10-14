# WordPress to Strapi 5 Migration Tools

Python migration scripts for migrating content from WordPress XML export to Strapi 5 headless CMS.

## Project Status

✅ **Migration Complete** - 210 posts, 8 categories, 6 tags successfully migrated.

See [docs/migration-complete.md](docs/migration-complete.md) for full migration report.

## Quick Start

### Prerequisites
- Python 3.x with `uv` package manager
- Strapi 5 instance running
- WordPress XML export file
- Strapi API token with read/write permissions

### Setup

1. Install dependencies:
```bash
uv sync
```

2. Configure environment variables in `.env.server`:
```bash
STRAPI_URL=https://your-strapi-instance.com
STRAPI_API_TOKEN=your_api_token_here
```

3. Update WordPress XML path in scripts (default: `/mnt/d/dropbox/frankbria.com/website/wordpress-export.xml`)

## Migration Scripts

### migrate_wp_xml.py
Migrates WordPress posts from XML export to Strapi.

```bash
python scripts/migrate_wp_xml.py
```

**Features:**
- Extracts published posts and pages
- Migrates title, content, excerpt, slug, author, dates
- Preserves WordPress post ID in `wpPostId` field
- Auto-publishes posts with original publication dates

### link_posts_to_categories_tags.py
Links existing posts to existing categories and tags.

```bash
python scripts/link_posts_to_categories_tags.py
```

**Features:**
- Maps WordPress categories/tags to Strapi by slug
- Updates posts with category/tag relationships
- Safe operation - only updates existing content
- Detailed progress reporting

### migrate_wp_categories_tags.py
Full category/tag migration with purge option.

```bash
python scripts/migrate_wp_categories_tags.py
```

**Features:**
- Purges existing categories and tags (optional)
- Creates categories and tags from WordPress XML
- Links posts to newly created categories/tags
- All-in-one migration solution

## Utility Modules

### utils/wp_xml_parser.py
WordPress WXR (WordPress eXtended RSS) XML parser.

**Methods:**
- `extract_posts()` - Extract posts with categories/tags
- `extract_terms()` - Extract category/tag definitions

**Features:**
- Handles WordPress XML namespaces
- Extracts per-post category/tag associations
- Filters by post type (post/page) and status (publish)

### utils/strapi_client.py
Strapi 5 REST API client with full CRUD operations.

**Methods:**
- `create_post(post_data)` - Create new post
- `create_page(page_data)` - Create new page
- `create_category(category_data)` - Create category
- `create_tag(tag_data)` - Create tag
- `get_all_posts(page_size)` - Get all posts with pagination
- `get_all_categories(page_size)` - Get all categories with pagination
- `get_all_tags(page_size)` - Get all tags with pagination
- `update_post(document_id, post_data)` - Update post by documentId
- `delete_category(category_id)` - Delete category
- `delete_tag(tag_id)` - Delete tag

**Features:**
- Strapi 5 compatible (uses `documentId` for updates)
- Automatic pagination for large datasets
- Slug sanitization for Strapi requirements
- Rate limiting for API protection
- Detailed error reporting

## Project Structure

```
.
├── README.md                           # This file
├── pyproject.toml                      # Python dependencies
├── .env.server                         # Environment configuration (gitignored)
├── .env.server.example                 # Environment template
├── scripts/
│   ├── migrate_wp_xml.py              # Main post migration
│   ├── link_posts_to_categories_tags.py # Link posts to categories/tags
│   ├── migrate_wp_categories_tags.py  # Full category/tag migration
│   └── utils/
│       ├── wp_xml_parser.py           # WordPress XML parser
│       └── strapi_client.py           # Strapi REST API client
└── docs/
    ├── migration-complete.md          # Final migration report
    ├── migration-report-xml.txt       # Migration execution log
    └── task-6-migration-status.md     # Task tracking notes
```

## Technical Notes

### Strapi 5 Compatibility

This project is designed for Strapi 5 which has important API differences from Strapi 4:

1. **documentId vs id**: Strapi 5 uses `documentId` (UUID string) for PUT/DELETE operations instead of numeric `id`
2. **Pagination**: Required for datasets larger than default page size (25)
3. **Draft/Published System**: Creates 2 database rows per content entry

### WordPress XML Format

WordPress WXR (WordPress eXtended RSS) format uses XML namespaces:
- `wp:` - WordPress-specific elements
- `content:` - Post content
- `excerpt:` - Post excerpt
- `dc:` - Dublin Core metadata

Categories use `domain="category"`, tags use `domain="post_tag"`.

### Rate Limiting

Scripts include deliberate delays (0.1-0.5 seconds) between API calls to prevent overwhelming the Strapi server.

## Migration Results

- **Posts migrated:** 210/210 (100% success)
- **Categories:** 8 WordPress categories
- **Tags:** 6 WordPress tags
- **Post-category links:** All 210 posts linked
- **Post-tag links:** 6 posts have tags

## Troubleshooting

### Common Issues

**1. "STRAPI_API_TOKEN not found"**
- Ensure `.env.server` exists in project root
- Check token is correctly set: `STRAPI_API_TOKEN=your_token_here`

**2. "404 Not Found" on post updates**
- Script may be using `id` instead of `documentId`
- Verify `strapi_client.py` uses `documentId` in `update_post()`

**3. "This attribute must be unique" for categories**
- Categories already exist in Strapi
- Use `link_posts_to_categories_tags.py` instead of full migration

**4. Only 25 posts retrieved**
- Missing pagination implementation
- Check `get_all_posts()` implements pagination loop

## Development

### Running Tests
```bash
# Test connection to Strapi
python -c "from scripts.utils.strapi_client import StrapiClient; import os; from dotenv import load_dotenv; load_dotenv('.env.server'); client = StrapiClient(os.getenv('STRAPI_URL'), os.getenv('STRAPI_API_TOKEN')); print(f'Connected: {len(client.get_all_posts())} posts found')"

# Test WordPress XML parsing
python -c "from scripts.utils.wp_xml_parser import WordPressXMLParser; parser = WordPressXMLParser('/mnt/d/dropbox/frankbria.com/website/wordpress-export.xml'); posts = parser.extract_posts(); print(f'Parsed: {len([p for p in posts if p[\"type\"] == \"post\"])} posts')"
```

### Adding New Migration Scripts

1. Import utilities:
```python
from utils.wp_xml_parser import WordPressXMLParser
from utils.strapi_client import StrapiClient
```

2. Load configuration:
```python
from dotenv import load_dotenv
load_dotenv('.env.server')

WP_XML_EXPORT = '/path/to/wordpress-export.xml'
STRAPI_URL = os.getenv('STRAPI_URL')
STRAPI_API_TOKEN = os.getenv('STRAPI_API_TOKEN')
```

3. Initialize clients:
```python
parser = WordPressXMLParser(WP_XML_EXPORT)
strapi = StrapiClient(STRAPI_URL, STRAPI_API_TOKEN)
```

## License

Private project - All rights reserved.

## Author

Migration tools developed for frankbria.com WordPress to Strapi migration.
