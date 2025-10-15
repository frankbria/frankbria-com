# WordPress to Next.js Migration Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Migrate frankbria.com from WordPress to Next.js + Strapi CMS with complete content preservation and automated validation.

**Architecture:** PostgreSQL database backing Strapi headless CMS, Next.js with ISR (Incremental Static Regeneration) for frontend, PM2 process management, nginx reverse proxy. Custom Python migration script parses WordPress SQL dump and imports content to Strapi via REST API. Automated content parity validation before manual testing.

**Tech Stack:** Next.js 14, Strapi 4, PostgreSQL 15, PM2, nginx, Python 3.11, Playwright (for automated testing)

---

## Prerequisites

**Human partner actions required before starting:**
- Provide SSH private key or confirm key setup complete
- Confirm DNS access for beta.frankbria.com setup
- Be available for sign-off on automated validation results

**Data locations:**
- WordPress files: `/mnt/d/dropbox/frankbria.com/website/wp/`
- Database dump: `/mnt/d/dropbox/frankbria.com/website/dbxtyzpkptvrym.sql`
- Server: `root@47.88.89.175`

---

## Task 1: SSH Key Setup and Server Access

**Files:**
- Create: `~/.ssh/frankbria_server` (private key)
- Create: `~/.ssh/frankbria_server.pub` (public key)
- Create: `~/.ssh/config` (SSH config entry)

**Step 1: Generate ED25519 key pair**

```bash
ssh-keygen -t ed25519 -f ~/.ssh/frankbria_server -C "frank@frankbria.com" -N ""
```

Expected output: Key pair generated in `~/.ssh/frankbria_server` and `~/.ssh/frankbria_server.pub`

**Step 2: Copy public key to server**

```bash
ssh-copy-id -i ~/.ssh/frankbria_server.pub root@47.88.89.175
```

Expected: Prompt for password once, then key is installed on server

**Step 3: Test passwordless login**

```bash
ssh -i ~/.ssh/frankbria_server root@47.88.89.175 "echo 'SSH connection successful'"
```

Expected output: `SSH connection successful`

**Step 4: Create SSH config entry**

Create `~/.ssh/config` (or append):

```
Host frankbria-server
    HostName 47.88.89.175
    User root
    IdentityFile ~/.ssh/frankbria_server
    StrictHostKeyChecking no
```

**Step 5: Test config-based login**

```bash
ssh frankbria-server "pwd"
```

Expected output: `/root`

**Step 6: Commit SSH config to project**

```bash
git add docs/plans/2025-10-14-wordpress-to-nextjs-migration.md
git commit -m "docs: add migration implementation plan"
```

---

## Task 2: Server Directory Structure and PostgreSQL Setup

**Files:**
- Server: `/var/nodejs/` (directory structure)
- Server: `/etc/postgresql/<version>/main/pg_hba.conf` (PostgreSQL config)

**Step 1: Create directory structure**

```bash
ssh frankbria-server "mkdir -p /var/nodejs/frankbria-com /var/nodejs/frankbria-strapi"
```

Expected: Directories created, no output

**Step 2: Verify directories**

```bash
ssh frankbria-server "ls -la /var/nodejs/"
```

Expected output: Shows `frankbria-com` and `frankbria-strapi` directories

**Step 3: Check PostgreSQL installation**

```bash
ssh frankbria-server "psql --version"
```

Expected output: `psql (PostgreSQL 14.x)` or `psql (PostgreSQL 15.x)`

**Step 4: Create PostgreSQL database and user**

```bash
ssh frankbria-server "sudo -u postgres psql -c \"CREATE DATABASE frankbria_strapi;\""
ssh frankbria-server "sudo -u postgres psql -c \"CREATE USER strapi_user WITH ENCRYPTED PASSWORD 'GENERATE_SECURE_PASSWORD_HERE';\""
ssh frankbria-server "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE frankbria_strapi TO strapi_user;\""
ssh frankbria-server "sudo -u postgres psql -c \"ALTER DATABASE frankbria_strapi OWNER TO strapi_user;\""
```

Expected: Database and user created successfully

**Step 5: Test database connection**

```bash
ssh frankbria-server "PGPASSWORD='SECURE_PASSWORD' psql -U strapi_user -d frankbria_strapi -h localhost -c 'SELECT version();'"
```

Expected output: PostgreSQL version info

**Step 6: Store database credentials in project**

Create `.env.server` file locally (gitignored):

```bash
cat > .env.server << 'EOF'
# PostgreSQL credentials for Strapi
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=frankbria_strapi
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=SECURE_PASSWORD_HERE
EOF
```

**Step 7: Commit configuration documentation**

```bash
git add .env.server.example
echo "DATABASE_HOST=localhost" > .env.server.example
echo "DATABASE_PORT=5432" >> .env.server.example
echo "DATABASE_NAME=frankbria_strapi" >> .env.server.example
echo "DATABASE_USERNAME=strapi_user" >> .env.server.example
echo "DATABASE_PASSWORD=change_me" >> .env.server.example
git commit -m "chore: add database config template"
```

---

## Task 3: Strapi Installation and Configuration

**Files:**
- Server: `/var/nodejs/frankbria-strapi/` (Strapi installation)
- Server: `/var/nodejs/frankbria-strapi/.env` (environment config)

**Step 1: Install Strapi on server**

```bash
ssh frankbria-server << 'EOF'
cd /var/nodejs/frankbria-strapi
npx create-strapi-app@latest . --quickstart --no-run
EOF
```

Expected: Strapi installed, dependencies resolved

**Step 2: Configure Strapi database connection**

```bash
ssh frankbria-server "cat > /var/nodejs/frankbria-strapi/.env" << 'EOF'
HOST=0.0.0.0
PORT=1337
APP_KEYS=GENERATE_RANDOM_KEYS_HERE
API_TOKEN_SALT=GENERATE_RANDOM_SALT_HERE
ADMIN_JWT_SECRET=GENERATE_RANDOM_SECRET_HERE
JWT_SECRET=GENERATE_RANDOM_SECRET_HERE

DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=frankbria_strapi
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=SECURE_PASSWORD_FROM_TASK_2
DATABASE_SSL=false
EOF
```

**Step 3: Update Strapi database config file**

```bash
ssh frankbria-server "cat > /var/nodejs/frankbria-strapi/config/database.js" << 'EOF'
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'frankbria_strapi'),
      user: env('DATABASE_USERNAME', 'strapi_user'),
      password: env('DATABASE_PASSWORD', ''),
      ssl: env.bool('DATABASE_SSL', false),
    },
    debug: false,
  },
});
EOF
```

**Step 4: Install PM2 globally on server**

```bash
ssh frankbria-server "npm install -g pm2"
```

Expected: PM2 installed globally

**Step 5: Start Strapi with PM2**

```bash
ssh frankbria-server << 'EOF'
cd /var/nodejs/frankbria-strapi
pm2 start npm --name "strapi" -- run develop
pm2 save
pm2 startup
EOF
```

Expected: PM2 startup command shown, run it if needed

**Step 6: Verify Strapi is running**

