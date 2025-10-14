"""Parse WordPress XML export file."""
import xml.etree.ElementTree as ET
from typing import List, Dict, Any
from datetime import datetime

class WordPressXMLParser:
    """Parse WordPress WXR (WordPress eXtended RSS) export files."""

    # WordPress XML namespaces
    NAMESPACES = {
        'wp': 'http://wordpress.org/export/1.2/',
        'content': 'http://purl.org/rss/1.0/modules/content/',
        'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
        'dc': 'http://purl.org/dc/elements/1.1/'
    }

    def __init__(self, xml_file_path: str):
        self.xml_file_path = xml_file_path
        self.tree = ET.parse(xml_file_path)
        self.root = self.tree.getroot()

    def extract_posts(self) -> List[Dict[str, Any]]:
        """Extract published posts and pages from WordPress XML export."""
        posts = []

        # Find all items in the XML
        items = self.root.findall('.//item')
        print(f"\n📊 Found {len(items)} total items in XML export")

        for item in items:
            # Get post type
            post_type = item.find('wp:post_type', self.NAMESPACES)
            if post_type is None or post_type.text not in ['post', 'page']:
                continue

            # Get post status
            post_status = item.find('wp:status', self.NAMESPACES)
            if post_status is None or post_status.text != 'publish':
                continue

            # Extract post data
            post_id_elem = item.find('wp:post_id', self.NAMESPACES)
            title_elem = item.find('title')
            content_elem = item.find('content:encoded', self.NAMESPACES)
            excerpt_elem = item.find('excerpt:encoded', self.NAMESPACES)
            pubdate_elem = item.find('wp:post_date', self.NAMESPACES)
            slug_elem = item.find('wp:post_name', self.NAMESPACES)
            author_elem = item.find('dc:creator', self.NAMESPACES)

            # Extract categories and tags for this post
            post_categories = []
            post_tags = []

            category_elems = item.findall('.//category')
            for cat_elem in category_elems:
                domain = cat_elem.get('domain', '')
                nicename = cat_elem.get('nicename', '')
                name = cat_elem.text

                if domain == 'category' and name:
                    post_categories.append({
                        'name': name,
                        'slug': nicename
                    })
                elif domain == 'post_tag' and name:
                    post_tags.append({
                        'name': name,
                        'slug': nicename
                    })

            post = {
                'id': int(post_id_elem.text) if post_id_elem is not None and post_id_elem.text else 0,
                'title': title_elem.text if title_elem is not None else 'Untitled',
                'content': content_elem.text if content_elem is not None else '',
                'excerpt': excerpt_elem.text if excerpt_elem is not None else '',
                'date': pubdate_elem.text if pubdate_elem is not None else None,
                'slug': slug_elem.text if slug_elem is not None else '',
                'author': author_elem.text if author_elem is not None else 'Admin',
                'status': 'publish',
                'type': post_type.text,
                'categories': post_categories,
                'tags': post_tags
            }

            posts.append(post)

        posts_only = [p for p in posts if p['type'] == 'post']
        pages_only = [p for p in posts if p['type'] == 'page']

        print(f"✅ Extracted {len(posts_only)} published posts")
        print(f"✅ Extracted {len(pages_only)} published pages")

        return posts

    def extract_terms(self) -> Dict[str, List[Dict[str, Any]]]:
        """Extract categories and tags from XML export."""
        terms = {'categories': [], 'tags': []}

        # Extract categories
        categories = self.root.findall('.//wp:category', self.NAMESPACES)
        for cat in categories:
            cat_id = cat.find('wp:term_id', self.NAMESPACES)
            cat_slug = cat.find('wp:category_nicename', self.NAMESPACES)
            cat_name = cat.find('wp:cat_name', self.NAMESPACES)

            if cat_name is not None:
                terms['categories'].append({
                    'id': int(cat_id.text) if cat_id is not None and cat_id.text else 0,
                    'name': cat_name.text,
                    'slug': cat_slug.text if cat_slug is not None else ''
                })

        # Extract tags
        tags = self.root.findall('.//wp:tag', self.NAMESPACES)
        for tag in tags:
            tag_id = tag.find('wp:term_id', self.NAMESPACES)
            tag_slug = tag.find('wp:tag_slug', self.NAMESPACES)
            tag_name = tag.find('wp:tag_name', self.NAMESPACES)

            if tag_name is not None:
                terms['tags'].append({
                    'id': int(tag_id.text) if tag_id is not None and tag_id.text else 0,
                    'name': tag_name.text,
                    'slug': tag_slug.text if tag_slug is not None else ''
                })

        print(f"✅ Extracted {len(terms['categories'])} categories")
        print(f"✅ Extracted {len(terms['tags'])} tags")

        return terms
