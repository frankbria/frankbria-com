"""Parse WordPress SQL dump and extract content."""
import re
from datetime import datetime
from bs4 import BeautifulSoup
from typing import List, Dict, Any


class WordPressParser:
    def __init__(self, sql_file_path: str):
        self.sql_file_path = sql_file_path
        self.content = self._read_sql()
        self.prefix = self._detect_prefix()

    def _read_sql(self) -> str:
        """Read SQL dump file."""
        with open(self.sql_file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()

    def _detect_prefix(self) -> str:
        """Detect WordPress table prefix (wp_, fr_, etc.)."""
        table_pattern = r'CREATE TABLE `(\w+_)posts`'
        match = re.search(table_pattern, self.content)
        return match.group(1) if match else 'wp_'

    def extract_posts(self) -> List[Dict[str, Any]]:
        """Extract published posts and pages from wp_posts table."""
        posts = []
        posts_table = f"{self.prefix}posts"

        # Find all INSERT statements for posts table (including column names)
        # Match entire INSERT statement up to semicolon
        insert_pattern = rf"INSERT INTO `{posts_table}`[^;]+;"
        insert_statements = re.findall(insert_pattern, self.content, re.DOTALL)

        print(f"\n📊 Found {len(insert_statements)} INSERT statements for {posts_table}")

        # Parse individual rows from each INSERT statement
        # Match rows wrapped in parentheses, handling nested parentheses
        row_pattern = r'\(([^)]+(?:\([^)]*\)[^)]*)*)\)(?:,|;)'

        total_rows = 0
        for insert_stmt in insert_statements:
            rows = re.findall(row_pattern, insert_stmt, re.DOTALL)
            total_rows += len(rows)

            for row in rows:
                values = self._parse_row_values(row)

                if len(values) >= 23:  # WordPress posts table has 23 columns
                    post_id = int(values[0]) if values[0].isdigit() else 0
                    post_author = values[1]
                    post_date = values[2]
                    post_content = values[4]
                    post_title = values[5]
                    post_excerpt = values[6]
                    post_status = values[7]
                    post_name = values[13]  # slug
                    post_type = values[20]

                    # Only include published posts and pages
                    if post_status == 'publish' and post_type in ['post', 'page']:
                        post = {
                            'id': post_id,
                            'author': post_author,
                            'date': post_date,
                            'content': self._clean_html(post_content),
                            'title': self._decode_html_entities(post_title),
                            'excerpt': self._clean_html(post_excerpt),
                            'status': post_status,
                            'slug': post_name,
                            'type': post_type,
                        }
                        posts.append(post)

        print(f"✅ Found {total_rows} total rows, extracted {len(posts)} published posts/pages")
        return posts

    def extract_terms(self) -> Dict[str, List[Dict[str, Any]]]:
        """Extract categories and tags from wp_terms."""
        terms = {'categories': [], 'tags': []}
        terms_table = f"{self.prefix}terms"

        # Find all INSERT statements for terms table
        insert_pattern = rf"INSERT INTO `{terms_table}`[^;]+;"
        insert_statements = re.findall(insert_pattern, self.content, re.DOTALL)

        print(f"\n📊 Found {len(insert_statements)} INSERT statements for {terms_table}")

        # Parse individual rows
        row_pattern = r'\(([^)]+(?:\([^)]*\)[^)]*)*)\)(?:,|;)'

        total_rows = 0
        for insert_stmt in insert_statements:
            rows = re.findall(row_pattern, insert_stmt, re.DOTALL)
            total_rows += len(rows)

            for row in rows:
                values = self._parse_row_values(row)
                if len(values) >= 3:
                    term = {
                        'id': int(values[0]) if values[0].isdigit() else 0,
                        'name': self._decode_html_entities(values[1]),
                        'slug': values[2]
                    }
                    # For simplicity, categorize all as categories
                    # In real migration, would join with wp_term_taxonomy
                    terms['categories'].append(term)

        print(f"✅ Found {total_rows} total term rows, extracted {len(terms['categories'])} terms")
        return terms

    def _parse_row_values(self, row_string: str) -> List[str]:
        """Parse SQL row values, handling quotes and escapes."""
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
        if not html_content or html_content == 'NULL' or html_content == '':
            return ''

        # Use BeautifulSoup to parse and clean HTML
        soup = BeautifulSoup(html_content, 'html.parser')

        # Update image URLs (will be replaced during media migration)
        for img in soup.find_all('img'):
            if 'src' in img.attrs:
                # Mark for later replacement
                img['data-wp-src'] = img['src']

        return str(soup)

    def _decode_html_entities(self, text: str) -> str:
        """Decode HTML entities in text."""
        if not text or text == 'NULL':
            return ''

        soup = BeautifulSoup(text, 'html.parser')
        return soup.get_text()
