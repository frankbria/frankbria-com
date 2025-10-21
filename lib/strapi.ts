import axios from 'axios';

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';
const strapiToken = process.env.STRAPI_API_TOKEN || '';

console.log('Strapi Client Config:', {
  url: strapiUrl,
  hasToken: !!strapiToken,
  tokenLength: strapiToken.length,
  tokenPreview: strapiToken ? strapiToken.substring(0, 20) + '...' : 'NO TOKEN'
});

export const strapiClient = axios.create({
  baseURL: `${strapiUrl}/api`,
  headers: {
    'Authorization': `Bearer ${strapiToken}`,
  },
});

export async function getAllPosts() {
  try {
    // Fetch with pagination to get all posts (default page size is 25)
    const response = await strapiClient.get('/posts?populate=*&sort=publishedDate:desc&pagination[pageSize]=100');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching posts:', error.message);
    return [];
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
