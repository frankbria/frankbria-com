'use client';

interface PostContentProps {
  content: string;
}

export default function PostContent({ content }: PostContentProps) {
  // Content comes from Strapi (our own CMS) and contains WordPress Gutenberg blocks/HTML
  // Safe to render directly since it's from our controlled source
  return (
    <div
      className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:pl-4 prose-blockquote:italic prose-img:rounded-lg prose-figcaption:text-sm prose-figcaption:text-gray-600 prose-figcaption:text-center"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
