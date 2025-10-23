/**
 * Tests for Strapi API Helper Functions
 * Following TDD methodology - these tests define expected behavior
 */

import axios from 'axios';
import { getRelatedPosts } from '../strapi';

// Mock axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('getRelatedPosts', () => {
  let mockClient: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create mock axios client
    mockClient = {
      get: jest.fn(),
    };

    // Mock axios.create to return our mock client
    mockedAxios.create = jest.fn().mockReturnValue(mockClient);
  });

  it('should return posts with matching category IDs', async () => {
    const mockPosts = [
      {
        id: 2,
        attributes: {
          title: 'Related Post 1',
          slug: 'related-post-1',
          publishedDate: '2024-01-15',
          categories: [{ id: 1, name: 'Tech' }],
        },
      },
      {
        id: 3,
        attributes: {
          title: 'Related Post 2',
          slug: 'related-post-2',
          publishedDate: '2024-01-10',
          categories: [{ id: 1, name: 'Tech' }],
        },
      },
    ];

    mockClient.get.mockResolvedValue({
      data: { data: mockPosts },
    });

    const result = await getRelatedPosts(1, [1], 3);

    expect(result).toEqual(mockPosts);
    expect(mockClient.get).toHaveBeenCalledWith('/posts', {
      params: {
        'filters[categories][id][$in]': [1],
        'filters[id][$ne]': 1,
        populate: '*',
        'pagination[pageSize]': 3,
        'sort': 'publishedDate:desc',
      },
    });
  });

  it('should exclude current post by ID', async () => {
    const currentPostId = 5;
    const categoryIds = [1, 2];

    mockClient.get.mockResolvedValue({
      data: { data: [] },
    });

    await getRelatedPosts(currentPostId, categoryIds, 3);

    expect(mockClient.get).toHaveBeenCalledWith('/posts', {
      params: expect.objectContaining({
        'filters[id][$ne]': currentPostId,
      }),
    });
  });

  it('should return up to limit posts (default 3)', async () => {
    mockClient.get.mockResolvedValue({
      data: { data: [] },
    });

    await getRelatedPosts(1, [1]);

    expect(mockClient.get).toHaveBeenCalledWith('/posts', {
      params: expect.objectContaining({
        'pagination[pageSize]': 3,
      }),
    });
  });

  it('should respect custom limit parameter', async () => {
    mockClient.get.mockResolvedValue({
      data: { data: [] },
    });

    await getRelatedPosts(1, [1], 5);

    expect(mockClient.get).toHaveBeenCalledWith('/posts', {
      params: expect.objectContaining({
        'pagination[pageSize]': 5,
      }),
    });
  });

  it('should sort by publishedDate descending', async () => {
    mockClient.get.mockResolvedValue({
      data: { data: [] },
    });

    await getRelatedPosts(1, [1], 3);

    expect(mockClient.get).toHaveBeenCalledWith('/posts', {
      params: expect.objectContaining({
        sort: 'publishedDate:desc',
      }),
    });
  });

  it('should populate all fields', async () => {
    mockClient.get.mockResolvedValue({
      data: { data: [] },
    });

    await getRelatedPosts(1, [1], 3);

    expect(mockClient.get).toHaveBeenCalledWith('/posts', {
      params: expect.objectContaining({
        populate: '*',
      }),
    });
  });

  it('should return recent posts when no category IDs provided', async () => {
    const mockPosts = [
      {
        id: 2,
        attributes: {
          title: 'Recent Post 1',
          slug: 'recent-post-1',
          publishedDate: '2024-01-20',
        },
      },
      {
        id: 3,
        attributes: {
          title: 'Recent Post 2',
          slug: 'recent-post-2',
          publishedDate: '2024-01-15',
        },
      },
    ];

    mockClient.get.mockResolvedValue({
      data: { data: mockPosts },
    });

    const result = await getRelatedPosts(1, [], 3);

    expect(result).toEqual(mockPosts);
    expect(mockClient.get).toHaveBeenCalledWith('/posts', {
      params: {
        'filters[id][$ne]': 1,
        populate: '*',
        'pagination[pageSize]': 3,
        'sort': 'publishedDate:desc',
      },
    });
  });

  it('should return empty array on API error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockClient.get.mockRejectedValue(new Error('API Error'));

    const result = await getRelatedPosts(1, [1], 3);

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching related posts:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle empty response from API', async () => {
    mockClient.get.mockResolvedValue({
      data: {},
    });

    const result = await getRelatedPosts(1, [1], 3);

    expect(result).toEqual([]);
  });

  it('should handle null data in API response', async () => {
    mockClient.get.mockResolvedValue({
      data: { data: null },
    });

    const result = await getRelatedPosts(1, [1], 3);

    expect(result).toEqual([]);
  });

  it('should pass correct Strapi query parameters for multiple categories', async () => {
    const categoryIds = [1, 2, 3];

    mockClient.get.mockResolvedValue({
      data: { data: [] },
    });

    await getRelatedPosts(1, categoryIds, 3);

    expect(mockClient.get).toHaveBeenCalledWith('/posts', {
      params: {
        'filters[categories][id][$in]': categoryIds,
        'filters[id][$ne]': 1,
        populate: '*',
        'pagination[pageSize]': 3,
        'sort': 'publishedDate:desc',
      },
    });
  });

  it('should handle network errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockClient.get.mockRejectedValue({
      code: 'ECONNREFUSED',
      message: 'Network error',
    });

    const result = await getRelatedPosts(1, [1], 3);

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should create axios client with correct configuration', async () => {
    mockClient.get.mockResolvedValue({
      data: { data: [] },
    });

    await getRelatedPosts(1, [1], 3);

    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: expect.stringContaining('/api'),
      headers: {
        Authorization: expect.stringContaining('Bearer'),
      },
    });
  });
});
