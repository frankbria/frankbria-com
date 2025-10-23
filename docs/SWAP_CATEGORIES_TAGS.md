# Swapping Categories and Tags in Strapi

## Problem

During the WordPress to Strapi migration, all terms (both categories AND tags) were imported into the "categories" collection due to a simplified migration script. This resulted in:

- **~600 categories** (should be ~6)
- **~6 tags** (should be ~600)

## Solution

We need to swap the contents of the categories and tags collections.

---

## Pre-Swap Checklist

Before running the swap script:

- [ ] **Backup Strapi database** (critical!)
- [ ] **Verify Strapi API token** is available
- [ ] **Confirm current counts** in Strapi Admin
- [ ] **Test script in development** (optional but recommended)

---

## Step 1: Backup the Strapi Database

**SSH into the server:**
```bash
ssh root@47.88.89.175
```

**Create backup:**
```bash
cd /var/nodejs/frankbria-strapi

# Backup PostgreSQL database
PGPASSWORD='$POSTGRES_PASSWORD' pg_dump -h localhost -U strapi_user -d frankbria_strapi > ~/strapi_backup_$(date +%Y%m%d-%H%M%S).sql
```

**Verify backup exists:**
```bash
ls -lh ~/strapi_backup*.sql
```

**Expected output:**
```
-rw-r--r-- 1 root root 15M Oct 22 14:30 strapi_backup_20251022-143000.sql
```

---

## Step 2: Get Strapi API Token

You need an API token with full permissions to run the swap script.

**Option A: Use existing token from `.env`**
```bash
ssh root@47.88.89.175 "cat /var/nodejs/frankbria-strapi/.env | grep STRAPI_API_TOKEN"
```

