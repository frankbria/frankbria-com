#!/usr/bin/env node

/**
 * Swap Categories and Tags in Strapi
 *
 * Problem: During WordPress migration, all terms were imported as "categories"
 * Solution: Move items to correct collection based on their actual taxonomy
 *
 * This script:
 * 1. Fetches all current "categories" and "tags" from Strapi
 * 2. Swaps them (categories → tags, tags → categories)
 * 3. Updates all post relationships accordingly
 */

const axios = require('axios');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'https://beta.frankbria.com';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('❌ Error: STRAPI_API_TOKEN environment variable not set');
  console.error('Usage: STRAPI_API_TOKEN=your_token node scripts/swap-categories-tags.js');
  process.exit(1);
}

const client = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function fetchAllCategories() {
  console.log('📥 Fetching all categories...');
  let allCategories = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await client.get(`/categories?pagination[page]=${page}&pagination[pageSize]=100`);
    allCategories = allCategories.concat(response.data.data);

    const { pageCount } = response.data.meta.pagination;
    hasMore = page < pageCount;
    page++;
  }

  console.log(`✓ Found ${allCategories.length} categories`);
  return allCategories;
}

async function fetchAllTags() {
  console.log('📥 Fetching all tags...');
  let allTags = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await client.get(`/tags?pagination[page]=${page}&pagination[pageSize]=100`);
    allTags = allTags.concat(response.data.data);

    const { pageCount } = response.data.meta.pagination;
    hasMore = page < pageCount;
    page++;
  }

  console.log(`✓ Found ${allTags.length} tags`);
  return allTags;
}

async function createTag(tagData) {
  try {
    // Check if tag already exists with this slug
    const existing = await client.get(`/tags?filters[slug][$eq]=${tagData.slug}`);
    if (existing.data.data.length > 0) {
      console.log(`⚠️  Tag "${tagData.name}" already exists, using existing`);
      return existing.data.data[0];
    }

    const response = await client.post('/tags', {
      data: {
        name: tagData.name,
        slug: tagData.slug
      }
    });
    return response.data.data;
  } catch (error) {
    console.error(`❌ Failed to create tag "${tagData.name}":`, error.response?.data || error.message);
    return null;
  }
}

async function createCategory(categoryData) {
  try {
    // Check if category already exists with this slug
    const existing = await client.get(`/categories?filters[slug][$eq]=${categoryData.slug}`);
    if (existing.data.data.length > 0) {
      console.log(`⚠️  Category "${categoryData.name}" already exists, using existing`);
      return existing.data.data[0];
    }

    const response = await client.post('/categories', {
      data: {
        name: categoryData.name,
        slug: categoryData.slug
      }
    });
    return response.data.data;
  } catch (error) {
    console.error(`❌ Failed to create category "${categoryData.name}":`, error.response?.data || error.message);
    return null;
  }
}

async function deleteCategory(id) {
  try {
    await client.delete(`/categories/${id}`);
  } catch (error) {
    console.error(`❌ Failed to delete category ${id}:`, error.response?.data || error.message);
  }
}

async function deleteTag(id) {
  try {
    await client.delete(`/tags/${id}`);
  } catch (error) {
    console.error(`❌ Failed to delete tag ${id}:`, error.response?.data || error.message);
  }
}

async function fetchAllPosts() {
  console.log('📥 Fetching all posts...');
  let allPosts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await client.get(`/posts?pagination[page]=${page}&pagination[pageSize]=100&populate[categories][fields][0]=id&populate[tags][fields][0]=id`);
    allPosts = allPosts.concat(response.data.data);

    const { pageCount } = response.data.meta.pagination;
    hasMore = page < pageCount;
    page++;
  }

  console.log(`✓ Found ${allPosts.length} posts`);
  return allPosts;
}

async function updatePost(postId, categories, tags) {
  try {
    await client.put(`/posts/${postId}`, {
      data: {
        categories: categories,
        tags: tags
      }
    });
  } catch (error) {
    console.error(`❌ Failed to update post ${postId}:`, error.response?.data || error.message);
  }
}

