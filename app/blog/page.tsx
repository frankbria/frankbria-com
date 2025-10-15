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
