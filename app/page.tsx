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
