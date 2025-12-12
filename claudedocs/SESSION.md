# Session Summary: Production Deployment Fix & Blog Content Display
**Date:** 2025-12-07
**Duration:** ~2 hours
**Status:** ✅ Completed Successfully

## Session Overview
Fixed critical production deployment issues that prevented blog content from displaying on frankbria.com. The site is now live with all 210 blog posts loading correctly.

## Accomplished

### 1. Fixed GitHub Actions Deployment Workflow ✅
**Problem:** Deployment workflow had YAML syntax errors in SSH heredoc, preventing successful deployments.

**Solution:**
- Rewrote deployment workflow to pass environment variables as SSH command arguments before heredoc
- Changed to single-quoted heredoc `<< 'ENDSSH'` to prevent variable expansion
- Replaced `cat` heredoc with `echo` commands for `.env.production` creation
- Added proper NVM detection and initialization

**Files Modified:**
- `.github/workflows/deploy-frontend.yml` - Complete SSH deployment rewrite

**Commits:**
- `e95af39` - Simplify path handling to avoid command substitution errors
- `0aadbb6` - Completely rewrite deployment workflow with proper variable handling
- `02c1005` - Remove line breaks from SSH command
- `b92f75f` - Replace cat heredoc with echo commands for .env.production

### 2. Fixed Strapi API Field Name Issue ✅
**Problem:** Blog posts returned 0 results with 400 Bad Request error: "Invalid key publishedDate"

**Root Cause:** Strapi 5 API uses snake_case field names (`published_date`) but code was querying with camelCase (`publishedDate`)

**Solution:**
- Updated all API queries to use `published_date` instead of `publishedDate`
- Created `normalizePost()` function to convert snake_case to camelCase for frontend
- Applied normalization across all API functions:
  - `getAllPosts()`
  - `getPaginatedPosts()`
  - `getPostsByCategory()`
  - `getRelatedPosts()`

**Files Modified:**
- `lib/strapi.ts` - Added normalization function and updated all API queries

**Commit:**
- `75fdc21` - Update Strapi API to use correct field name published_date

**Field Mappings:**
```typescript
published_date → publishedDate
seo_title → seoTitle
seo_description → seoDescription
wp_post_id → wpPostId
featured_image → featuredImage
```

### 3. Created GitHub Issue for Content Parsing ✅
**Issue #3:** "Improve WordPress content parsing for better display"

Documented 6 content parsing issues:
1. Tab shortcode parsing (`{{tab: Transcript}}`)
2. Image display issues (wp-content/uploads redirects)
3. Image sizing consistency
4. YouTube embed parsing (`<!-- wp:core-embed/youtube`)
5. Buzzsprout audio player replacement
6. WordPress shortcode cleanup

**URL:** https://github.com/frankbria/frankbria-com/issues/3

## Technical Decisions

### 1. SSH Deployment Variable Handling
**Decision:** Pass environment variables as command arguments before heredoc
**Rationale:**
- Avoids complex YAML escaping issues
- Single-quoted heredoc prevents variable expansion conflicts
- More maintainable and debuggable

**Before:**
```yaml
ssh user@host << 'ENDSSH'
  export VAR="value"
  echo $VAR
ENDSSH
```

**After:**
```yaml
ssh user@host "VAR='value' bash -s" << 'ENDSSH'
  echo $VAR
ENDSSH
```

### 2. Data Normalization Layer
**Decision:** Normalize snake_case to camelCase in data layer (`lib/strapi.ts`)
**Rationale:**
- Keeps frontend components using consistent camelCase
- Centralizes field name transformation in one place
- Prevents breaking changes across 40+ component files
- Future-proof for Strapi API changes

### 3. Environment Variable Strategy
**Decision:** Create `.env.production` on server during deployment
**Rationale:**
- Keeps secrets out of git repository
- Uses GitHub Secrets for sensitive data
- Environment-specific configuration (production vs staging)
- Allows dynamic updates without code changes

## Deployment Configuration

### GitHub Environments
**Production:**
- `DEPLOY_HOST`: 45.79.175.165
- `DEPLOY_USER`: root
- `DEPLOY_PATH`: /var/nodejs/frankbria-com
- `PM2_PROCESS_NAME`: frankbria-nextjs
- `SITE_URL`: https://frankbria.com
- `STRAPI_URL`: https://api.frankbria.com
- `STRAPI_API_TOKEN`: [secret]

### PM2 Configuration
- **Port:** 3005
- **Process Name:** frankbria-nextjs
- **Node Version:** 20 (via NVM)
- **Restart Policy:** Always
- **Memory Limit:** 1G

## Pending Work

### High Priority
1. **Content Parser Implementation** (Issue #3)
   - Create `lib/contentParser.ts`
   - Handle tab shortcodes
   - Parse YouTube embeds
   - Fix image paths and sizing
   - Replace Buzzsprout with Spotify links
   - Clean up WordPress shortcodes

### Medium Priority
2. **Image Path Migration**
   - Audit all broken image links
   - Ensure nginx redirects work correctly
   - Consider migrating images to Strapi uploads

3. **Testing Coverage**
   - Add tests for `normalizePost()` function
   - Test deployment workflow in staging
   - Verify all 210 posts display correctly

## Handoff Notes

### For Next Developer
1. **Strapi Field Names:** Always use snake_case in API queries, the normalization layer handles conversion
2. **Deployment Workflow:** Don't modify the SSH heredoc structure without testing in staging first
3. **Environment Variables:** Production secrets are in GitHub Secrets, not in code
4. **Content Issues:** See Issue #3 for known WordPress parsing problems

### Known Issues
- WordPress shortcodes not parsed (tracked in #3)
- Some images may have broken links (tracked in #3)
- Tab components not rendering (tracked in #3)

### Architecture Context
- **Headless CMS:** Strapi 5 at api.frankbria.com
- **Frontend:** Next.js 15.5.7 with App Router
- **Deployment:** GitHub Actions → SSH → PM2 restart
- **Database:** PostgreSQL (Strapi backend)

## Lessons Learned

1. **YAML Heredoc Gotchas:** Single-quoted heredocs prevent variable expansion issues in complex shell scripts
2. **API Version Differences:** Strapi 4 vs 5 changed field naming conventions (camelCase → snake_case)
3. **Debugging Strategy:** Check deployment logs for API errors during build phase, not just runtime
4. **Environment Variables:** Next.js reads `.env.production` during build, must exist before `npm run build`

## Resources

### Deployment
- Workflow: `.github/workflows/deploy-frontend.yml`
- PM2 Config: `ecosystem.config.js`
- Environment: `.env.production` (server), `.env.local` (local dev)

### API Integration
- Strapi Client: `lib/strapi.ts`
- Blog Pages: `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`
- Category Pages: `app/category/[slug]/page.tsx`

### Documentation
- Migration Plan: `docs/migration-plan.md`
- Testing Checklist: `docs/testing-checklist.md`
- Nginx Config: `docs/nginx-uploads-fix.md`

## Session Statistics
- **Commits:** 5
- **Files Modified:** 2
- **Lines Changed:** +30, -18
- **Deployments:** 2 (1 failed, 1 successful)
- **Issues Created:** 1
- **Bugs Fixed:** 2 (deployment workflow, API field names)

---

**Next Session:** Implement content parser for WordPress shortcodes (Issue #3)
