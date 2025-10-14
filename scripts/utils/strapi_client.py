"""Strapi REST API client for content creation."""
import requests
import time
import re
from typing import Dict, Any, Optional, List


class StrapiClient:
    def __init__(self, base_url: str, api_token: str):
        self.base_url = base_url.rstrip('/')
        self.api_token = api_token
        self.headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }

    def _sanitize_slug(self, slug: str, title: str = '') -> str:
        """Sanitize slug to match Strapi's pattern: /^[A-Za-z0-9-_.~]*$/"""
        # If slug is empty or looks like a URL, generate from title
        if not slug or '://' in slug or len(slug) > 100:
            slug = title

        # Convert to lowercase and replace spaces/special chars with hyphens
        slug = slug.lower()
        slug = re.sub(r'[^a-z0-9-_.~]+', '-', slug)

        # Remove leading/trailing hyphens
        slug = slug.strip('-')

        # Limit length
        if len(slug) > 80:
            slug = slug[:80].rsplit('-', 1)[0]  # Cut at word boundary

        return slug or 'untitled'

    def create_post(self, post_data: Dict[str, Any]) -> Optional[Dict]:
        """Create a post in Strapi."""
        url = f"{self.base_url}/api/posts"

        # Sanitize slug
        slug = self._sanitize_slug(post_data.get('slug', ''), post_data['title'])

        payload = {
            'data': {
                'title': post_data['title'],
                'slug': slug,
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
            print(f"❌ Failed to create post '{post_data['title'][:50]}': {e}")
            if hasattr(e.response, 'text'):
                print(f"   Response: {e.response.text[:200]}")
            return None

    def create_page(self, page_data: Dict[str, Any]) -> Optional[Dict]:
        """Create a page in Strapi."""
        url = f"{self.base_url}/api/pages"

        # Sanitize slug
        slug = self._sanitize_slug(page_data.get('slug', ''), page_data['title'])

        payload = {
            'data': {
                'title': page_data['title'],
                'slug': slug,
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
            print(f"❌ Failed to create page '{page_data['title'][:50]}': {e}")
            if hasattr(e.response, 'text'):
                print(f"   Response: {e.response.text[:200]}")
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
            if hasattr(e, 'response') and e.response is not None:
                print(f"   Response: {e.response.text[:500]}")
            return None

    def create_tag(self, tag_data: Dict[str, Any]) -> Optional[Dict]:
        """Create a tag in Strapi."""
        url = f"{self.base_url}/api/tags"

        payload = {
            'data': {
                'name': tag_data['name'],
                'slug': tag_data['slug']
            }
        }

        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to create tag '{tag_data['name']}': {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"   Response: {e.response.text[:500]}")
            return None

    def get_all_posts(self, page_size: int = 100) -> List[Dict]:
        """Get all posts from Strapi with pagination."""
        all_posts = []
        page = 1

        while True:
            url = f"{self.base_url}/api/posts?pagination[page]={page}&pagination[pageSize]={page_size}"
            try:
                response = requests.get(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                posts = data.get('data', [])

                if not posts:
                    break

                all_posts.extend(posts)

                # Check if there are more pages
                meta = data.get('meta', {}).get('pagination', {})
                if page >= meta.get('pageCount', 1):
                    break

                page += 1
                time.sleep(0.1)  # Rate limiting

            except requests.exceptions.RequestException as e:
                print(f"❌ Failed to get posts: {e}")
                break

        return all_posts

    def get_all_pages(self) -> List[Dict]:
        """Get all pages from Strapi."""
        url = f"{self.base_url}/api/pages"
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json().get('data', [])
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to get pages: {e}")
            return []

    def get_all_categories(self, page_size: int = 100) -> List[Dict]:
        """Get all categories from Strapi with pagination."""
        all_categories = []
        page = 1

        while True:
            url = f"{self.base_url}/api/categories?pagination[page]={page}&pagination[pageSize]={page_size}"
            try:
                response = requests.get(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                categories = data.get('data', [])

                if not categories:
                    break

                all_categories.extend(categories)

                # Check if there are more pages
                meta = data.get('meta', {}).get('pagination', {})
                if page >= meta.get('pageCount', 1):
                    break

                page += 1
                time.sleep(0.1)  # Rate limiting

            except requests.exceptions.RequestException as e:
                print(f"❌ Failed to get categories: {e}")
                break

        return all_categories

    def get_all_tags(self, page_size: int = 100) -> List[Dict]:
        """Get all tags from Strapi with pagination."""
        all_tags = []
        page = 1

        while True:
            url = f"{self.base_url}/api/tags?pagination[page]={page}&pagination[pageSize]={page_size}"
            try:
                response = requests.get(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                tags = data.get('data', [])

                if not tags:
                    break

                all_tags.extend(tags)

                # Check if there are more pages
                meta = data.get('meta', {}).get('pagination', {})
                if page >= meta.get('pageCount', 1):
                    break

                page += 1
                time.sleep(0.1)  # Rate limiting

            except requests.exceptions.RequestException as e:
                print(f"❌ Failed to get tags: {e}")
                break

        return all_tags

    def delete_category(self, category_id: int) -> bool:
        """Delete a category from Strapi."""
        url = f"{self.base_url}/api/categories/{category_id}"
        try:
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to delete category {category_id}: {e}")
            return False

    def delete_tag(self, tag_id: int) -> bool:
        """Delete a tag from Strapi."""
        url = f"{self.base_url}/api/tags/{tag_id}"
        try:
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to delete tag {tag_id}: {e}")
            return False

    def update_post(self, document_id: str, post_data: Dict[str, Any]) -> Optional[Dict]:
        """Update a post in Strapi using documentId."""
        url = f"{self.base_url}/api/posts/{document_id}"

        payload = {
            'data': post_data
        }

        try:
            response = requests.put(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to update post {document_id}: {e}")
            if hasattr(e.response, 'text'):
                print(f"   Response: {e.response.text[:200]}")
            return None