**Option B: Create new token in Strapi Admin**
1. Go to `https://beta.frankbria.com/admin`
2. Navigate to **Settings → API Tokens**
3. Click **"Create new API Token"**
4. Name: `Category/Tag Swap Script`
5. Token type: **Full access**
6. Click **Save**
7. **Copy the token** (you won't see it again!)

---

## Step 3: Run the Swap Script

### From Your Local Machine

```bash
cd /home/frankbria/projects/frankbria-com

# Set the API token
export STRAPI_API_TOKEN="your_token_here"

# Run the swap script
node scripts/swap-categories-tags.js
```

### From the Server

```bash
# SSH into server
ssh root@47.88.89.175

# Navigate to project
cd /var/nodejs/frankbria-com

# Pull latest code
git pull origin claude/wp-site-deployment-011CULpfpFvx2WjK4FMWRoNf

# Set the API token (get from Strapi .env)
export STRAPI_API_TOKEN=$(cat /var/nodejs/frankbria-strapi/.env | grep STRAPI_API_TOKEN | cut -d '=' -f2)

# Run the swap script
node scripts/swap-categories-tags.js
```

---

## What the Script Does

The script performs these operations in order:

1. **Fetch current data**
   - Gets all categories (~600)
   - Gets all tags (~6)
   - Gets all posts with their relationships

2. **Create new tags** from old categories
   - Creates ~600 new tags
   - Maps old category IDs to new tag IDs

3. **Create new categories** from old tags
   - Creates ~6 new categories
   - Maps old tag IDs to new category IDs

4. **Update all posts**
   - Old post.categories → new post.tags
   - Old post.tags → new post.categories

5. **Delete old data**
   - Deletes old ~600 categories
   - Deletes old ~6 tags

6. **Verification**
   - Confirms new counts
   - Reports success

---

## Expected Output

```
🔄 Starting category/tag swap process...

📥 Fetching all categories...
✓ Found 612 categories

📥 Fetching all tags...
✓ Found 6 tags

📊 Current state:
   Categories: 612
   Tags: 6

⚠️  This script will:
   - Move 612 categories → tags
   - Move 6 tags → categories

⏳ Starting in 5 seconds... (Ctrl+C to cancel)

📝 Creating 612 new tags from categories...
   Progress: 612/612
✓ Tags created

📝 Creating 6 new categories from tags...
   Progress: 6/6
✓ Categories created

🔗 Updating post relationships...
   Progress: 147/147
✓ Posts updated

🗑️  Deleting 612 old categories...
   Progress: 612/612
✓ Old categories deleted

🗑️  Deleting 6 old tags...
   Progress: 6/6
✓ Old tags deleted

✅ Swap completed successfully!

📊 New state:
   Categories: 6 (was 6)
   Tags: 612 (was 612)

🎉 Done! Categories and tags have been swapped.
```

---

## Verification

### In Strapi Admin

1. Go to `https://beta.frankbria.com/admin`
2. Check **Content Manager → Categories**
   - Should now have ~6 categories
   - Examples: Uncategorized, Business, Technology, etc.
3. Check **Content Manager → Tags**
   - Should now have ~600 tags
   - Examples: wordpress, migration, strapi, etc.
4. Check **Content Manager → Posts**
   - Open a few posts
   - Verify categories and tags are assigned correctly

### On the Website

1. Visit `https://beta.frankbria.com/blog`
2. Category badges should show actual categories (not tags)
3. Click a category badge → should go to category page
4. Category pages should show correct filtered posts

---

## Rollback (If Needed)

If something goes wrong:

```bash
ssh root@47.88.89.175

# Stop Strapi
pm2 stop strapi

# Restore PostgreSQL backup (replace YYYYMMDD-HHMMSS with your backup timestamp)
PGPASSWORD='$POSTGRES_PASSWORD' psql -h localhost -U strapi_user -d frankbria_strapi < ~/strapi_backup_YYYYMMDD-HHMMSS.sql

# Restart Strapi
pm2 restart strapi

# Verify
pm2 logs strapi --lines 50
```

**Note:** PostgreSQL restore will drop and recreate all tables, completely restoring to the backup state.

---

## Post-Swap Actions

After successful swap:

1. **Test category pages**
   - Visit `/category/business`
   - Visit `/category/technology`
   - Verify pagination works

2. **Update category descriptions** (optional)
   - Go to Strapi Admin → Categories
   - Add descriptions for better SEO
   - Example: "Business" → "Business strategies and insights"

3. **Verify deployment**
   - Push code to trigger GitHub Actions
   - Verify build succeeds
   - Check beta.frankbria.com after deployment

---

## Troubleshooting

### Error: "STRAPI_API_TOKEN environment variable not set"
**Fix:** Set the token before running:
```bash
export STRAPI_API_TOKEN="your_token_here"
```

### Error: "Failed to create tag/category"
**Cause:** Duplicate slug or name conflict
**Fix:** Check Strapi Admin for duplicates, delete manually, then re-run

### Error: "Failed to update post"
**Cause:** Post permissions or invalid relationship
**Fix:** Check post in Strapi Admin, verify it's published

### Script hangs or times out
**Cause:** Large dataset, slow connection
**Fix:**
- Run from server directly (faster connection)
- Increase timeout in axios config
- Run in smaller batches

---

## Safety Notes

✅ **Safe Operations:**
- Script creates new data before deleting old data
- Post relationships are preserved
- Database backup created first

⚠️ **Risks:**
- If script crashes mid-way, you may have duplicates
- Rollback via database backup if needed
- Test in development first if possible

🔒 **Security:**
- API token has full access - keep secure
- Delete token after swap if created specifically for this
- Don't commit token to git

---

## Estimated Time

- **Backup:** 1 minute
- **Script execution:** 5-10 minutes (depends on dataset size)
- **Verification:** 5 minutes
- **Total:** 15-20 minutes

---

## Summary

1. ✅ Backup database
2. ✅ Get API token
3. ✅ Run swap script
4. ✅ Verify in Strapi Admin
5. ✅ Test on website
6. ✅ Update category descriptions (optional)

**Questions?** Check the script output for detailed progress and error messages.
