# Blog Post 404 Error Fix

## Issue
Blog posts were returning 404 errors at `https://beta.frankbria.com/blog/<slug>`, despite posts existing in the Strapi admin panel (210+ posts).

## Root Causes Discovered

### 1. Expired API Token
After Strapi admin was rebuilt, the API token used by Next.js expired, causing 401 Unauthorized errors.

**Solution**: Updated `STRAPI_API_TOKEN` in `/var/nodejs/frankbria-com/.env.local` with new token from Strapi admin.

### 2. Stale Next.js Build Cache
Next.js bakes environment variables into build artifacts at build time. Simply restarting PM2 doesn't pick up new environment variables.

**Solution**: Cleared `.next/` directory and rebuilt: `rm -rf .next && npm run build`

### 3. Limited Pagination (25 posts)
The `getAllPosts()` function was only fetching the default 25 posts, but there are 210+ posts in Strapi. Posts beyond the first 25 couldn't be statically generated.

**Solution**: Added pagination parameter: `pagination[pageSize]=100` to fetch more posts.

### 4. Invalid Posts Without Slugs
Some posts in Strapi had missing or undefined `attributes` or `slug` fields, causing build failures.

**Solution**: Added filter in `generateStaticParams` and blog listing page:
```typescript
.filter((post: any) => post?.attributes?.slug && post?.attributes?.title)
```

### 5. Strapi 5 API Response Format Mismatch
**The Critical Issue**: Strapi 5 returns different response structures for different query types:
- **Collection queries** (getAllPosts): Returns posts with `attributes` wrapper
  ```json
  {
    "id": 1202,
    "attributes": {
      "title": "...",
      "slug": "...",
      ...
    }
  }
  ```
- **Filtered queries** (getPostBySlug): Returns flat structure WITHOUT `attributes` wrapper
  ```json
  {
    "id": 1202,
    "title": "...",
    "slug": "...",
    ...
  }
  ```

Our code expected all posts to have `post.attributes.title`, which worked for collection queries but failed for filtered queries.

**Solution**: Normalized the response in `getPostBySlug()` to wrap flat responses in an `attributes` object:
```typescript
const post = rawPost.attributes ? rawPost : {
  id: rawPost.id,
  documentId: rawPost.documentId,
  attributes: {
    title: rawPost.title,
    slug: rawPost.slug,
    // ... all other fields
  }
};
```

## Implementation Steps

1. **Updated API token** in `.env.local` on server
2. **Cleaned Next.js build cache**: `rm -rf .next`
3. **Added pagination** to `getAllPosts()`: fetch 100 posts instead of 25
4. **Added filtering** in `generateStaticParams()` and blog listing page to skip invalid posts
5. **Normalized response format** in `getPostBySlug()` to handle Strapi 5's flat structure
6. **Rebuilt Next.js**: `npm run build`
7. **Restarted PM2**: `pm2 restart frankbria-nextjs`

## Files Modified
- `lib/strapi.ts` - Added pagination, response normalization
- `app/blog/[slug]/page.tsx` - Added post filtering in generateStaticParams
- `app/blog/page.tsx` - Added post filtering for blog listing
- `/var/nodejs/frankbria-com/.env.local` - Updated API token

## Verification
```bash
# Test individual blog post
curl -I https://beta.frankbria.com/blog/episode-120-the-best-of-series-mitch-russo
# HTTP/2 200 ✅

# Test blog listing
curl -I https://beta.frankbria.com/blog
# HTTP/2 200 ✅
```

## Key Learnings

1. **Strapi 5 API Behavior**: Different query types return different response structures. Always check actual API responses during debugging.

2. **Next.js Build-Time Environment Variables**: Server-side environment variables are baked into the build. Changes require a rebuild, not just a restart.

3. **Pagination Defaults**: Always check API pagination defaults. Strapi defaults to 25 items per page.

4. **Data Validation**: Filter out invalid/incomplete data before processing to prevent build failures.

5. **Systematic Debugging**: Following the systematic debugging process (error messages → evidence gathering → hypothesis → fix) quickly identified all root causes.

## Date
2025-10-15

## Related Tasks
- Task 9: Blog Post Pages with ISR (completed)
- Task 12: Deploy Next.js to Server (completed)
