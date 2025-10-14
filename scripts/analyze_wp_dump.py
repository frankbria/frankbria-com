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

    # Extract table names and detect prefix
    table_pattern = r'CREATE TABLE `(\w+)`'
    tables = re.findall(table_pattern, content)

    # Detect table prefix (fr_, wp_, etc.)
    prefix = 'wp_'
    for table in tables:
        if '_posts' in table:
            prefix = table.replace('posts', '')
            break

    print(f"\n=== Database Info ===")
    print(f"  - Table prefix: {prefix}")
    print(f"  - Total tables: {len(tables)}")

    # Count posts by type and status
    posts_table = f"{prefix}posts"

    # Extract post_type values from INSERT statements
    post_insert_pattern = rf"INSERT INTO `{posts_table}`.*?VALUES\s*\((.*?)\);"
    post_inserts = re.findall(post_insert_pattern, content, re.DOTALL)

    type_counts = defaultdict(int)
    status_counts = defaultdict(int)
    total_posts = 0

    for insert in post_inserts:
        # Split by comma but preserve quoted strings
        values = []
        current = ''
        in_quotes = False
        for char in insert:
            if char == "'" and (not current or current[-1] != '\\'):
                in_quotes = not in_quotes
            elif char == ',' and not in_quotes:
                values.append(current.strip().strip("'"))
                current = ''
                continue
            current += char
        if current:
            values.append(current.strip().strip("'"))

        # WordPress posts table structure: post_type is usually around index 20, post_status around index 7
        if len(values) > 20:
            post_status = values[7] if len(values) > 7 else 'unknown'
            post_type = values[20] if len(values) > 20 else 'unknown'

            if post_status == 'publish':
                type_counts[post_type] += 1
                total_posts += 1
            status_counts[post_status] += 1

    print(f"\n=== Published Content by Type ===")
    for ptype, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  - {ptype}: {count}")

    print(f"\n=== All Posts by Status ===")
    for status, count in sorted(status_counts.items(), key=lambda x: -x[1]):
        print(f"  - {status}: {count}")

    # Count terms (categories/tags)
    terms_table = f"{prefix}terms"
    term_pattern = rf"INSERT INTO `{terms_table}`"
    term_inserts = content.count(term_pattern)
    print(f"\n=== Terms (Categories/Tags) ===")
    print(f"  - Total terms: {term_inserts}")

    # Estimate total size
    size_mb = len(content.encode('utf-8')) / (1024 * 1024)
    print(f"\n=== File Size ===")
    print(f"  - SQL dump size: {size_mb:.2f} MB")

    return {
        'tables': tables,
        'prefix': prefix,
        'published_post_types': dict(type_counts),
        'all_post_statuses': dict(status_counts),
        'total_published': total_posts,
        'total_terms': term_inserts,
        'size_mb': size_mb
    }

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python analyze_wp_dump.py <path_to_sql_dump>")
        sys.exit(1)

    stats = parse_sql_dump(sys.argv[1])
    print("\n✅ Analysis complete!")
