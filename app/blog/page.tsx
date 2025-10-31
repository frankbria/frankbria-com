import { getPaginatedPosts } from '@/lib/strapi';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const revalidate = 300; // Revalidate every 5 minutes

interface SearchParams {
  page?: string;
}

interface BlogPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1', 10);
  const pageSize = 12;

  const { data: posts, meta } = await getPaginatedPosts(currentPage, pageSize);

  // Filter out posts without required fields - Strapi 5 returns flat structure
  const validPosts = posts.filter((post: any) => post?.slug && post?.title);

  const { page, pageCount, total } = meta.pagination;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 text-gray-900">Blog</h1>
            <p className="text-xl text-gray-600">Insights on scaling your business to 7 figures and beyond</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {validPosts.map((post: any) => {
              // Get featured image URL if it exists
              const featuredImageUrl = post.featuredImage?.url
                ? `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${post.featuredImage.url}`
                : null;

              return (
                <article key={post.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  {/* Featured image */}
                  <Link href={`/blog/${post.slug}`} className="block">
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

                  {/* Post content */}
                  <div className="p-6">
                    {/* Post metadata */}
                    <div className="flex items-center gap-3 mb-3 text-sm text-gray-500">
                    {post.publishedDate && (
                      <time dateTime={post.publishedDate}>
                        {new Date(post.publishedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    )}
                    {post.categories && post.categories.length > 0 && (
                      <>
                        <span>•</span>
                        <Link
                          href={`/category/${post.categories[0].slug}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                        >
                          {post.categories[0].name}
                        </Link>
                      </>
                    )}
                  </div>

                  <h2 className="text-2xl font-semibold mb-3">
                    <Link href={`/blog/${post.slug}`} className="text-gray-900 hover:text-blue-600 transition-colors">
                      {post.title}
                    </Link>
                  </h2>

                  {post.excerpt && (
                    <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">{post.excerpt}</p>
                  )}

                  {/* Read more link */}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group"
                  >
                    Read More
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {/* Previous button */}
              {page > 1 ? (
                <Link
                  href={`/blog?page=${page - 1}`}
                  className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </Link>
              ) : (
                <span className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed">
                  Previous
                </span>
              )}

              {/* Page numbers */}
              <div className="flex gap-2">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    pageNum === 1 ||
                    pageNum === pageCount ||
                    Math.abs(pageNum - page) <= 1;

                  const showEllipsisBefore = pageNum === page - 2 && page > 3;
                  const showEllipsisAfter = pageNum === page + 2 && page < pageCount - 2;

                  if (!showPage && !showEllipsisBefore && !showEllipsisAfter) {
                    return null;
                  }

                  if (showEllipsisBefore || showEllipsisAfter) {
                    return (
                      <span key={pageNum} className="px-3 py-2 text-gray-500">
                        ...
                      </span>
                    );
                  }

                  return pageNum === page ? (
                    <span
                      key={pageNum}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium"
                    >
                      {pageNum}
                    </span>
                  ) : (
                    <Link
                      key={pageNum}
                      href={`/blog?page=${pageNum}`}
                      className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>

              {/* Next button */}
              {page < pageCount ? (
                <Link
                  href={`/blog?page=${page + 1}`}
                  className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Next
                </Link>
              ) : (
                <span className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed">
                  Next
                </span>
              )}
            </div>
          )}

          {/* Results info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} of {total} posts
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
