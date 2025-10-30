/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock the Strapi client
jest.mock('@/lib/strapi', () => ({
  strapiClient: {
    get: jest.fn(),
  },
}));

import { strapiClient } from '@/lib/strapi';

describe('Search API Route', () => {
  const mockStrapiClient = strapiClient as jest.Mocked<typeof strapiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query parameter validation', () => {
    it('returns empty array when no query parameter provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        data: [],
        meta: {
          pagination: {
            page: 1,
            pageSize: 12,
            pageCount: 0,
            total: 0,
          },
        },
      });
      expect(mockStrapiClient.get).not.toHaveBeenCalled();
    });

    it('returns empty array when query parameter is empty string', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(mockStrapiClient.get).not.toHaveBeenCalled();
    });

    it('trims whitespace from query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=  test  ');

      mockStrapiClient.get.mockResolvedValueOnce({
        data: {
          data: [],
          meta: {
            pagination: {
              page: 1,
              pageSize: 12,
              pageCount: 0,
              total: 0,
            },
          },
        },
      });

      await GET(request);

      expect(mockStrapiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('test')
      );
      expect(mockStrapiClient.get).not.toHaveBeenCalledWith(
        expect.stringContaining('  test  ')
      );
    });
  });

  describe('Search functionality', () => {
    it('searches posts matching title', async () => {
      const mockPosts = [
        {
          id: 1,
          documentId: 'doc1',
          title: 'Test Post',
          slug: 'test-post',
          excerpt: 'A test excerpt',
          publishedDate: '2024-01-01',
          categories: [{ name: 'Tech', slug: 'tech' }],
        },
      ];

      const request = new NextRequest('http://localhost:3000/api/search?q=Test');

      mockStrapiClient.get.mockResolvedValueOnce({
        data: {
          data: mockPosts,
          meta: {
            pagination: {
              page: 1,
              pageSize: 12,
              pageCount: 1,
              total: 1,
            },
          },
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockPosts);
      expect(data.meta.pagination.total).toBe(1);

      // Verify Strapi was called with correct filters for title OR content search
      expect(mockStrapiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('filters[$or][0][title][$containsi]=Test')
      );
      expect(mockStrapiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('filters[$or][1][content][$containsi]=Test')
      );
    });

    it('searches posts matching content', async () => {
      const mockPosts = [
        {
          id: 2,
          documentId: 'doc2',
          title: 'Another Post',
          slug: 'another-post',
          excerpt: 'Contains React content',
          publishedDate: '2024-01-02',
          categories: [],
        },
      ];

      const request = new NextRequest('http://localhost:3000/api/search?q=React');

      mockStrapiClient.get.mockResolvedValueOnce({
        data: {
          data: mockPosts,
          meta: {
            pagination: {
              page: 1,
              pageSize: 12,
              pageCount: 1,
              total: 1,
            },
          },
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockPosts);
      expect(mockStrapiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('React')
      );
    });

    it('returns multiple matching posts', async () => {
      const mockPosts = [
        {
          id: 1,
          documentId: 'doc1',
          title: 'TypeScript Basics',
          slug: 'typescript-basics',
          excerpt: 'Learn TypeScript',
          publishedDate: '2024-01-03',
          categories: [],
        },
        {
          id: 2,
          documentId: 'doc2',
          title: 'Advanced TypeScript',
          slug: 'advanced-typescript',
          excerpt: 'Master TypeScript',
          publishedDate: '2024-01-02',
          categories: [],
        },
      ];

      const request = new NextRequest('http://localhost:3000/api/search?q=TypeScript');

      mockStrapiClient.get.mockResolvedValueOnce({
        data: {
          data: mockPosts,
          meta: {
            pagination: {
              page: 1,
              pageSize: 12,
              pageCount: 1,
              total: 2,
            },
          },
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.data).toEqual(mockPosts);
    });
  });

  describe('Pagination', () => {
    it('defaults to page 1 when page parameter not provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=test');

      mockStrapiClient.get.mockResolvedValueOnce({
        data: {
          data: [],
          meta: {
            pagination: {
              page: 1,
              pageSize: 12,
              pageCount: 0,
              total: 0,
            },
          },
        },
      });

      await GET(request);

      expect(mockStrapiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('pagination[page]=1')
      );
    });

    it('uses provided page parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=test&page=2');

      mockStrapiClient.get.mockResolvedValueOnce({
        data: {
          data: [],
          meta: {
            pagination: {
              page: 2,
              pageSize: 12,
              pageCount: 0,
              total: 0,
            },
          },
        },
      });

      await GET(request);

      expect(mockStrapiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('pagination[page]=2')
      );
    });

    it('uses pageSize of 12', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=test');

      mockStrapiClient.get.mockResolvedValueOnce({
        data: {
          data: [],
          meta: {
            pagination: {
              page: 1,
              pageSize: 12,
              pageCount: 0,
              total: 0,
            },
          },
        },
      });

      await GET(request);

      expect(mockStrapiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('pagination[pageSize]=12')
      );
    });

    it('handles paginated results correctly', async () => {
      const mockPosts = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        documentId: `doc${i + 1}`,
        title: `Post ${i + 1}`,
        slug: `post-${i + 1}`,
        excerpt: 'Excerpt',
        publishedDate: '2024-01-01',
        categories: [],
      }));

      const request = new NextRequest('http://localhost:3000/api/search?q=Post&page=1');

      mockStrapiClient.get.mockResolvedValueOnce({
        data: {
          data: mockPosts,
          meta: {
            pagination: {
              page: 1,
              pageSize: 12,
              pageCount: 3,
              total: 30,
            },
          },
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(12);
      expect(data.meta.pagination.pageCount).toBe(3);
      expect(data.meta.pagination.total).toBe(30);
    });
  });

  describe('Sorting', () => {
    it('sorts results by publishedDate descending', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=test');

      mockStrapiClient.get.mockResolvedValueOnce({
        data: {
          data: [],
          meta: {
            pagination: {
              page: 1,
              pageSize: 12,
              pageCount: 0,
              total: 0,
            },
          },
        },
      });

      await GET(request);

      expect(mockStrapiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('sort=publishedDate:desc')
      );
    });
  });

  describe('Data population', () => {
    it('populates all related data (categories, featuredImage, etc.)', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=test');

      mockStrapiClient.get.mockResolvedValueOnce({
        data: {
          data: [],
          meta: {
            pagination: {
              page: 1,
              pageSize: 12,
              pageCount: 0,
              total: 0,
            },
          },
        },
      });

      await GET(request);

      expect(mockStrapiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('populate=*')
      );
    });
  });

  describe('Error handling', () => {
    it('returns 500 status on Strapi error', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=test');

      mockStrapiClient.get.mockRejectedValueOnce(new Error('Strapi connection failed'));

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to search posts',
      });
    });

    it('returns 500 status on network error', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=test');

      mockStrapiClient.get.mockRejectedValueOnce(new Error('Network timeout'));

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search posts');
    });

    it('handles malformed Strapi response gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=test');

      mockStrapiClient.get.mockResolvedValueOnce({
        data: null, // Malformed response
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search posts');
    });
  });

  describe('Special characters in query', () => {
    it('handles special characters in search query', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=React%20%26%20TypeScript');

      mockStrapiClient.get.mockResolvedValueOnce({
        data: {
          data: [],
          meta: {
            pagination: {
              page: 1,
              pageSize: 12,
              pageCount: 0,
              total: 0,
            },
          },
        },
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      // The query is URL-encoded, so we check for the encoded version
      expect(mockStrapiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('React%20%26%20TypeScript')
      );
    });
  });
});
