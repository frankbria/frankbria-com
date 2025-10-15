import { getAllPosts, getPostBySlug } from '@/lib/strapi';
import { notFound } from 'next/navigation';
import PostContent from '@/components/PostContent';

export const revalidate = 3600; // Revalidate every hour (fallback)

export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post: any) => ({
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
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{attributes.title}</h1>

          <div className="flex gap-4 items-center text-gray-600">
            <time>
              {new Date(attributes.publishedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>

            {attributes.author && (
              <span>By {attributes.author}</span>
            )}
          </div>
        </header>

        <PostContent content={attributes.content} />
      </article>
    </main>
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
