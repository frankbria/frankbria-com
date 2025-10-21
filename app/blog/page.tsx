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
            {validPosts.map((post: any) => {
              // Get featured image URL if it exists
              const featuredImageUrl = post.featuredImage?.url
                ? `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${post.featuredImage.url}`
                : null;

              return (
                <article key={post.id} className="border-b border-gray-200 pb-8">
                  {/* Featured image */}
                  <Link href={`/blog/${post.slug}`}>
                    {featuredImageUrl ? (
                      <div className="w-full h-48 overflow-hidden rounded mb-4 bg-gray-100">
                        <img
                          src={featuredImageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded mb-4 flex items-center justify-center">
                        <div className="text-center px-4">
                          <svg className="w-16 h-16 mx-auto text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                          <p className="text-sm text-blue-600 font-medium">Blog Post</p>
                        </div>
                      </div>
                    )}
                  </Link>

                  <h2 className="text-2xl font-semibold mb-3">
                    <Link href={`/blog/${post.slug}`} className="text-gray-900 hover:text-blue-600 transition-colors">
                      {post.title}
                    </Link>
                  </h2>

                  {post.excerpt && (
                    <p className="text-gray-700 mb-3 leading-relaxed">{post.excerpt}</p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
