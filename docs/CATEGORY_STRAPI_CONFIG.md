# Strapi Category Configuration Guide

## ✅ Already Configured

Good news! The category feature is **already configured in Strapi** from the WordPress migration. No backend changes are needed.

---

## Current Strapi Setup

### Category Collection Type

**Location:** Strapi Admin → Content-Type Builder → Categories

The following fields are already configured:

| Field | Type | Settings |
|-------|------|----------|
| `name` | String | Required |
| `slug` | UID | Auto-generated from `name`, Required |
| `posts` | Relation | Many-to-Many with Posts |

### Post-Category Relationship

**Location:** Strapi Admin → Content-Type Builder → Posts → categories

| Setting | Value |
|---------|-------|
| Relation Type | Many-to-Many |
| Target | Categories |
| Mapped By | posts |

---

## How to Use Categories in Strapi Admin

### 1. Access Categories

1. Log in to Strapi admin: `https://beta.frankbria.com/admin`
2. Click **Content Manager** in left sidebar
3. Click **Categories** under Collection Types

### 2. Create a New Category

1. Click **"+ Create new entry"** button
2. Fill in fields:
   - **Name**: Enter category name (e.g., "Business Strategy")
   - **Slug**: Auto-generated (e.g., "business-strategy")
   - **Description**: Optional - add category description for SEO
3. Click **Save**
4. Click **Publish** to make it live

### 3. Assign Categories to Posts

**Method 1: From Post Editor**

1. Go to **Content Manager → Posts**
2. Click on a post to edit
3. Scroll to **Categories** field
4. Select one or more categories from the dropdown
5. Click **Save** and **Publish**

**Method 2: From Category Editor**

1. Go to **Content Manager → Categories**
2. Click on a category to edit
3. Scroll to **Posts** field
4. Select posts to add to this category
5. Click **Save** and **Publish**

---

## Testing Category Pages

### Step 1: Verify Categories Exist

In Strapi Admin:
- Go to **Content Manager → Categories**
- You should see categories imported from WordPress
- Each category should have a slug (auto-generated from name)

### Step 2: Verify Posts Have Categories

In Strapi Admin:
- Go to **Content Manager → Posts**
- Click on any post
- Check the **Categories** field
- Posts should have at least one category assigned

### Step 3: Test Category Pages

Once the code is deployed to `beta.frankbria.com`:

1. **Test category listing on blog page:**
   - Visit: `https://beta.frankbria.com/blog`
   - You should see category badges under each post
   - Click a category badge → should go to category page

2. **Test category page directly:**
   - Find a category slug in Strapi (e.g., "business-strategy")
   - Visit: `https://beta.frankbria.com/category/business-strategy`
   - Should show all posts in that category

3. **Test individual post page:**
   - Visit any blog post
   - Category links should appear under the title
   - Click a category → should go to category page

---

## Adding the Description Field (Optional Enhancement)

If you want to add descriptions to categories (recommended for SEO):

### In Strapi Admin:

1. Go to **Content-Type Builder**
2. Click **Categories**
3. Click **"+ Add another field"**
4. Select **"Text"** (for short description) or **"Rich text"** (for longer description)
5. Name it: `description`
6. Click **Finish**
7. Click **Save**
8. Restart Strapi (server will prompt you)

### Then Update Existing Categories:

1. Go to **Content Manager → Categories**
2. Edit each category
3. Add a description (e.g., "Insights and strategies for scaling your business to 7 figures")
4. Save and Publish

The category pages will automatically display the description if it exists.

---

## Troubleshooting

### Issue: Category pages show 404

**Cause:** Category doesn't exist in Strapi or has no slug

**Fix:**
1. Go to Strapi Admin → Categories
2. Verify category exists
3. Check that `slug` field is filled (should auto-generate)
4. Re-save and publish the category

### Issue: No posts showing on category page

**Cause:** Posts don't have that category assigned

**Fix:**
1. Go to Strapi Admin → Posts
2. Edit posts that should be in this category
3. Add the category in the **Categories** field
4. Save and Publish

### Issue: Category badge not clickable on blog page

**Cause:** Post category doesn't have a `slug` field

**Fix:**
1. Go to Strapi Admin → Categories
2. Edit the category
3. The slug should auto-generate from the name
4. If not, re-type the name and save
5. Publish

### Issue: API returns empty categories array

**Cause:** Posts not published or relationship not saved

**Fix:**
1. Edit the post in Strapi
2. Re-select categories
3. Click **Save**
4. Click **Publish**
5. Wait 5 minutes for cache to clear (or rebuild Next.js)

---

## API Endpoints

The category pages use these Strapi API endpoints:

### Get All Categories
```
GET https://beta.frankbria.com/api/categories?populate=*&sort=name:asc
```

### Get Category by Slug
```
GET https://beta.frankbria.com/api/categories?filters[slug][$eq]=business-strategy&populate=*
```

### Get Posts by Category
```
GET https://beta.frankbria.com/api/posts?filters[categories][slug][$eq]=business-strategy&populate=*&sort=publishedDate:desc&pagination[page]=1&pagination[pageSize]=12
```

You can test these in your browser or with curl to verify data is returning correctly.

---

## Example Categories

Based on the WordPress migration, you should have categories like:

- Business Strategy (`business-strategy`)
- Marketing (`marketing`)
- Sales (`sales`)
- Leadership (`leadership`)
- Technology (`technology`)
- Uncategorized (`uncategorized`)

Visit these URLs once deployed:
- `https://beta.frankbria.com/category/business-strategy`
- `https://beta.frankbria.com/category/marketing`
- `https://beta.frankbria.com/category/sales`

---

## Performance Notes

### Caching Strategy

Category pages use ISR (Incremental Static Regeneration):
- Pages are pre-rendered at build time
- Regenerate every 5 minutes
- Fast page loads + fresh content

### When Changes Appear

After updating categories or posts in Strapi:
1. **Immediately**: Changes visible in Strapi Admin
2. **Within 5 minutes**: Changes visible on website (ISR)
3. **Instantly (force)**: Run `npm run build` and redeploy

---

## Summary

✅ **No Strapi configuration needed** - Already set up from WordPress migration

✅ **Ready to use immediately** - Just deploy the code

✅ **Optional enhancement** - Add `description` field to categories for better SEO

✅ **Test after deployment** - Visit category pages on beta.frankbria.com

---

## Quick Checklist

Before testing category pages:

- [ ] Strapi is running at beta.frankbria.com
- [ ] Categories exist in Strapi Admin
- [ ] Posts have categories assigned
- [ ] Code deployed to beta.frankbria.com
- [ ] Visit `/blog` and click a category badge
- [ ] Visit `/category/[slug]` directly
- [ ] Verify pagination works (if >12 posts)
- [ ] Check category links on individual posts

**Everything should work out of the box!** 🎉
