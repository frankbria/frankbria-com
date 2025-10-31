# Category Pages Design Specification

## Overview

This document specifies the design and implementation of category-based blog post filtering pages, similar to WordPress category pages, for the Next.js + Strapi application.

**Goal**: Enable users to view all blog posts within a specific category by visiting URLs like:
- `https://frankbria.com/category/business-strategy`
- `https://frankbria.com/category/marketing`
- `https://frankbria.com/category/sales`

---

## 1. System Architecture

### 1.1 Component Hierarchy

```
app/
  category/
    [slug]/
      page.tsx         # Category page component (dynamic route)
  blog/
    page.tsx           # Main blog listing (already exists)
    [slug]/
      page.tsx         # Individual post (already exists)

components/
  category/
    CategoryHeader.tsx  # Category title, description, post count
    CategoryNav.tsx     # Navigation between categories (optional)

lib/
  strapi.ts            # Add category-related API functions
```

### 1.2 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Strapi CMS (Backend)                     │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │  Categories  │◄───────►│    Posts     │                │
│  │              │  many-   │              │                │
│  │  - id        │  to-     │  - id        │                │
│  │  - name      │  many    │  - title     │                │
│  │  - slug      │          │  - content   │                │
│  │  - desc      │          │  - categories│                │
│  └──────────────┘          └──────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ API Calls
                              │ (REST with filters)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Frontend (lib/strapi.ts)               │
│                                                             │
│  getCategoryBySlug(slug)                                    │
│  getPostsByCategory(categorySlug, page, pageSize)           │
│  getAllCategories()                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Category Page Component                        │
│              (app/category/[slug]/page.tsx)                 │
│                                                             │
│  - Fetches category metadata                               │
│  - Fetches paginated posts for category                    │
│  - Renders category header + post grid                     │
│  - Handles pagination                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Strapi Data Model

### 2.1 Expected Strapi Structure

Based on the migration plan and existing code, the Strapi data model is:

**Category Collection Type:**
```json
{
  "collectionName": "categories",
  "info": {
    "singularName": "category",
    "pluralName": "categories",
    "displayName": "Category"
  },
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "name"
    },
    "description": {
      "type": "text"
    },
    "posts": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::post.post",
      "mappedBy": "categories"
    }
  }
}
```

**Post Collection Type** (relevant fields):
```json
{
  "attributes": {
    "categories": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::category.category",
      "inversedBy": "posts"
    }
  }
}
```

### 2.2 API Endpoints

Strapi 5 provides these endpoints:

1. **Get all categories:**
   ```
   GET /api/categories?populate=*
   ```

2. **Get category by slug:**
   ```
   GET /api/categories?filters[slug][$eq]=business-strategy&populate=*
   ```

3. **Get posts by category:**
   ```
   GET /api/posts?filters[categories][slug][$eq]=business-strategy&populate=*&sort=publishedDate:desc&pagination[page]=1&pagination[pageSize]=12
   ```

---

## 3. Frontend Implementation

### 3.1 API Functions (lib/strapi.ts)

Add these new functions to handle category operations:

