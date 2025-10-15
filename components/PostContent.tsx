'use client';

import ReactMarkdown from 'react-markdown';

interface PostContentProps {
  content: string;
}

export default function PostContent({ content }: PostContentProps) {
  return (
    <div className="prose prose-lg max-w-none prose-headings:font-bold prose-h3:text-xl prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:pl-4 prose-blockquote:italic">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
