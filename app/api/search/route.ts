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
 * Searches in title, content, and excerpt fields using case-insensitive matching
 */
function buildSearchQuery(query: string, page: number): string {
  const encodedQuery = encodeURIComponent(query);

  return `/posts?` +
    `filters[$or][0][title][$containsi]=${encodedQuery}&` +
    `filters[$or][1][content][$containsi]=${encodedQuery}&` +
    `filters[$or][2][excerpt][$containsi]=${encodedQuery}&` +
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
    console.log(`Executing search query: ${strapiQuery}`);

    const response = await strapiClient.get(strapiQuery);

    // Validate response structure
    if (!response.data || typeof response.data !== 'object') {
      console.error('Invalid response structure from Strapi:', response.data);
      throw new Error('Invalid response from Strapi');
    }

    // Strapi 5 returns flat structure for filtered queries
    // Ensure data is in the expected format for the frontend
    const posts = response.data.data || [];

    // Log search results for debugging
    console.log(`Search query: "${query}" returned ${posts.length} results`);
    if (posts.length > 0) {
      console.log('Sample result:', {
        title: posts[0].title,
        slug: posts[0].slug,
        hasExcerpt: !!posts[0].excerpt,
        hasContent: !!posts[0].content
      });
    }

    // Return formatted response
    return NextResponse.json({
      data: posts,
      meta: response.data.meta || createEmptyResponse().meta,
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return NextResponse.json(
      { error: 'Failed to search posts' },
      { status: 500 }
    );
  }
}