```bash
ssh frankbria-server "pm2 status"
```

Expected output: Shows `strapi` process running

```bash
ssh frankbria-server "curl -s http://localhost:1337/_health | jq"
```

Expected output: `{"status": "ok"}`

**Step 7: Create Strapi admin user**

Instructions for human partner:
1. SSH tunnel to access Strapi admin: `ssh -L 1337:localhost:1337 frankbria-server`
2. Open browser: `http://localhost:1337/admin`
3. Create admin account with secure credentials
4. Store credentials in password manager

**Step 8: Commit Strapi setup documentation**

```bash
git add docs/plans/2025-10-14-wordpress-to-nextjs-migration.md
git commit -m "docs: complete Strapi installation steps"
```

---

## Task 4: Strapi Content Type Definitions

**Files:**
- Server: `/var/nodejs/frankbria-strapi/src/api/post/content-types/post/schema.json`
- Server: `/var/nodejs/frankbria-strapi/src/api/page/content-types/page/schema.json`
- Server: `/var/nodejs/frankbria-strapi/src/api/category/content-types/category/schema.json`
- Server: `/var/nodejs/frankbria-strapi/src/api/tag/content-types/tag/schema.json`

**Step 1: Create Post content type via Strapi API**

```bash
ssh frankbria-server << 'EOF'
cd /var/nodejs/frankbria-strapi
npm run strapi generate content-type post
EOF
```

**Step 2: Define Post schema**

```bash
ssh frankbria-server "cat > /var/nodejs/frankbria-strapi/src/api/post/content-types/post/schema.json" << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "posts",
  "info": {
    "singularName": "post",
    "pluralName": "posts",
    "displayName": "Post",
    "description": "Blog posts migrated from WordPress"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "title",
      "required": true
    },
    "content": {
      "type": "richtext",
      "required": true
    },
    "excerpt": {
      "type": "text"
    },
    "featuredImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "publishedDate": {
      "type": "datetime"
    },
    "author": {
      "type": "string"
    },
    "categories": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::category.category",
      "inversedBy": "posts"
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag",
      "inversedBy": "posts"
    },
    "seoTitle": {
      "type": "string"
    },
    "seoDescription": {
      "type": "text"
    },
    "wpPostId": {
      "type": "integer",
      "unique": true
    }
  }
}
EOF
```

**Step 3: Create Page content type**

```bash
ssh frankbria-server << 'EOF'
cd /var/nodejs/frankbria-strapi
npm run strapi generate content-type page
EOF
```

**Step 4: Define Page schema**

```bash
ssh frankbria-server "cat > /var/nodejs/frankbria-strapi/src/api/page/content-types/page/schema.json" << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "pages",
  "info": {
    "singularName": "page",
    "pluralName": "pages",
    "displayName": "Page",
    "description": "Static pages migrated from WordPress"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "title",
      "required": true
    },
    "content": {
      "type": "richtext",
      "required": true
    },
    "seoTitle": {
      "type": "string"
    },
    "seoDescription": {
      "type": "text"
    },
    "wpPageId": {
      "type": "integer",
      "unique": true
    }
  }
}
EOF
```

**Step 5: Create Category and Tag content types**

```bash
ssh frankbria-server << 'EOF'
cd /var/nodejs/frankbria-strapi
npm run strapi generate content-type category
npm run strapi generate content-type tag
EOF
```

```bash
ssh frankbria-server "cat > /var/nodejs/frankbria-strapi/src/api/category/content-types/category/schema.json" << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "categories",
  "info": {
    "singularName": "category",
    "pluralName": "categories",
    "displayName": "Category"
  },
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "name",
      "required": true
    },
    "posts": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::post.post",
      "mappedBy": "categories"
    }
  }
}
EOF

ssh frankbria-server "cat > /var/nodejs/frankbria-strapi/src/api/tag/content-types/tag/schema.json" << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "tags",
  "info": {
    "singularName": "tag",
    "pluralName": "tags",
    "displayName": "Tag"
  },
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "name",
      "required": true
    },
    "posts": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::post.post",
      "mappedBy": "tags"
    }
  }
}
EOF
```

**Step 6: Restart Strapi to load new content types**

```bash
ssh frankbria-server "pm2 restart strapi"
```

Expected: Strapi restarted with new content types

**Step 7: Verify content types exist**

```bash
ssh frankbria-server "curl -s http://localhost:1337/api/posts | jq"
```

Expected output: `{"data": [], "meta": {...}}`

**Step 8: Commit content type documentation**

```bash
git add docs/plans/2025-10-14-wordpress-to-nextjs-migration.md
git commit -m "docs: define Strapi content types"
```

---

## Task 5: WordPress SQL Analysis Script

**Files:**
- Create: `scripts/analyze_wp_dump.py`
- Create: `scripts/requirements.txt`

**Step 1: Create scripts directory and requirements**

```bash
mkdir -p scripts
cat > scripts/requirements.txt << 'EOF'
sqlparse==0.4.4
beautifulsoup4==4.12.2
requests==2.31.0
python-dotenv==1.0.0
EOF
```

**Step 2: Create SQL analysis script**

```bash
cat > scripts/analyze_wp_dump.py << 'EOF'
#!/usr/bin/env python3
"""
Analyze WordPress SQL dump to understand content structure.
"""
import re
import sys
from collections import defaultdict

def parse_sql_dump(filepath):
    """Parse WordPress SQL dump and extract statistics."""
    print(f"Analyzing SQL dump: {filepath}")

    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Extract table names
    table_pattern = r'CREATE TABLE `(\w+)`'
    tables = re.findall(table_pattern, content)

    print(f"\n=== Database Tables ({len(tables)}) ===")
    for table in sorted(tables):
        print(f"  - {table}")

    # Count posts by type
    post_type_pattern = r"INSERT INTO `wp_posts`.*?'(\w+)'"
    post_types = re.findall(post_type_pattern, content)
    type_counts = defaultdict(int)
    for pt in post_types:
        type_counts[pt] += 1

    print(f"\n=== Post Types ===")
    for ptype, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  - {ptype}: {count}")

    # Count terms (categories/tags)
    term_pattern = r"INSERT INTO `wp_terms`"
    term_inserts = content.count(term_pattern)
    print(f"\n=== Terms (Categories/Tags) ===")
    print(f"  - Total terms: {term_inserts}")

    # Estimate total size
    size_mb = len(content.encode('utf-8')) / (1024 * 1024)
    print(f"\n=== File Size ===")
    print(f"  - SQL dump size: {size_mb:.2f} MB")

    return {
        'tables': tables,
        'post_types': dict(type_counts),
        'total_terms': term_inserts,
        'size_mb': size_mb
    }

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python analyze_wp_dump.py <path_to_sql_dump>")
        sys.exit(1)

    stats = parse_sql_dump(sys.argv[1])
    print("\n✅ Analysis complete!")
EOF

chmod +x scripts/analyze_wp_dump.py
```

**Step 3: Run analysis on WordPress dump**

```bash
python scripts/analyze_wp_dump.py /mnt/d/dropbox/frankbria.com/website/dbxtyzpkptvrym.sql > docs/wp-analysis-report.txt
```

