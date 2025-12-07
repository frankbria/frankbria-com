import axios from 'axios';

// Create client lazily to ensure environment variables are loaded
function getStrapiClient() {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';
  const strapiToken = process.env.STRAPI_API_TOKEN || '';

  return axios.create({
    baseURL: `${strapiUrl}/api`,
    headers: {
      'Authorization': `Bearer ${strapiToken}`,
    },
  });
}

// Legacy export for compatibility
export const strapiClient = getStrapiClient();

// Normalize Strapi snake_case fields to camelCase for frontend consistency
function normalizePost(post: any) {
  if (!post) return null;

  return {
    ...post,
    publishedDate: post.published_date || post.publishedDate,
    seoTitle: post.seo_title || post.seoTitle,
    seoDescription: post.seo_description || post.seoDescription,
    wpPostId: post.wp_post_id || post.wpPostId,
    featuredImage: post.featured_image || post.featuredImage,
  };
}

export async function getAllPosts() {
  try {
    // Create a fresh client for this request
    const client = getStrapiClient();
    const response = await client.get('/posts?populate=*&sort=published_date:desc&pagination[pageSize]=100');
    return response.data.data.map(normalizePost);
  } catch (error: any) {
    console.error('Error fetching posts:', error.message);
    return [];
  }
}

export async function getPaginatedPosts(page: number = 1, pageSize: number = 12) {
  try {
    const client = getStrapiClient();
    const response = await client.get(
      `/posts?populate=*&sort=published_date:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
    );

    return {
      data: response.data.data.map(normalizePost),
      meta: response.data.meta
    };
  } catch (error: any) {
    console.error('Error fetching paginated posts:', error.message);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: pageSize,
          pageCount: 0,
          total: 0
        }
      }
    };
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const response = await strapiClient.get(`/posts?filters[slug][$eq]=${slug}&populate=*`);
    const rawPost = response.data.data[0] || null;

    if (!rawPost) {
      return null;
    }

    // Strapi 5 returns flat structure for filtered queries, but we need attributes wrapper for consistency
    // Check if it already has attributes (collection format) or needs wrapping (flat format)
    const post = rawPost.attributes ? rawPost : {
      id: rawPost.id,
      documentId: rawPost.documentId,
      attributes: {
        title: rawPost.title,
        slug: rawPost.slug,
        content: rawPost.content,
        excerpt: rawPost.excerpt,
        publishedDate: rawPost.published_date || rawPost.publishedDate,
        author: rawPost.author,
        seoTitle: rawPost.seo_title || rawPost.seoTitle,
        seoDescription: rawPost.seo_description || rawPost.seoDescription,
        wpPostId: rawPost.wp_post_id || rawPost.wpPostId,
        createdAt: rawPost.createdAt,
        updatedAt: rawPost.updatedAt,
        publishedAt: rawPost.publishedAt,
        featuredImage: rawPost.featuredImage,
        categories: rawPost.categories,
      }
    };

    return post;
  } catch (error: any) {
    console.error('Error fetching post by slug:', slug, error.message);
    return null;
  }
}

export async function getAllPages() {
  try {
    const response = await strapiClient.get('/pages?populate=*');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

export async function getPageBySlug(slug: string) {
  try {
    const response = await strapiClient.get(`/pages?filters[slug][$eq]=${slug}&populate=*`);
    return response.data.data[0] || null;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

// Category API Functions

export async function getAllCategories() {
  try {
    const client = getStrapiClient();
    const response = await client.get('/categories?populate=*&sort=name:asc');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching categories:', error.message);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const client = getStrapiClient();
    const response = await client.get(`/categories?filters[slug][$eq]=${slug}&populate=*`);
    const rawCategory = response.data.data[0] || null;

    if (!rawCategory) {
      return null;
    }

    // Normalize to consistent format (handle both flat and attributes structure)
    const category = rawCategory.attributes ? rawCategory : {
      id: rawCategory.id,
      documentId: rawCategory.documentId,
      attributes: {
        name: rawCategory.name,
        slug: rawCategory.slug,
        description: rawCategory.description || '',
      }
    };

    return category;
  } catch (error: any) {
    console.error('Error fetching category by slug:', slug, error.message);
    return null;
  }
}

export async function getPostsByCategory(
  categorySlug: string,
  page: number = 1,
  pageSize: number = 12
) {
  try {
    const client = getStrapiClient();
    const response = await client.get(
      `/posts?filters[categories][slug][$eq]=${categorySlug}&populate=*&sort=published_date:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
    );

    return {
      data: response.data.data.map(normalizePost),
      meta: response.data.meta
    };
  } catch (error: any) {
    console.error('Error fetching posts for category:', categorySlug, error.message);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: pageSize,
          pageCount: 0,
          total: 0
        }
      }
    };
  }
}

/**
 * Fetches related posts based on shared categories
 *
 * @param postId - The ID of the current post to exclude from results
 * @param categoryIds - Array of category IDs to match against
 * @param limit - Maximum number of posts to return (default: 3)
 * @returns Array of related posts, or empty array on error
 *
 * @example
 * // Get 3 related posts from same categories
 * const related = await getRelatedPosts(1, [2, 3], 3);
 *
 * @example
 * // Fallback to recent posts when no categories
 * const recent = await getRelatedPosts(1, [], 3);
 */
export async function getRelatedPosts(
  postId: number,
  categoryIds: number[],
  limit: number = 3
): Promise<any[]> {
  try {
    const client = getStrapiClient();

    if (categoryIds.length === 0) {
      // Fallback: get recent posts when no categories provided
      const response = await client.get('/posts', {
        params: {
          'filters[id][$ne]': postId,
          'populate': '*',
          'pagination[pageSize]': limit,
          'sort': 'published_date:desc',
        },
      });
      return (response.data.data || []).map(normalizePost);
    }

    // Get posts with matching categories, excluding current post
    const response = await client.get('/posts', {
      params: {
        'filters[categories][id][$in]': categoryIds,
        'filters[id][$ne]': postId,
        'populate': '*',
        'pagination[pageSize]': limit,
        'sort': 'published_date:desc',
      },
    });

    return (response.data.data || []).map(normalizePost);
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
}
