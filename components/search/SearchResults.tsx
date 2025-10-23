'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

// Types
interface Category {
  name: string;
  slug: string;
}

export interface SearchResult {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedDate: string;
  categories: Category[];
}

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  query: string;
  onResultClick: () => void;
}

// Sub-components
function LoadingState() {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2
        className="h-8 w-8 animate-spin text-gray-400"
        data-testid="loading-spinner"
      />
    </div>
  );
}

function EmptyQueryState() {
  return (
    <div className="text-center py-12 text-gray-500">
      <p>Start typing to search posts...</p>
    </div>
  );
}

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <p>No results found for &quot;{query}&quot;</p>
    </div>
  );
}

function CategoryBadges({ categories }: { categories: Category[] }) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <>
      <span className="text-gray-400">•</span>
      <div className="flex gap-1 flex-wrap">
        {categories.map((category) => (
          <span
            key={category.slug}
            className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700"
          >
            {category.name}
          </span>
        ))}
      </div>
    </>
  );
}

function ResultItem({
  result,
  index,
  onResultClick,
}: {
  result: SearchResult;
  index: number;
  onResultClick: () => void;
}) {
  return (
    <Link
      key={result.documentId || result.id}
      href={`/blog/${result.slug}`}
      onClick={onResultClick}
      data-testid={`result-item-${index}`}
      className="block p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {result.title}
      </h3>

      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
        {result.excerpt}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">
          {format(new Date(result.publishedDate), 'MMM d, yyyy')}
        </span>
        <CategoryBadges categories={result.categories} />
      </div>
    </Link>
  );
}

/**
 * SearchResults Component
 *
 * Displays search results in a scrollable list with loading and empty states.
 * Each result shows title, excerpt, publish date, and category badges.
 *
 * @param results - Array of search results to display
 * @param loading - Whether search is in progress
 * @param query - Current search query
 * @param onResultClick - Callback when a result is clicked
 */
export function SearchResults({
  results,
  loading,
  query,
  onResultClick,
}: SearchResultsProps) {
  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Empty state - no query
  if (!query) {
    return <EmptyQueryState />;
  }

  // Empty state - no results
  if (results.length === 0) {
    return <NoResultsState query={query} />;
  }

  // Results list
  return (
    <div className="overflow-y-auto max-h-[60vh]" data-testid="results-container">
      {results.map((result, index) => (
        <ResultItem
          key={result.documentId || result.id}
          result={result}
          index={index}
          onResultClick={onResultClick}
        />
      ))}
    </div>
  );
}

