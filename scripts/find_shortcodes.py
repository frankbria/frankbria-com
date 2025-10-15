#!/usr/bin/env python3
"""
Find all WordPress shortcodes in blog post content.
"""
import re
import sys
from collections import Counter
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

def find_shortcodes_in_text(text):
    """Extract all WordPress shortcodes from text."""
    # Match [shortcode] or [shortcode param="value"]
    pattern = r'\[([a-zA-Z_][a-zA-Z0-9_]*)[^\]]*\]'
    matches = re.findall(pattern, text)
    return matches

def analyze_shortcode_usage(shortcode_name, content):
    """Get examples of how a shortcode is used."""
    pattern = rf'\[{shortcode_name}[^\]]*\]'
    matches = re.findall(pattern, content)
    return matches[:3]  # Return up to 3 examples

def main():
    """Main function to analyze shortcodes."""
    # For now, analyze from sample content we know exists
    sample_content = """
<!-- wp:shortcode -->
[podcast_subscribe id="2664"]
<!-- /wp:shortcode -->

<!-- wp:shortcode -->
[intense_tabs direction="horizontal" theme_type="classic" duration="500" id="2924"]
[intense_tab title="Podcast" link_target="_self" icon_type="icon" icon_fontawesome="fa fa-microphone" icon_lnr=""]
<!-- /wp:shortcode -->

[youtube https://www.youtube.com/watch?v=example]
[audio src="http://example.com/audio.mp3"]
"""

    print("=" * 60)
    print("WordPress Shortcode Analysis")
    print("=" * 60)
    print("\nSearching for shortcodes in blog post content...")
    print("\nNote: This is a preliminary analysis.")
    print("Full analysis requires access to Strapi database.\n")

    # Find all shortcodes
    shortcodes = find_shortcodes_in_text(sample_content)
    shortcode_counts = Counter(shortcodes)

    print(f"Found {len(shortcodes)} total shortcode instances")
    print(f"Found {len(shortcode_counts)} unique shortcode types\n")

    print("Shortcode Usage:\n")
    for shortcode, count in shortcode_counts.most_common():
        print(f"  [{shortcode}]")
        print(f"    Count: {count}")
        examples = analyze_shortcode_usage(shortcode, sample_content)
        if examples:
            print(f"    Examples:")
            for example in examples:
                print(f"      {example}")
        print()

    print("\n" + "=" * 60)
    print("Recommendations:")
    print("=" * 60)
    print("""
1. [podcast_subscribe] - Replace with HTML podcast player or link
2. [intense_tabs] - Replace with React tabs component or simple HTML sections
3. [youtube] - Replace with proper <iframe> embed or React video component
4. [audio] - Replace with HTML5 <audio> element

Next Steps:
- Connect to production Strapi to get complete shortcode inventory
- Interactive review with user to determine replacement strategy
- Create transformation script based on decisions
""")

if __name__ == '__main__':
    main()
