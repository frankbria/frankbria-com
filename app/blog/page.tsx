import { getAllPosts } from '@/lib/strapi';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function BlogPage() {
  const posts = await getAllPosts();

  // Filter out posts without required fields - Strapi 5 returns flat structure
  const validPosts = posts.filter((post: any) => post?.slug && post?.title);

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-12 text-center">BLOG</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {validPosts.map((post: any) => (
              <article key={post.id} className="border-b border-gray-200 pb-8">
                {/* Featured image placeholder */}
                <Link href={`/blog/${post.slug}`}>
                  <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
                </Link>

                <h2 className="text-2xl font-semibent mb-3">
                  <Link href={`/blog/${post.slug}`} className="text-gray-900 hover:text-blue-600 transition-colors">
                    {post.title}
                  </Link>
                </h2>

                {post.excerpt && (
                  <p className="text-gray-700 mb-3 leading-relaxed">{post.excerpt}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