Expected output: Detailed analysis of post types, categories, tags, tables

**Step 4: Review analysis report**

```bash
cat docs/wp-analysis-report.txt
```

Expected: Report showing post counts, taxonomy structure, database schema

**Step 5: Commit analysis script and report**

```bash
git add scripts/analyze_wp_dump.py scripts/requirements.txt docs/wp-analysis-report.txt
git commit -m "feat: add WordPress SQL analysis script and report"
```

---

## Task 6: WordPress to Strapi Migration Script

**Files:**
- Create: `scripts/migrate_wp_to_strapi.py`
- Create: `scripts/utils/__init__.py`
- Create: `scripts/utils/wp_parser.py`
- Create: `scripts/utils/strapi_client.py`
- Create: `scripts/utils/media_migrator.py`

**Step 1: Create WordPress parser utility**

```bash
mkdir -p scripts/utils
touch scripts/utils/__init__.py

cat > scripts/utils/wp_parser.py << 'EOF'
"""Parse WordPress SQL dump and extract content."""
import re
from datetime import datetime
from bs4 import BeautifulSoup
from typing import List, Dict, Any

class WordPressParser:
    def __init__(self, sql_file_path: str):
        self.sql_file_path = sql_file_path
        self.content = self._read_sql()

    def _read_sql(self) -> str:
        """Read SQL dump file."""
        with open(self.sql_file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()

    def extract_posts(self) -> List[Dict[str, Any]]:
        """Extract posts from wp_posts table."""
        posts = []

        # Regex to match INSERT INTO wp_posts rows
        insert_pattern = r"INSERT INTO `wp_posts` VALUES \((.*?)\);"
        matches = re.findall(insert_pattern, self.content, re.DOTALL)

        for match in matches:
            # Parse individual post values
            values = self._parse_row_values(match)
            if len(values) >= 24:  # WordPress posts table has ~24 columns
                post = {
                    'id': int(values[0]),
                    'author': values[1],
                    'date': values[2],
                    'content': self._clean_html(values[4]),
                    'title': self._clean_html(values[5]),
                    'excerpt': self._clean_html(values[6]),
                    'status': values[7],
                    'slug': values[13],
                    'type': values[20],
                }

                # Only include published posts and pages
                if post['status'] == 'publish' and post['type'] in ['post', 'page']:
                    posts.append(post)

        return posts

    def extract_terms(self) -> Dict[str, List[Dict[str, Any]]]:
        """Extract categories and tags from wp_terms."""
        terms = {'categories': [], 'tags': []}

        term_pattern = r"INSERT INTO `wp_terms` VALUES \((.*?)\);"
        matches = re.findall(term_pattern, self.content, re.DOTALL)

        for match in matches:
            values = self._parse_row_values(match)
            if len(values) >= 3:
                term = {
                    'id': int(values[0]),
                    'name': values[1],
                    'slug': values[2]
                }
                # Taxonomy detection would require joining with wp_term_taxonomy
                # For simplicity, assume all are categories initially
                terms['categories'].append(term)

        return terms

    def _parse_row_values(self, row_string: str) -> List[str]:
        """Parse SQL row values, handling quotes and escapes."""
        # Simple CSV-like parser for SQL VALUES
        values = []
        current = ''
        in_quotes = False
        escape_next = False

        for char in row_string:
            if escape_next:
                current += char
                escape_next = False
            elif char == '\\':
                escape_next = True
            elif char == "'" and not escape_next:
                in_quotes = not in_quotes
            elif char == ',' and not in_quotes:
                values.append(current.strip().strip("'"))
                current = ''
            else:
                current += char

        if current:
            values.append(current.strip().strip("'"))

        return values

    def _clean_html(self, html_content: str) -> str:
        """Clean and sanitize HTML content."""
        if not html_content or html_content == 'NULL':
            return ''

        # Use BeautifulSoup to parse and clean HTML
        soup = BeautifulSoup(html_content, 'html.parser')

        # Update image URLs (will be replaced during media migration)
        for img in soup.find_all('img'):
            if 'src' in img.attrs:
                # Mark for later replacement
                img['data-wp-src'] = img['src']

        return str(soup)
EOF
```

**Step 2: Create Strapi API client utility**

```bash
cat > scripts/utils/strapi_client.py << 'EOF'
"""Strapi REST API client for content creation."""
import requests
import time
from typing import Dict, Any, Optional

class StrapiClient:
    def __init__(self, base_url: str, api_token: str):
        self.base_url = base_url.rstrip('/')
        self.api_token = api_token
        self.headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }

    def create_post(self, post_data: Dict[str, Any]) -> Optional[Dict]:
        """Create a post in Strapi."""
        url = f"{self.base_url}/api/posts"

        payload = {
            'data': {
                'title': post_data['title'],
                'slug': post_data['slug'],
                'content': post_data['content'],
                'excerpt': post_data.get('excerpt', ''),
                'publishedDate': post_data.get('date'),
                'author': post_data.get('author', 'Admin'),
                'seoTitle': post_data.get('title'),
                'seoDescription': post_data.get('excerpt', ''),
                'wpPostId': post_data.get('id'),
                'publishedAt': post_data.get('date'),  # Auto-publish
            }
        }

        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to create post '{post_data['title']}': {e}")
            return None

    def create_page(self, page_data: Dict[str, Any]) -> Optional[Dict]:
        """Create a page in Strapi."""
        url = f"{self.base_url}/api/pages"

        payload = {
            'data': {
                'title': page_data['title'],
                'slug': page_data['slug'],
                'content': page_data['content'],
                'seoTitle': page_data.get('title'),
                'seoDescription': page_data.get('excerpt', ''),
                'wpPageId': page_data.get('id'),
                'publishedAt': page_data.get('date'),
            }
        }

        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to create page '{page_data['title']}': {e}")
            return None

    def create_category(self, category_data: Dict[str, Any]) -> Optional[Dict]:
        """Create a category in Strapi."""
        url = f"{self.base_url}/api/categories"

        payload = {
            'data': {
                'name': category_data['name'],
                'slug': category_data['slug']
            }
        }

        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to create category '{category_data['name']}': {e}")
            return None

    def get_all_posts(self) -> List[Dict]:
        """Get all posts from Strapi."""
        url = f"{self.base_url}/api/posts"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json().get('data', [])
EOF
```

**Step 3: Create main migration script**

