import axios from 'axios';

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const strapiToken = process.env.STRAPI_API_TOKEN || '';

export const strapiClient = axios.create({
  baseURL: `${strapiUrl}/api`,
  headers: {
    'Authorization': `Bearer ${strapiToken}`,
  },
});

export async function getAllPosts() {
  try {
    console.log('🔍 Fetching posts from:', strapiUrl);
    console.log('🔑 Token available:', strapiToken ? `Yes (${strapiToken.substring(0, 20)}...)` : 'NO TOKEN!');
    const response = await strapiClient.get('/posts?populate=*&sort=publishedDate:desc');
    console.log('✅ Posts fetched successfully:', response.data.data?.length || 0, 'posts');
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error fetching posts:', error.message);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Response:', error.response?.data);
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const response = await strapiClient.get(`/posts?filters[slug][$eq]=${slug}&populate=*`);
    return response.data.data[0] || null;
  } catch (error) {
    console.error('Error fetching post:', error);
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
