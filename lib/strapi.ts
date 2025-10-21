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

export async function getAllPosts() {
  try {
    // Create a fresh client for this request
    const client = getStrapiClient();
    const response = await client.get('/posts?populate=*&sort=publishedDate:desc&pagination[pageSize]=100');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching posts:', error.message);
    return [];
  }
}

export async function getPaginatedPosts(page: number = 1, pageSize: number = 12) {
  try {
    const client = getStrapiClient();
    const response = await client.get(
      `/posts?populate=*&sort=publishedDate:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
    );

    return {
      data: response.data.data,
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
        publishedDate: rawPost.publishedDate,
        author: rawPost.author,
        seoTitle: rawPost.seoTitle,
        seoDescription: rawPost.seoDescription,
        wpPostId: rawPost.wpPostId,
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