async function main() {
  console.log('🔄 Starting category/tag swap process...\n');

  // Step 1: Fetch current data
  const currentCategories = await fetchAllCategories();
  const currentTags = await fetchAllTags();

  console.log(`\n📊 Current state:`);
  console.log(`   Categories: ${currentCategories.length}`);
  console.log(`   Tags: ${currentTags.length}`);
  console.log(`\n⚠️  This script will:`);
  console.log(`   - Move ${currentCategories.length} categories → tags`);
  console.log(`   - Move ${currentTags.length} tags → categories`);

  // Wait for confirmation
  console.log(`\n⏳ Starting in 5 seconds... (Ctrl+C to cancel)`);
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 2: Create new tags from old categories
  console.log(`\n📝 Creating ${currentCategories.length} new tags from categories...`);
  const oldCategoryIdToNewTagId = {};

  for (let i = 0; i < currentCategories.length; i++) {
    const cat = currentCategories[i];
    process.stdout.write(`\r   Progress: ${i + 1}/${currentCategories.length}`);

    // Handle both Strapi 4 and Strapi 5 response formats
    const catData = cat.attributes || cat;

    const newTag = await createTag({
      name: catData.name,
      slug: catData.slug
    });

    if (newTag) {
      oldCategoryIdToNewTagId[cat.id] = newTag.id;
    }
  }
  console.log('\n✓ Tags created');

  // Step 3: Create new categories from old tags
  console.log(`\n📝 Creating ${currentTags.length} new categories from tags...`);
  const oldTagIdToNewCategoryId = {};

  for (let i = 0; i < currentTags.length; i++) {
    const tag = currentTags[i];
    process.stdout.write(`\r   Progress: ${i + 1}/${currentTags.length}`);

    // Handle both Strapi 4 and Strapi 5 response formats
    const tagData = tag.attributes || tag;

    const newCategory = await createCategory({
      name: tagData.name,
      slug: tagData.slug
    });

    if (newCategory) {
      oldTagIdToNewCategoryId[tag.id] = newCategory.id;
    }
  }
  console.log('\n✓ Categories created');

  // Step 4: Update all posts with new relationships
  console.log(`\n🔗 Updating post relationships...`);
  const posts = await fetchAllPosts();

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    process.stdout.write(`\r   Progress: ${i + 1}/${posts.length}`);

    // Handle both Strapi 4 and Strapi 5 response formats for populated fields
    const postData = post.attributes || post;
    const postCategories = Array.isArray(postData.categories?.data) ? postData.categories.data : (postData.categories || []);
    const postTags = Array.isArray(postData.tags?.data) ? postData.tags.data : (postData.tags || []);

    // Old categories → new tags
    const newTagIds = postCategories
      .map(cat => oldCategoryIdToNewTagId[cat.id])
      .filter(id => id !== undefined);

    // Old tags → new categories
    const newCategoryIds = postTags
      .map(tag => oldTagIdToNewCategoryId[tag.id])
      .filter(id => id !== undefined);

    await updatePost(post.id, newCategoryIds, newTagIds);
  }
  console.log('\n✓ Posts updated');

  // Step 5: Delete old categories
  console.log(`\n🗑️  Deleting ${currentCategories.length} old categories...`);
  for (let i = 0; i < currentCategories.length; i++) {
    process.stdout.write(`\r   Progress: ${i + 1}/${currentCategories.length}`);
    await deleteCategory(currentCategories[i].id);
  }
  console.log('\n✓ Old categories deleted');

  // Step 6: Delete old tags
  console.log(`\n🗑️  Deleting ${currentTags.length} old tags...`);
  for (let i = 0; i < currentTags.length; i++) {
    process.stdout.write(`\r   Progress: ${i + 1}/${currentTags.length}`);
    await deleteTag(currentTags[i].id);
  }
  console.log('\n✓ Old tags deleted');

  // Verification
  console.log(`\n✅ Swap completed successfully!`);
  console.log(`\n📊 New state:`);

  const newCategories = await fetchAllCategories();
  const newTags = await fetchAllTags();

  console.log(`   Categories: ${newCategories.length} (was ${currentTags.length})`);
  console.log(`   Tags: ${newTags.length} (was ${currentCategories.length})`);
  console.log(`\n🎉 Done! Categories and tags have been swapped.`);
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
