import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

/**
 * Represents a related blog post
 */
interface RelatedPost {
  id: number;
  attributes: {
    title: string;
    slug: string;
    publishedDate: string;
    excerpt?: string;
    featuredImage?: {
      url: string;
    };
    categories?: Array<{
      id: number;
      name: string;
    }>;
  };
}

/**
 * Props for RelatedPosts component
 */
interface RelatedPostsProps {
  /** Array of related posts to display */
  posts: RelatedPost[];
}

/**
 * Displays a grid of related blog posts
 *
 * Features:
 * - Shows up to 3 related posts in responsive grid
 * - Displays featured image, title, date, and category
 * - Gracefully handles missing data (images, categories)
 * - Returns null if no posts provided
 *
 * @param {RelatedPostsProps} props - Component props
 * @returns {JSX.Element | null} Rendered component or null
 *
 * @example
 * ```tsx
 * const relatedPosts = await getRelatedPosts(1, [2, 3], 3);
 * <RelatedPosts posts={relatedPosts} />
 * ```
 */
export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  // Filter out any invalid posts (missing attributes)
  const validPosts = posts.filter(post => post && post.attributes);

  if (validPosts.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 pt-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold mb-6 text-gray-900 italic">Related</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {validPosts.map((post) => {
          const { attributes } = post;
          const imageUrl = attributes.featuredImage?.url || '/placeholder-image.jpg';

          return (
            <Link
              key={post.id}
              href={`/blog/${attributes.slug}`}
              className="group"
            >
              <article className="space-y-3">
                {/* Featured Image */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt={attributes.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Post Title */}
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {attributes.title}
                </h4>

                {/* Post Metadata: Date and Category */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <time dateTime={attributes.publishedDate}>
                    {format(new Date(attributes.publishedDate), 'MMMM d, yyyy')}
                  </time>
                  {attributes.categories && attributes.categories.length > 0 && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span>{attributes.categories[0].name}</span>
                    </>
                  )}
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