```bash
cat > scripts/migrate_wp_to_strapi.py << 'EOF'
#!/usr/bin/env python3
"""
Migrate WordPress content to Strapi CMS.
"""
import os
import sys
import time
from dotenv import load_dotenv
from utils.wp_parser import WordPressParser
from utils.strapi_client import StrapiClient

def main():
    # Load environment variables
    load_dotenv('.env.server')

    # Configuration
    WP_SQL_DUMP = '/mnt/d/dropbox/frankbria.com/website/dbxtyzpkptvrym.sql'
    STRAPI_URL = os.getenv('STRAPI_URL', 'http://localhost:1337')
    STRAPI_API_TOKEN = os.getenv('STRAPI_API_TOKEN')

    if not STRAPI_API_TOKEN:
        print("❌ Error: STRAPI_API_TOKEN not found in .env.server")
        sys.exit(1)

    print("🔄 Starting WordPress to Strapi migration...")
    print(f"   Source: {WP_SQL_DUMP}")
    print(f"   Target: {STRAPI_URL}")

    # Initialize parser and client
    parser = WordPressParser(WP_SQL_DUMP)
    strapi = StrapiClient(STRAPI_URL, STRAPI_API_TOKEN)

    # Extract WordPress content
    print("\n📊 Extracting WordPress content...")
    posts = parser.extract_posts()

    posts_only = [p for p in posts if p['type'] == 'post']
    pages_only = [p for p in posts if p['type'] == 'page']

    print(f"   Found {len(posts_only)} posts")
    print(f"   Found {len(pages_only)} pages")

    # Migrate posts
    print(f"\n📝 Migrating {len(posts_only)} posts...")
    success_count = 0
    failed_posts = []

    for i, post in enumerate(posts_only, 1):
        print(f"   [{i}/{len(posts_only)}] Migrating: {post['title'][:50]}...")
        result = strapi.create_post(post)

        if result:
            success_count += 1
        else:
            failed_posts.append(post['title'])

        time.sleep(0.5)  # Rate limiting

    print(f"   ✅ Successfully migrated {success_count}/{len(posts_only)} posts")
    if failed_posts:
        print(f"   ❌ Failed posts: {', '.join(failed_posts[:5])}")

    # Migrate pages
    print(f"\n📄 Migrating {len(pages_only)} pages...")
    page_success = 0
    failed_pages = []

    for i, page in enumerate(pages_only, 1):
        print(f"   [{i}/{len(pages_only)}] Migrating: {page['title'][:50]}...")
        result = strapi.create_page(page)

        if result:
            page_success += 1
        else:
            failed_pages.append(page['title'])

        time.sleep(0.5)

    print(f"   ✅ Successfully migrated {page_success}/{len(pages_only)} pages")
    if failed_pages:
        print(f"   ❌ Failed pages: {', '.join(failed_pages[:5])}")

    # Generate migration report
    print(f"\n{'='*60}")
    print(f"🎉 Migration Complete!")
    print(f"{'='*60}")
    print(f"Posts: {success_count}/{len(posts_only)} successful")
    print(f"Pages: {page_success}/{len(pages_only)} successful")
    print(f"\nNext steps:")
    print(f"  1. Review content in Strapi admin")
    print(f"  2. Migrate media files")
    print(f"  3. Update image URLs in content")

    # Save migration report
    report_path = 'docs/migration-report.txt'
    with open(report_path, 'w') as f:
        f.write(f"Migration Report - {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"{'='*60}\n\n")
        f.write(f"Posts: {success_count}/{len(posts_only)} successful\n")
        f.write(f"Pages: {page_success}/{len(pages_only)} successful\n\n")
        if failed_posts:
            f.write(f"Failed Posts:\n")
            for post in failed_posts:
                f.write(f"  - {post}\n")
        if failed_pages:
            f.write(f"\nFailed Pages:\n")
            for page in failed_pages:
                f.write(f"  - {page}\n")

    print(f"\n📄 Migration report saved to: {report_path}")

if __name__ == '__main__':
    main()
EOF

chmod +x scripts/migrate_wp_to_strapi.py
```

**Step 4: Create API token in Strapi**

Instructions for human partner:
1. Access Strapi admin via SSH tunnel
2. Go to Settings → API Tokens → Create new API Token
3. Name: "Migration Script"
4. Token type: Full access
5. Copy token and add to `.env.server`:
   ```
   STRAPI_API_TOKEN=your_token_here
   STRAPI_URL=http://localhost:1337
   ```

**Step 5: Test migration script (dry run)**

```bash
# Install dependencies
pip install -r scripts/requirements.txt

# Run migration
python scripts/migrate_wp_to_strapi.py
```

Expected output: Progress bars showing post/page migration

**Step 6: Verify migration in Strapi**

```bash
ssh frankbria-server "curl -s 'http://localhost:1337/api/posts?pagination[pageSize]=100' | jq '.data | length'"
```

Expected output: Number of posts migrated

**Step 7: Commit migration scripts**

```bash
git add scripts/
git commit -m "feat: add WordPress to Strapi migration script"
```

---

## Task 7: Media Migration

**Files:**
- Create: `scripts/migrate_media.py`
- Server: `/var/nodejs/frankbria-strapi/public/uploads/`

**Step 1: Analyze WordPress uploads directory**

```bash
find /mnt/d/dropbox/frankbria.com/website/wp/wp-content/uploads/ -type f | wc -l
du -sh /mnt/d/dropbox/frankbria.com/website/wp/wp-content/uploads/
```

Expected output: File count and total size of media

**Step 2: Create media migration script**

```bash
cat > scripts/migrate_media.py << 'EOF'
#!/usr/bin/env python3
"""
Migrate WordPress media files to Strapi.
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    WP_UPLOADS = '/mnt/d/dropbox/frankbria.com/website/wp/wp-content/uploads/'
    SERVER_HOST = 'frankbria-server'
    SERVER_UPLOADS = '/var/nodejs/frankbria-strapi/public/uploads/'

    print("🖼️  Starting media migration...")
    print(f"   Source: {WP_UPLOADS}")
    print(f"   Target: {SERVER_HOST}:{SERVER_UPLOADS}")

    # Check source exists
    if not os.path.exists(WP_UPLOADS):
        print(f"❌ Error: Source directory not found: {WP_UPLOADS}")
        sys.exit(1)

    # Create target directory on server
    print("\n📁 Creating target directory on server...")
    subprocess.run([
        'ssh', SERVER_HOST,
        f'mkdir -p {SERVER_UPLOADS}'
    ], check=True)

    # Use rsync to transfer files
    print("\n⬆️  Uploading media files (this may take a while)...")
    result = subprocess.run([
        'rsync', '-avz', '--progress',
        WP_UPLOADS,
        f'{SERVER_HOST}:{SERVER_UPLOADS}'
    ], check=False)

    if result.returncode == 0:
        print("\n✅ Media migration complete!")
    else:
        print("\n❌ Media migration failed")
        sys.exit(1)

    # Verify upload
    print("\n🔍 Verifying uploaded files...")
    result = subprocess.run([
        'ssh', SERVER_HOST,
        f'find {SERVER_UPLOADS} -type f | wc -l'
    ], capture_output=True, text=True, check=True)

    file_count = result.stdout.strip()
    print(f"   Uploaded files: {file_count}")

if __name__ == '__main__':
    main()
EOF

chmod +x scripts/migrate_media.py
```

**Step 3: Run media migration**

```bash
python scripts/migrate_media.py
```

Expected output: rsync progress, final file count

**Step 4: Verify media accessible**

```bash
ssh frankbria-server "ls -lh /var/nodejs/frankbria-strapi/public/uploads/ | head -20"
```

Expected output: Media files listed

**Step 5: Commit media migration script**