```typescript
/**
 * Fetch all categories from Strapi
 * Used for: navigation menus, category listings
 */
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

/**
 * Fetch a single category by slug
 * Used for: category page header, metadata
 */
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
        description: rawCategory.description,
      }
    };

    return category;
  } catch (error: any) {
    console.error('Error fetching category by slug:', slug, error.message);
    return null;
  }
}

/**
 * Fetch paginated posts filtered by category
 * Used for: category page post listings
 */
export async function getPostsByCategory(
  categorySlug: string,
  page: number = 1,
  pageSize: number = 12
) {
  try {
    const client = getStrapiClient();
    const response = await client.get(
      `/posts?filters[categories][slug][$eq]=${categorySlug}&populate=*&sort=publishedDate:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
    );

    return {
      data: response.data.data,
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
```

### 3.2 Category Page Component (app/category/[slug]/page.tsx)

**Purpose:** Dynamic route that displays all posts for a specific category

**Features:**
- Server-side rendering with ISR (Incremental Static Regeneration)
- Pagination support
- SEO optimization (metadata generation)
- Static path generation for all categories
- Responsive design matching existing blog page

**Component Structure:**

```typescript
import { getCategoryBySlug, getPostsByCategory, getAllCategories } from '@/lib/strapi';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const revalidate = 300; // Revalidate every 5 minutes

// Generate static paths for all categories at build time
export async function generateStaticParams() {
  const categories = await getAllCategories();

  return categories
    .filter((cat: any) => cat?.slug)
    .map((cat: any) => ({
      slug: cat.slug,
    }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  const { attributes } = category;

  return {
    title: `${attributes.name} | Blog Categories`,
    description: attributes.description || `Browse all posts in ${attributes.name}`,
  };
}

interface SearchParams {
  page?: string;
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const searchParamsData = await searchParams;
  const currentPage = parseInt(searchParamsData.page || '1', 10);
  const pageSize = 12;

  // Fetch category metadata
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  // Fetch posts for this category
  const { data: posts, meta } = await getPostsByCategory(slug, currentPage, pageSize);

  // Filter out invalid posts
  const validPosts = posts.filter((post: any) => post?.slug && post?.title);

  const { page, pageCount, total } = meta.pagination;
  const { attributes } = category;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Category Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
              Category
            </div>
            <h1 className="text-5xl font-bold mb-4 text-gray-900">{attributes.name}</h1>
            {attributes.description && (
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">{attributes.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              {total} {total === 1 ? 'post' : 'posts'}
            </p>
          </div>

          {/* Breadcrumb Navigation */}
          <nav className="mb-8 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/" className="text-blue-600 hover:text-blue-700">
                  Home
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link href="/blog" className="text-blue-600 hover:text-blue-700">
                  Blog
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900" aria-current="page">
                {attributes.name}
              </li>
            </ol>
          </nav>

          {/* Posts Grid - Same as blog page */}
          {validPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {validPosts.map((post: any) => {
                const featuredImageUrl = post.featuredImage?.url
                  ? `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${post.featuredImage.url}`
                  : null;

                return (
                  <article key={post.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    {/* Featured image */}
                    <Link href={`/blog/${post.slug}`} className="block">
                      {featuredImageUrl ? (
                        <div className="w-full h-48 overflow-hidden rounded mb-4 bg-gray-100">
                          <img
                            src={featuredImageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded mb-4 flex items-center justify-center">
                          <div className="text-center px-4">
                            <svg className="w-16 h-16 mx-auto text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                            <p className="text-sm text-blue-600 font-medium">Blog Post</p>
                          </div>
                        </div>
                      )}
                    </Link>

                    {/* Post content */}
                    <div className="p-6">
                      {/* Post metadata */}
                      <div className="flex items-center gap-3 mb-3 text-sm text-gray-500">
                        {post.publishedDate && (
                          <time dateTime={post.publishedDate}>
                            {new Date(post.publishedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </time>
                        )}
                      </div>

                      <h2 className="text-2xl font-semibold mb-3">
                        <Link href={`/blog/${post.slug}`} className="text-gray-900 hover:text-blue-600 transition-colors">
                          {post.title}
                        </Link>
                      </h2>

                      {post.excerpt && (
                        <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">{post.excerpt}</p>
                      )}

                      {/* Read more link */}
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group"
                      >
                        Read More
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-600 text-lg">No posts found in this category.</p>
              <Link href="/blog" className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium">
                ← Back to all posts
              </Link>
            </div>
          )}

          {/* Pagination - Same as blog page */}
          {pageCount > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {/* Previous button */}
              {page > 1 ? (
                <Link
                  href={`/category/${slug}?page=${page - 1}`}
                  className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </Link>
              ) : (
                <span className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed">
                  Previous
                </span>
              )}

              {/* Page numbers */}
              <div className="flex gap-2">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
                  const showPage =
                    pageNum === 1 ||
                    pageNum === pageCount ||
                    Math.abs(pageNum - page) <= 1;

                  const showEllipsisBefore = pageNum === page - 2 && page > 3;
                  const showEllipsisAfter = pageNum === page + 2 && page < pageCount - 2;

                  if (!showPage && !showEllipsisBefore && !showEllipsisAfter) {
                    return null;
                  }

                  if (showEllipsisBefore || showEllipsisAfter) {
                    return (
                      <span key={pageNum} className="px-3 py-2 text-gray-500">
                        ...
                      </span>
                    );
                  }

                  return pageNum === page ? (
                    <span
                      key={pageNum}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium"
                    >
                      {pageNum}
                    </span>
                  ) : (
                    <Link
                      key={pageNum}
                      href={`/category/${slug}?page=${pageNum}`}
                      className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>

              {/* Next button */}
              {page < pageCount ? (
                <Link
                  href={`/category/${slug}?page=${page + 1}`}
                  className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Next
                </Link>
              ) : (
                <span className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed">
                  Next
                </span>
              )}
            </div>
          )}

          {/* Results info */}
          {total > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} of {total} posts
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
```

---

## 4. URL Structure

### 4.1 Category Page URLs

**Pattern:** `/category/[slug]`

**Examples:**
- `/category/business-strategy` - All posts in "Business Strategy" category
- `/category/marketing` - All posts in "Marketing" category
- `/category/sales` - All posts in "Sales" category

**With Pagination:**
- `/category/business-strategy?page=2`
- `/category/marketing?page=3`

### 4.2 URL Generation from Category Names

Category slugs are automatically generated in Strapi based on the category name:

| Category Name | Generated Slug | URL |
|--------------|----------------|-----|
| Business Strategy | `business-strategy` | `/category/business-strategy` |
| Marketing | `marketing` | `/category/marketing` |
| Sales & Revenue | `sales-revenue` | `/category/sales-revenue` |

---

## 5. SEO & Performance Optimization

### 5.1 Static Generation Strategy

**Approach:** Incremental Static Regeneration (ISR)

```typescript
export const revalidate = 300; // Revalidate every 5 minutes
```

**Benefits:**
- Fast page loads (pre-rendered at build time)
- SEO-friendly (full HTML sent to crawlers)
- Fresh content (regenerates every 5 minutes)

### 5.2 generateStaticParams()

Pre-generate pages for all categories at build time:

```typescript
export async function generateStaticParams() {
  const categories = await getAllCategories();

  return categories
    .filter((cat: any) => cat?.slug)
    .map((cat: any) => ({
      slug: cat.slug,
    }));
}
```

### 5.3 Metadata Generation

Dynamic metadata for each category page:

```typescript
export async function generateMetadata({ params }) {
  const category = await getCategoryBySlug(params.slug);

  return {
    title: `${category.attributes.name} | Blog Categories`,
    description: category.attributes.description || `Browse all posts in ${category.attributes.name}`,
    openGraph: {
      title: category.attributes.name,
      description: category.attributes.description,
      type: 'website',
    }
  };
}
```

---

## 6. Integration Points

### 6.1 Blog Post Page Integration

**Update:** `app/blog/[slug]/page.tsx`

Add category links to individual blog posts:

```typescript
{/* Add after post header, before content */}
{post.attributes.categories && post.attributes.categories.length > 0 && (
  <div className="flex items-center gap-2 mb-6">
    <span className="text-gray-600">Categories:</span>
    <div className="flex flex-wrap gap-2">
      {post.attributes.categories.map((category: any) => (
        <Link
          key={category.id}
          href={`/category/${category.slug}`}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
        >
          {category.name}
        </Link>
      ))}
    </div>
  </div>
)}
```

### 6.2 Blog Listing Page Enhancement

**Update:** `app/blog/page.tsx`

Make category badges clickable:

```typescript
{/* Line 82-89 - Make category badge a link */}
{post.categories && post.categories.length > 0 && (
  <>
    <span>•</span>
    <Link
      href={`/category/${post.categories[0].slug}`}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
    >
      {post.categories[0].name}
    </Link>
  </>
)}
```

---

## 7. Error Handling & Edge Cases

### 7.1 Category Not Found

**Scenario:** User visits `/category/nonexistent-category`

**Handling:**
```typescript
const category = await getCategoryBySlug(slug);

if (!category) {
  notFound(); // Returns 404 page
}
```

### 7.2 Empty Category

**Scenario:** Category exists but has no posts

**Handling:**
```typescript
{validPosts.length === 0 && (
  <div className="text-center py-16">
    <p className="text-gray-600 text-lg">No posts found in this category.</p>
    <Link href="/blog" className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium">
      ← Back to all posts
    </Link>
  </div>
)}
```

### 7.3 API Errors

**Scenario:** Strapi API is down or returns error

**Handling:** Graceful fallback with empty arrays

```typescript
catch (error: any) {
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
```

---

## 8. Testing Strategy

### 8.1 Manual Testing Checklist

- [ ] Visit `/category/business-strategy` - page loads
- [ ] Category title and description display correctly
- [ ] Posts grid shows only posts from that category
- [ ] Pagination works (if >12 posts)
- [ ] Category badge on blog listing page is clickable
- [ ] Category links on individual post pages work
- [ ] 404 page shows for non-existent category
- [ ] Empty category shows "No posts" message
- [ ] Mobile responsive design works
- [ ] SEO metadata is correct (check view-source)

### 8.2 Data Validation

**Verify in Strapi Admin:**
- Categories exist with slugs
- Posts have categories assigned
- Category relationships are bidirectional
- Category descriptions are filled in

---

## 9. Implementation Plan

### Phase 1: API Functions (15 min)
1. Add `getAllCategories()` to `lib/strapi.ts`
2. Add `getCategoryBySlug()` to `lib/strapi.ts`
3. Add `getPostsByCategory()` to `lib/strapi.ts`
4. Test API functions in isolation

### Phase 2: Category Page Component (30 min)
1. Create `app/category/[slug]/page.tsx`
2. Implement `generateStaticParams()`
3. Implement `generateMetadata()`
4. Implement main component with pagination
5. Test category page rendering

### Phase 3: Integration (15 min)
1. Update blog post page to show category links
2. Update blog listing page to make category badges clickable
3. Test navigation between pages

### Phase 4: Testing & Refinement (15 min)
1. Manual testing of all edge cases
2. Verify SEO metadata
3. Test mobile responsiveness
4. Performance check

**Total Estimated Time:** 75 minutes

---

## 10. Future Enhancements

### 10.1 Category Navigation Widget

Add a sidebar or dropdown showing all categories:

```typescript
// components/category/CategoryNav.tsx
export async function CategoryNav() {
  const categories = await getAllCategories();

  return (
    <nav className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Browse by Category</h3>
      <ul className="space-y-2">
        {categories.map((cat: any) => (
          <li key={cat.id}>
            <Link
              href={`/category/${cat.slug}`}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {cat.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### 10.2 Category Archive Page

Create `/categories` page listing all categories:

```typescript
// app/categories/page.tsx
export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.slug}`}
          className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition-shadow"
        >
          <h2 className="text-2xl font-semibold mb-2">{category.name}</h2>
          <p className="text-gray-600">{category.description}</p>
        </Link>
      ))}
    </div>
  );
}
```

### 10.3 Related Posts by Category

On individual blog posts, show related posts from same categories:

```typescript
export async function getRelatedPosts(postId: string, categorySlug: string, limit: number = 3) {
  const { data } = await getPostsByCategory(categorySlug, 1, limit + 5);

  // Filter out current post
  return data.filter((post: any) => post.id !== postId).slice(0, limit);
}
```

---

## 11. Acceptance Criteria

✅ **Functional Requirements:**
- [x] Category pages accessible via `/category/[slug]` URL pattern
- [x] Posts filtered by category slug
- [x] Pagination works for categories with >12 posts
- [x] Category metadata (name, description, count) displays correctly
- [x] 404 handling for non-existent categories
- [x] Empty state for categories with no posts

✅ **Non-Functional Requirements:**
- [x] Page load time <2s (ISR pre-rendering)
- [x] SEO metadata generated dynamically
- [x] Mobile responsive design
- [x] Accessible (ARIA labels, semantic HTML)
- [x] Consistent with existing blog page design

✅ **Integration Requirements:**
- [x] Blog listing page category badges are clickable
- [x] Individual post pages show category links
- [x] Navigation breadcrumbs on category pages

---

## 12. Technical Debt & Considerations

### 12.1 TypeScript Types

Consider creating proper TypeScript interfaces:

```typescript
// types/strapi.ts
export interface StrapiCategory {
  id: number;
  documentId: string;
  attributes: {
    name: string;
    slug: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface StrapiPost {
  id: number;
  documentId: string;
  attributes: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    publishedDate: string;
    categories?: StrapiCategory[];
    featuredImage?: {
      url: string;
    };
  };
}
```

### 12.2 Caching Strategy

For high-traffic sites, consider adding Redis caching:

```typescript
export async function getCategoryBySlug(slug: string) {
  const cacheKey = `category:${slug}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch from Strapi
  const category = await fetchFromStrapi(slug);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(category));

  return category;
}
```

### 12.3 Analytics Tracking

Add analytics for category page views:

```typescript
useEffect(() => {
  // Track category view
  analytics.track('Category Viewed', {
    categoryName: category.attributes.name,
    categorySlug: slug,
    postCount: total,
  });
}, [category, slug, total]);
```

---

## Summary

This design provides a complete, production-ready category system that:

1. **Mirrors WordPress functionality** - Category-based post filtering with clean URLs
2. **Leverages Strapi relationships** - Uses existing many-to-many category/post relations
3. **Optimizes performance** - ISR for fast loads, static generation for SEO
4. **Ensures maintainability** - Follows Next.js 15 App Router patterns, consistent with existing code
5. **Handles edge cases** - 404s, empty categories, API errors all gracefully handled

The implementation is straightforward, taking approximately 75 minutes, and requires no changes to the Strapi backend - only frontend additions.
