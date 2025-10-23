import { NextRequest, NextResponse } from 'next/server';
import { strapiClient } from '@/lib/strapi';

// Constants
const PAGE_SIZE = 12;
const DEFAULT_PAGE = 1;

// Types
interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface SearchResponse {
  data: any[];
  meta: {
    pagination: PaginationMeta;
  };
}

/**
 * Builds a Strapi query string for searching posts
 * Searches in both title and content fields using case-insensitive matching
 */
function buildSearchQuery(query: string, page: number): string {
  const encodedQuery = encodeURIComponent(query);

  return `/posts?` +
    `filters[$or][0][title][$containsi]=${encodedQuery}&` +
    `filters[$or][1][content][$containsi]=${encodedQuery}&` +
    `populate=*&` +
    `sort=publishedDate:desc&` +
    `pagination[page]=${page}&` +
    `pagination[pageSize]=${PAGE_SIZE}`;
}

/**
 * Creates an empty search response
 */
function createEmptyResponse(): SearchResponse {
  return {
    data: [],
    meta: {
      pagination: {
        page: DEFAULT_PAGE,
        pageSize: PAGE_SIZE,
        pageCount: 0,
        total: 0,
      },
    },
  };
}

/**
 * Validates and extracts search parameters from the request
 */
function extractSearchParams(request: NextRequest): { query: string; page: number } {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim() || '';
  const page = parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10);

  return { query, page };
}

/**
 * GET /api/search
 * Searches blog posts by title or content
 *
 * Query parameters:
 * - q: Search query string (required)
 * - page: Page number for pagination (optional, default: 1)
 *
 * Returns paginated search results sorted by publishedDate descending
 */
export async function GET(request: NextRequest) {
  try {
    const { query, page } = extractSearchParams(request);

    // Return empty results if no query provided
    if (!query) {
      return NextResponse.json(createEmptyResponse());
    }

    // Execute search query
    const strapiQuery = buildSearchQuery(query, page);
    const response = await strapiClient.get(strapiQuery);

    // Validate response structure
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response from Strapi');
    }

    // Return formatted response
    return NextResponse.json({
      data: response.data.data || [],
      meta: response.data.meta || createEmptyResponse().meta,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search posts' },
      { status: 500 }
    );
  }
}