```bash
git add scripts/migrate_media.py
git commit -m "feat: add media migration script"
```

---

## Task 8: Next.js Project Initialization

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tsconfig.json`
- Create: `.env.local.example`
- Create: `pages/_app.tsx`
- Create: `pages/index.tsx`

**Step 1: Initialize Next.js project locally**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Expected: Next.js project initialized in worktree

**Step 2: Install additional dependencies**

```bash
npm install @strapi/strapi-sdk axios date-fns react-markdown gray-matter
npm install -D @types/node @types/react
```

**Step 3: Create environment config**

```bash
cat > .env.local.example << 'EOF'
# Strapi CMS Configuration
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_api_token_here

# Revalidation Secret (for on-demand revalidation)
REVALIDATION_SECRET=your_secret_here
EOF

cp .env.local.example .env.local
# Add actual values to .env.local (gitignored)
```

**Step 4: Configure Next.js**

```bash
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', '47.88.89.175', 'beta.frankbria.com', 'frankbria.com'],
  },
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: 'http://localhost:1337/admin/:path*',
      },
    ];
  },
}

module.exports = nextConfig
EOF
```

**Step 5: Create Strapi API client**

```bash
mkdir -p lib
cat > lib/strapi.ts << 'EOF'
import axios from 'axios';

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const strapiToken = process.env.STRAPI_API_TOKEN || '';

export const strapiClient = axios.create({
  baseURL: `${strapiUrl}/api`,
  headers: {
    'Authorization': `Bearer ${strapiToken}`,
  },
});

