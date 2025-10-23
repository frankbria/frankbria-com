import { getAllPosts, getPostBySlug } from '@/lib/strapi';
import { notFound } from 'next/navigation';
import { BlogContent } from '@/components/blog/BlogContent';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const revalidate = 3600; // Revalidate every hour (fallback)

export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts
    .filter((post: any) => post?.attributes?.slug)
    .map((post: any) => ({
      slug: post.attributes.slug,
    }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { attributes } = post;

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <article className="max-w-4xl mx-auto px-4 py-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold mb-6 text-gray-900">{attributes.title}</h1>

            {/* Category Links */}
            {attributes.categories && attributes.categories.length > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <span className="text-gray-600">Categories:</span>
                <div className="flex flex-wrap gap-2">
                  {attributes.categories.map((category: any) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </header>

          <BlogContent content={attributes.content} />

          {/* Share This Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-semibold mb-4">Share this:</h3>
            <div className="flex gap-4">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://frankbria.com/blog/${slug}`)}&text=${encodeURIComponent(attributes.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-400 transition-colors"
                aria-label="Share on X"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://frankbria.com/blog/${slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 transition-colors"
                aria-label="Share on Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`https://frankbria.com/blog/${slug}`)}&title=${encodeURIComponent(attributes.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-700 transition-colors"
                aria-label="Share on LinkedIn"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.attributes.seoTitle || post.attributes.title,
    description: post.attributes.seoDescription || post.attributes.excerpt,
  };
}
