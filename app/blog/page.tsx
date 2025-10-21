import { getAllPosts } from '@/lib/strapi';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function BlogPage() {
  const posts = await getAllPosts();

  console.log('Blog page - Total posts fetched:', posts.length);
  console.log('Blog page - First post structure:', posts[0]);

  // Filter out posts without required attributes
  const validPosts = posts.filter((post: any) => post?.attributes?.slug && post?.attributes?.title);

  console.log('Blog page - Valid posts after filter:', validPosts.length);

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
                <Link href={`/blog/${post.attributes.slug}`}>
                  <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
                </Link>

                <h2 className="text-2xl font-semibold mb-3">
                  <Link href={`/blog/${post.attributes.slug}`} className="text-gray-900 hover:text-blue-600 transition-colors">
                    {post.attributes.title}
                  </Link>
                </h2>

                {post.attributes.excerpt && (
                  <p className="text-gray-700 mb-3 leading-relaxed">{post.attributes.excerpt}</p>
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