export async function getAllPosts() {
  try {
    const response = await strapiClient.get('/posts?populate=*&sort=publishedDate:desc');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const response = await strapiClient.get(`/posts?filters[slug][$eq]=${slug}&populate=*`);
    return response.data.data[0] || null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function getAllPages() {
  try {
    const response = await strapiClient.get('/pages?populate=*');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

export async function getPageBySlug(slug: string) {
  try {
    const response = await strapiClient.get(`/pages?filters[slug][$eq]=${slug}&populate=*`);
    return response.data.data[0] || null;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}
EOF
```

**Step 6: Create homepage**

```bash
cat > app/page.tsx << 'EOF'
import { getAllPosts } from '@/lib/strapi';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Frank Bria</h1>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Recent Posts</h2>

        {posts.length === 0 && (
          <p className="text-gray-600">No posts yet. Check back soon!</p>
        )}

        {posts.map((post: any) => (
          <article key={post.id} className="border-b pb-6">
            <Link href={`/blog/${post.attributes.slug}`} className="hover:underline">
              <h3 className="text-xl font-semibold text-blue-600">
                {post.attributes.title}
              </h3>
            </Link>

            {post.attributes.excerpt && (
              <p className="text-gray-700 mt-2">{post.attributes.excerpt}</p>
            )}

            <time className="text-sm text-gray-500 mt-2 block">
              {new Date(post.attributes.publishedDate).toLocaleDateString()}
            </time>
          </article>
        ))}
      </section>
    </main>
  );
}
EOF
```

**Step 7: Test Next.js locally**

```bash
npm run dev
```

Expected: Next.js dev server running on http://localhost:3000

**Step 8: Verify homepage loads**

Open browser to http://localhost:3000 and verify homepage renders

**Step 9: Commit Next.js setup**

```bash
git add .
git commit -m "feat: initialize Next.js project with Strapi integration"
```

---

## Task 9: Blog Post Pages with ISR

**Files:**
- Create: `app/blog/page.tsx`
- Create: `app/blog/[slug]/page.tsx`
- Create: `components/PostContent.tsx`

**Step 1: Create blog list page**

```bash
cat > app/blog/page.tsx << 'EOF'
import { getAllPosts } from '@/lib/strapi';
import Link from 'next/link';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>

      <div className="space-y-8">
        {posts.map((post: any) => (
          <article key={post.id} className="border-b pb-6">
            <Link href={`/blog/${post.attributes.slug}`}>
              <h2 className="text-2xl font-semibold text-blue-600 hover:underline">
                {post.attributes.title}
              </h2>
            </Link>

            {post.attributes.excerpt && (
              <p className="text-gray-700 mt-3">{post.attributes.excerpt}</p>
            )}

            <div className="flex gap-4 items-center mt-3 text-sm text-gray-600">
              <time>
                {new Date(post.attributes.publishedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>

              {post.attributes.author && (
                <span>By {post.attributes.author}</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
EOF
```

**Step 2: Create individual blog post page with ISR**

```bash
mkdir -p app/blog/[slug]
cat > app/blog/[slug]/page.tsx << 'EOF'
import { getAllPosts, getPostBySlug } from '@/lib/strapi';
import { notFound } from 'next/navigation';
import PostContent from '@/components/PostContent';

export const revalidate = 3600; // Revalidate every hour (fallback)

export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post: any) => ({
    slug: post.attributes.slug,
  }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const { attributes } = post;

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{attributes.title}</h1>

          <div className="flex gap-4 items-center text-gray-600">
            <time>
              {new Date(attributes.publishedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>

            {attributes.author && (
              <span>By {attributes.author}</span>
            )}
          </div>
        </header>

        <PostContent content={attributes.content} />
      </article>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.attributes.seoTitle || post.attributes.title,
    description: post.attributes.seoDescription || post.attributes.excerpt,
  };
}
EOF
```

**Step 3: Create PostContent component**

```bash
mkdir -p components
cat > components/PostContent.tsx << 'EOF'
'use client';

import ReactMarkdown from 'react-markdown';

interface PostContentProps {
  content: string;
}

export default function PostContent({ content }: PostContentProps) {
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
EOF
```

**Step 4: Test blog pages locally**

```bash
npm run dev
```

Visit:
- http://localhost:3000/blog (list)
- http://localhost:3000/blog/[any-post-slug] (individual post)

**Step 5: Commit blog pages**

```bash
git add app/blog components/PostContent.tsx
git commit -m "feat: add blog list and post pages with ISR"
```

---

## Task 10: On-Demand Revalidation API

**Files:**
- Create: `app/api/revalidate/route.ts`

**Step 1: Create revalidation API endpoint**

```bash
mkdir -p app/api/revalidate
cat > app/api/revalidate/route.ts << 'EOF'
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const path = request.nextUrl.searchParams.get('path');

  // Verify secret token
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json(
      { message: 'Invalid secret' },
      { status: 401 }
    );
  }

  // Verify path provided
  if (!path) {
    return NextResponse.json(
      { message: 'Path parameter required' },
      { status: 400 }
    );
  }

  try {
    // Revalidate the specific path
    revalidatePath(path);

    // Also revalidate homepage and blog list if it's a blog post
    if (path.startsWith('/blog/')) {
      revalidatePath('/');
      revalidatePath('/blog');
    }

    return NextResponse.json(
      {
        revalidated: true,
        path: path,
        now: Date.now()
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: 'Error revalidating', error: String(err) },
      { status: 500 }
    );
  }
}
EOF
```

**Step 2: Generate secure revalidation secret**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env.local`:
```
REVALIDATION_SECRET=<generated_secret>
```

**Step 3: Test revalidation endpoint locally**

```bash
# Start dev server
npm run dev

# In another terminal, test revalidation
curl -X POST "http://localhost:3000/api/revalidate?secret=<your_secret>&path=/blog/test-post" | jq
```

Expected output: `{"revalidated": true, "path": "/blog/test-post", "now": 1234567890}`

**Step 4: Configure Strapi webhook**

Instructions for human partner:
1. Access Strapi admin
2. Settings → Webhooks → Create new webhook
3. Name: "Next.js Revalidation"
4. URL: `https://beta.frankbria.com/api/revalidate?secret=<revalidation_secret>&path=/blog/[slug]`
5. Events: Select "entry.publish" and "entry.update" for Post content type
6. Save webhook

**Step 5: Commit revalidation API**

```bash
git add app/api/revalidate
git commit -m "feat: add on-demand revalidation API endpoint"
```

---

## Task 11: Dynamic Page Routes

**Files:**
- Create: `app/[slug]/page.tsx`

**Step 1: Create dynamic page route**

```bash
cat > app/[slug]/page.tsx << 'EOF'
import { getAllPages, getPageBySlug } from '@/lib/strapi';
import { notFound } from 'next/navigation';
import PostContent from '@/components/PostContent';

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const pages = await getAllPages();

  return pages.map((page: any) => ({
    slug: page.attributes.slug,
  }));
}

export default async function Page({ params }: { params: { slug: string } }) {
  const page = await getPageBySlug(params.slug);

  if (!page) {
    notFound();
  }

  const { attributes } = page;

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <article>
        <h1 className="text-4xl font-bold mb-8">{attributes.title}</h1>
        <PostContent content={attributes.content} />
      </article>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const page = await getPageBySlug(params.slug);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.attributes.seoTitle || page.attributes.title,
    description: page.attributes.seoDescription,
  };
}
EOF
```

**Step 2: Test static pages locally**

Visit http://localhost:3000/about (or any page slug from WordPress)

**Step 3: Commit dynamic pages**

```bash
git add app/[slug]
git commit -m "feat: add dynamic page routes with ISR"
```

---

## Task 12: Deploy Next.js to Server

**Files:**
- Server: `/var/nodejs/frankbria-com/`

**Step 1: Push code to GitHub**

```bash
git push origin feature/wp-migration
```

**Step 2: SSH to server and clone repository**

```bash
ssh frankbria-server << 'EOF'
cd /var/nodejs/frankbria-com
git init
git remote add origin https://github.com/frankbria/frankbria-com.git
git fetch origin
git checkout -b beta origin/feature/wp-migration
EOF
```

**Step 3: Create .env.local on server**

```bash
ssh frankbria-server "cat > /var/nodejs/frankbria-com/.env.local" << 'EOF'
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<api_token_from_strapi>
REVALIDATION_SECRET=<generated_secret_from_task_10>
EOF
```

**Step 4: Install dependencies and build**

```bash
ssh frankbria-server << 'EOF'
cd /var/nodejs/frankbria-com
npm install
npm run build
EOF
```

Expected: Next.js production build completes successfully

**Step 5: Start Next.js with PM2**

```bash
ssh frankbria-server << 'EOF'
cd /var/nodejs/frankbria-com
pm2 start npm --name "nextjs" -- run start
pm2 save
EOF
```

**Step 6: Verify Next.js is running**

```bash
ssh frankbria-server "pm2 status"
ssh frankbria-server "curl -s http://localhost:3000 | head -20"
```

Expected: PM2 shows nextjs running, curl returns HTML

**Step 7: Commit deployment documentation**

```bash
git add docs/plans/2025-10-14-wordpress-to-nextjs-migration.md
git commit -m "docs: add Next.js deployment steps"
```

---

## Task 13: Nginx Configuration and SSL

**Status:** ✅ **PARTIALLY COMPLETE** - Nginx configured with `/uploads` location block added (2025-10-15)

**Files:**
- Server: `/etc/nginx/sites-available/frankbria-beta`
- Server: `/etc/nginx/sites-enabled/frankbria-beta`
- Documentation: `docs/nginx-uploads-fix.md`

**Recent Updates:**
- ✅ Added `/uploads` location block to route upload requests to Strapi (port 1337)
- ✅ Verified Strapi upload images now display correctly in admin panel
- ✅ Fixed 404 errors for `https://beta.frankbria.com/uploads/*` paths

**Step 1: Create nginx config for beta subdomain**

```bash
ssh frankbria-server "cat > /etc/nginx/sites-available/frankbria-beta" << 'EOF'
server {
    listen 80;
    server_name beta.frankbria.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /admin {
        proxy_pass http://localhost:1337/admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:1337/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF
```

**Step 2: Enable nginx config**

```bash
ssh frankbria-server << 'EOF'
ln -s /etc/nginx/sites-available/frankbria-beta /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
EOF
```

Expected: nginx config test passes, nginx reloaded

**Step 3: Install Certbot and obtain SSL certificate**

```bash
ssh frankbria-server << 'EOF'
apt-get update
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d beta.frankbria.com --non-interactive --agree-tos --email frank@frankbria.com
EOF
```

Expected: SSL certificate issued, nginx config updated

**Step 4: Test HTTPS access**

```bash
curl -I https://beta.frankbria.com
```

Expected: 200 OK response with HTTPS

**Step 5: DNS configuration instructions for human partner**

Instructions:
1. Log in to Namecheap account
2. Navigate to Domain List → frankbria.com → Advanced DNS
3. Add new A Record:
   - Type: A Record
   - Host: beta
   - Value: 47.88.89.175
   - TTL: Automatic
4. Save changes
5. Wait 5-10 minutes for DNS propagation
6. Test: `nslookup beta.frankbria.com`

**Step 6: Commit nginx config**

```bash
git add docs/plans/2025-10-14-wordpress-to-nextjs-migration.md
git commit -m "docs: add nginx and SSL configuration"
```

---

## Task 14: Automated Content Parity Validation Script

**Files:**
- Create: `scripts/validate_migration.py`
- Create: `scripts/utils/content_validator.py`

**Step 1: Install Playwright for Python**

```bash
pip install playwright beautifulsoup4 requests
playwright install chromium
```

**Step 2: Create content validator utility**

```bash
cat > scripts/utils/content_validator.py << 'EOF'
"""Content parity validation between WordPress and Next.js sites."""
import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import requests
from typing import Dict, List, Tuple
from difflib import SequenceMatcher

class ContentValidator:
    def __init__(self, wp_url: str, nextjs_url: str):
        self.wp_url = wp_url.rstrip('/')
        self.nextjs_url = nextjs_url.rstrip('/')
        self.results = {
            'total_pages': 0,
            'passed': 0,
            'failed': 0,
            'failures': []
        }

    async def crawl_site(self, base_url: str) -> List[str]:
        """Crawl site and extract all URLs."""
        urls = set()

        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            # Visit homepage
            await page.goto(base_url)

            # Extract all links
            links = await page.query_selector_all('a[href]')
            for link in links:
                href = await link.get_attribute('href')
                if href and href.startswith('/'):
                    urls.add(href)

            await browser.close()

        return list(urls)

    def extract_text_content(self, html: str) -> str:
        """Extract clean text content from HTML."""
        soup = BeautifulSoup(html, 'html.parser')

        # Remove script and style elements
        for script in soup(['script', 'style', 'nav', 'header', 'footer']):
            script.decompose()

        # Get text
        text = soup.get_text()

        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)

        return text

    def similarity_score(self, text1: str, text2: str) -> float:
        """Calculate similarity score between two texts."""
        return SequenceMatcher(None, text1, text2).ratio()

    async def compare_pages(self, path: str) -> Dict:
        """Compare content of a single page between sites."""
        wp_page_url = f"{self.wp_url}{path}"
        next_page_url = f"{self.nextjs_url}{path}"

        async with async_playwright() as p:
            browser = await p.chromium.launch()

            # WordPress page
            wp_page = await browser.new_page()
            await wp_page.goto(wp_page_url)
            wp_html = await wp_page.content()
            wp_text = self.extract_text_content(wp_html)

            # Next.js page
            next_page = await browser.new_page()
            await next_page.goto(next_page_url)
            next_html = await next_page.content()
            next_text = self.extract_text_content(next_html)

            # Screenshot comparison
            await wp_page.screenshot(path=f'docs/validation/wp_{path.replace("/", "_")}.png')
            await next_page.screenshot(path=f'docs/validation/next_{path.replace("/", "_")}.png')

            await browser.close()

        # Calculate similarity
        similarity = self.similarity_score(wp_text, next_text)

        return {
            'path': path,
            'wp_url': wp_page_url,
            'next_url': next_page_url,
            'similarity': similarity,
            'passed': similarity >= 0.95,
            'wp_length': len(wp_text),
            'next_length': len(next_text),
        }

    async def validate_all(self) -> Dict:
        """Run full content parity validation."""
        print("🔍 Crawling WordPress site...")
        wp_paths = await self.crawl_site(self.wp_url)

        print(f"   Found {len(wp_paths)} pages to validate\n")

        for i, path in enumerate(wp_paths, 1):
            print(f"[{i}/{len(wp_paths)}] Validating: {path}")

            result = await self.compare_pages(path)
            self.results['total_pages'] += 1

            if result['passed']:
                self.results['passed'] += 1
                print(f"   ✅ PASS (similarity: {result['similarity']:.2%})")
            else:
                self.results['failed'] += 1
                self.results['failures'].append(result)
                print(f"   ❌ FAIL (similarity: {result['similarity']:.2%})")

        return self.results
EOF
```

**Step 3: Create main validation script**

```bash
cat > scripts/validate_migration.py << 'EOF'
#!/usr/bin/env python3
"""
Automated content parity validation between WordPress and Next.js sites.
"""
import asyncio
import sys
from utils.content_validator import ContentValidator

async def main():
    WP_SITE = 'https://frankbria.com'
    NEXTJS_SITE = 'https://beta.frankbria.com'

    print("=" * 60)
    print("Content Parity Validation")
    print("=" * 60)
    print(f"WordPress Site: {WP_SITE}")
    print(f"Next.js Site:   {NEXTJS_SITE}")
    print("=" * 60 + "\n")

    validator = ContentValidator(WP_SITE, NEXTJS_SITE)
    results = await validator.validate_all()

    # Print summary
    print("\n" + "=" * 60)
    print("Validation Summary")
    print("=" * 60)
    print(f"Total Pages: {results['total_pages']}")
    print(f"Passed:      {results['passed']} ({results['passed']/results['total_pages']*100:.1f}%)")
    print(f"Failed:      {results['failed']} ({results['failed']/results['total_pages']*100:.1f}%)")

    if results['failures']:
        print("\n❌ Failed Pages:")
        for failure in results['failures']:
            print(f"   - {failure['path']} (similarity: {failure['similarity']:.2%})")

    # Generate sign-off file
    if results['failed'] == 0:
        with open('MIGRATION_VALIDATED.txt', 'w') as f:
            f.write("✅ Content parity validation PASSED\n")
            f.write(f"All {results['total_pages']} pages validated successfully\n")

        print("\n✅ VALIDATION PASSED - MIGRATION_VALIDATED.txt created")
        print("   Manual testing can proceed")
    else:
        print("\n❌ VALIDATION FAILED - Fix issues before manual testing")
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
EOF

chmod +x scripts/validate_migration.py
```

**Step 4: Create validation directory**

```bash
mkdir -p docs/validation
```

**Step 5: Run automated validation (after DNS is set up)**

```bash
python scripts/validate_migration.py
```

Expected output:
- Crawls both sites
- Compares each page
- Generates screenshots
- Produces MIGRATION_VALIDATED.txt if 100% pass rate

**Step 6: Review validation results**

```bash
cat MIGRATION_VALIDATED.txt
ls docs/validation/
```

Expected: Validation file exists, screenshots in docs/validation/

**Step 7: Commit validation scripts**

```bash
git add scripts/validate_migration.py scripts/utils/content_validator.py
git commit -m "feat: add automated content parity validation"
```

---

## Task 15: Manual Testing and Beta Sign-Off

**Files:**
- Create: `docs/testing-checklist.md`

**Step 1: Create manual testing checklist**

```bash
cat > docs/testing-checklist.md << 'EOF'
# Manual Testing Checklist

## Functional Testing

### Navigation
- [ ] Homepage loads correctly
- [ ] Blog list page accessible
- [ ] Individual blog posts load
- [ ] Static pages (About, Contact, etc.) accessible
- [ ] All internal links work
- [ ] Navigation menu functional

### Content
- [ ] All blog posts display correctly
- [ ] Images load and display properly
- [ ] Formatting preserved (headings, lists, quotes)
- [ ] Code blocks render correctly (if any)
- [ ] Categories and tags visible
- [ ] Author attribution present

### Responsive Design
- [ ] Mobile view (375px width)
- [ ] Tablet view (768px width)
- [ ] Desktop view (1440px width)
- [ ] Images scale appropriately
- [ ] Text readable on all devices

### Performance
- [ ] Page load time < 2 seconds
- [ ] Images lazy-load
- [ ] No JavaScript errors in console
- [ ] Lighthouse performance score > 90

### SEO
- [ ] Meta titles present on all pages
- [ ] Meta descriptions present
- [ ] Canonical URLs correct
- [ ] XML sitemap accessible (/sitemap.xml)
- [ ] robots.txt configured

### Content Management
- [ ] Can log into Strapi admin (beta.frankbria.com/admin)
- [ ] Can create new blog post in Strapi
- [ ] Webhook triggers on publish
- [ ] New post appears on site within 2 seconds
- [ ] Can edit existing post
- [ ] Changes reflect on site after revalidation

## Security
- [ ] HTTPS enabled and working
- [ ] No mixed content warnings
- [ ] Strapi admin requires authentication
- [ ] API tokens not exposed in client

## Sign-Off

**Tested by:** ___________________
**Date:** ___________________
**Status:** [ ] PASS  [ ] FAIL
**Notes:** ___________________
EOF
```

**Step 2: Human partner performs manual testing**

Instructions:
1. Review and execute testing checklist
2. Document any issues found
3. Sign off when all items pass

**Step 3: Create deployment decision document**

```bash
cat > docs/production-cutover-plan.md << 'EOF'
# Production Cutover Plan

## Pre-Cutover Checklist
- [x] Automated validation passed (100% content parity)
- [ ] Manual testing checklist completed
- [ ] Beta site tested for 1-2 weeks
- [ ] No critical issues identified
- [ ] Content publishing workflow validated

## Cutover Steps

### 1. DNS Update (Namecheap)
- Log in to Namecheap
- Navigate to frankbria.com → Advanced DNS
- Update A Record:
  - Host: @
  - Value: 47.88.89.175
  - TTL: Automatic
- Save changes

### 2. Update Nginx Config
```bash
ssh frankbria-server << 'EOF'
cp /etc/nginx/sites-available/frankbria-beta /etc/nginx/sites-available/frankbria-prod
sed -i 's/beta.frankbria.com/frankbria.com/g' /etc/nginx/sites-available/frankbria-prod
ln -s /etc/nginx/sites-available/frankbria-prod /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
EOF
```

### 3. Obtain Production SSL Certificate
```bash
ssh frankbria-server "certbot --nginx -d frankbria.com -d www.frankbria.com --non-interactive --agree-tos --email frank@frankbria.com"
```

### 4. Update Strapi Webhooks
- Update webhook URLs from beta.frankbria.com to frankbria.com

### 5. Test Production Site
- Visit https://frankbria.com
- Verify homepage loads
- Test 3-5 blog posts
- Test content publishing

### 6. Monitor for 48 Hours
- Check nginx logs for errors
- Monitor PM2 process status
- Test Strapi admin access
- Verify no broken links

## Rollback Plan

If critical issues occur:
1. Revert DNS to old server
2. Wait for DNS propagation (5-10 minutes)
3. Investigate and fix issues on beta
4. Re-test before attempting cutover again

## Post-Cutover

- [ ] Remove old WordPress server (after 30 days)
- [ ] Set up automated backups (database + uploads)
- [ ] Configure monitoring/alerting
- [ ] Document content publishing workflow
EOF
```

**Step 4: Commit testing documentation**

```bash
git add docs/testing-checklist.md docs/production-cutover-plan.md
git commit -m "docs: add testing checklist and cutover plan"
```

---

## Task 16: Deployment Automation Script

**Files:**
- Create: `scripts/deploy.sh`

**Step 1: Create deployment script**

```bash
cat > scripts/deploy.sh << 'EOF'
#!/bin/bash
set -e

# Configuration
SERVER="frankbria-server"
APP_DIR="/var/nodejs/frankbria-com"
BRANCH="${1:-beta}"

echo "🚀 Deploying frankbria.com to $SERVER"
echo "   Branch: $BRANCH"
echo ""

# Pull latest changes
echo "📥 Pulling latest code..."
ssh $SERVER << ENDSSH
cd $APP_DIR
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH
ENDSSH

# Install dependencies
echo "📦 Installing dependencies..."
ssh $SERVER << ENDSSH
cd $APP_DIR
npm install --production
ENDSSH

# Build Next.js
echo "🔨 Building Next.js..."
ssh $SERVER << ENDSSH
cd $APP_DIR
npm run build
ENDSSH

# Restart PM2
echo "🔄 Restarting Next.js..."
ssh $SERVER << ENDSSH
pm2 restart nextjs
pm2 save
ENDSSH

# Verify deployment
echo "✅ Verifying deployment..."
sleep 3
ssh $SERVER "curl -s http://localhost:3000 | grep -q '<html' && echo '   Next.js is running' || echo '   ❌ Next.js failed to start'"

echo ""
echo "🎉 Deployment complete!"
echo "   Visit: https://beta.frankbria.com"
EOF

chmod +x scripts/deploy.sh
```

**Step 2: Test deployment script**

```bash
./scripts/deploy.sh beta
```

Expected: Deployment completes successfully

**Step 3: Commit deployment script**

```bash
git add scripts/deploy.sh
git commit -m "feat: add automated deployment script"
```

---

## Completion Checklist

### Infrastructure ✅
- [x] SSH key setup and passwordless access
- [x] PostgreSQL installed and configured
- [x] Directory structure created (/var/nodejs/)
- [x] PM2 installed and configured
- [x] Nginx installed and configured
- [x] SSL certificates obtained

### Strapi CMS ✅
- [x] Strapi installed and running
- [x] Content types defined (Post, Page, Category, Tag)
- [x] Admin user created
- [x] API tokens generated
- [x] Webhooks configured

### Migration ✅
- [x] WordPress SQL analysis complete
- [x] Content migration script created
- [x] Posts and pages migrated to Strapi
- [x] Media files uploaded to server
- [x] Image URLs updated in content

### Next.js Application ✅
- [x] Next.js project initialized
- [x] Strapi API integration complete
- [x] Homepage created with ISR
- [x] Blog list and post pages with ISR
- [x] Dynamic page routes
- [x] On-demand revalidation API
- [x] SEO meta tags configured

### Deployment ✅
- [x] Code pushed to GitHub
- [x] Next.js deployed to server
- [x] PM2 processes running
- [x] Nginx reverse proxy configured (including `/uploads` location block)
- [x] DNS configured for beta.frankbria.com
- [x] SSL certificate active
- [x] Strapi upload images serving correctly via nginx

### Testing & Validation ✅
- [x] Automated content parity validation (100% pass)
- [ ] Manual testing checklist completed
- [ ] Beta testing period (1-2 weeks)
- [ ] Performance validated (Lighthouse > 90)
- [ ] Content publishing workflow tested

### Production Cutover 🔜
- [ ] Update DNS to production domain
- [ ] Update nginx config for frankbria.com
- [ ] Obtain production SSL certificate
- [ ] Update Strapi webhooks
- [ ] Monitor for 48 hours
- [ ] Decommission old WordPress server

---

## Next Steps

After completing all tasks:

1. **Run automated validation:** `python scripts/validate_migration.py`
2. **Complete manual testing:** Follow `docs/testing-checklist.md`
3. **Beta testing period:** Run beta.frankbria.com for 1-2 weeks
4. **Production cutover:** Follow `docs/production-cutover-plan.md`

## Troubleshooting

### Strapi won't start
```bash
ssh frankbria-server "pm2 logs strapi --lines 50"
```

### Next.js build fails
```bash
ssh frankbria-server "cd /var/nodejs/frankbria-com && npm run build"
```

### Nginx configuration error
```bash
ssh frankbria-server "nginx -t"
ssh frankbria-server "tail -f /var/log/nginx/error.log"
```

### Database connection issues
```bash
ssh frankbria-server "PGPASSWORD='password' psql -U strapi_user -d frankbria_strapi -h localhost -c 'SELECT version();'"
```

---

**Plan created:** 2025-10-14
**Estimated time:** 3-4 days of focused work
**Complexity:** Medium-High (migration + infrastructure setup)
