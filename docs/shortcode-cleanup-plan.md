# WordPress Shortcode Cleanup Plan

## Current Status

Blog posts migrated from WordPress contain shortcodes that are currently displaying as raw text in the rendered content (e.g., `[podcast_subscribe id="2664"]`).

## Identified Shortcode Types

Based on preliminary analysis, the following shortcode types have been identified:

### 1. `[podcast_subscribe]`
**Purpose**: Subscribe button/widget for podcast
**Example**: `[podcast_subscribe id="2664"]`
**Current Behavior**: Displays as raw text

**Replacement Options**:
- **Option A**: Remove entirely (users can subscribe via podcast platforms)
- **Option B**: Replace with HTML link to podcast subscription page
- **Option C**: Replace with React component that shows podcast platform links
- **Option D**: Keep as-is for now (visible but non-functional)

**Recommendation**: ?

---

### 2. `[intense_tabs]` / `[intense_tab]`
**Purpose**: Tabbed content sections (WordPress plugin)
**Example**:
```
[intense_tabs direction="horizontal" theme_type="classic" duration="500" id="2924"]
[intense_tab title="Podcast" link_target="_self" icon_type="icon" icon_fontawesome="fa fa-microphone" icon_lnr=""]
[/intense_tab]
[/intense_tabs]
```
**Current Behavior**: Displays as raw shortcode text

**Replacement Options**:
- **Option A**: Remove shortcodes, flatten content into sequential sections with `<h3>` headings
- **Option B**: Create React tabs component to preserve tabbed functionality
- **Option C**: Convert to HTML `<details>/<summary>` accordion elements
- **Option D**: Keep as-is for now

**Recommendation**: ?

---

### 3. `[youtube]`
**Purpose**: Embed YouTube videos
**Example**: `[youtube https://www.youtube.com/watch?v=example]`
**Current Behavior**: Displays as raw text, video not embedded

**Replacement Options**:
- **Option A**: Replace with proper iframe embed:
  ```html
  <iframe width="560" height="315" src="https://www.youtube.com/embed/{VIDEO_ID}" frameborder="0" allowfullscreen></iframe>
  ```
- **Option B**: Create React YouTube component with responsive wrapper
- **Option C**: Replace with link to YouTube video
- **Option D**: Remove entirely

**Recommendation**: ?

---

### 4. `[audio]`
**Purpose**: Embed audio players
**Example**: `[audio src="http://example.com/audio.mp3"]`
**Current Behavior**: Displays as raw text, audio not playable

**Replacement Options**:
- **Option A**: Replace with HTML5 audio element:
  ```html
  <audio controls>
    <source src="{URL}" type="audio/mpeg">
    Your browser does not support the audio element.
  </audio>
  ```
- **Option B**: Create React audio player component
- **Option C**: Replace with download link
- **Option D**: Remove entirely

**Recommendation**: ?

---

## Implementation Approaches

### Approach 1: Automated Script (Recommended for simple replacements)
**Best for**: YouTube, audio elements, simple text replacements
- Create Python script to:
  1. Fetch all posts from Strapi API
  2. Use regex to find and replace shortcodes
  3. Update posts via Strapi API
- **Pros**: Fast, consistent, repeatable
- **Cons**: May not handle edge cases well

### Approach 2: Manual Cleanup in Strapi Admin
**Best for**: Complex shortcodes like intense_tabs that need case-by-case review
- Access each post in Strapi admin
- Find and replace shortcodes manually
- Preview before saving
- **Pros**: Full control, can handle complex cases
- **Cons**: Time-consuming for 210+ posts

### Approach 3: Hybrid Approach (Recommended)
- Use automated script for simple replacements (YouTube, audio)
- Manual cleanup for complex shortcodes (intense_tabs)
- Generate report of posts needing manual review
- **Pros**: Efficient and thorough
- **Cons**: Requires two-phase approach

---

## Next Steps

### Phase 1: Get Complete Inventory
1. SSH to server and query Strapi database directly
2. Run comprehensive shortcode scan on all 210+ posts
3. Generate report with:
   - Complete list of shortcode types
   - Frequency of each type
   - Example posts containing each shortcode

### Phase 2: Interactive Review (THIS PHASE)
**Need user input on**:
- Replacement strategy for each shortcode type
- Whether to prioritize certain shortcodes
- Acceptable level of functionality loss (if any)
- Whether to preserve original content in comments

### Phase 3: Implementation
Based on decisions from Phase 2:
1. Create transformation script(s)
2. Test on sample posts first
3. Run on all posts
4. Verify replacements
5. Document changes

### Phase 4: Testing
1. Spot-check random blog posts
2. Verify videos/audio work
3. Check for broken layouts
4. Ensure no new raw shortcodes visible

---

## Questions for User

1. **Priority**: Which shortcodes are most important to fix first?
   - Most visible/common?
   - Most broken functionality?
   - All at once?

2. **YouTube Embeds**: Preference for replacement?
   - Simple iframe?
   - Responsive wrapper?
   - React component with lazy loading?

3. **Audio Elements**: Keep audio functionality or convert to links?

4. **Podcast Subscribe**: Keep, replace, or remove?

5. **Intense Tabs**: Preserve tabbed functionality or flatten content?

6. **Backup Strategy**: Should we keep original content in HTML comments?
   - Example: `<!-- Original: [youtube url] --><iframe ...></iframe>`

7. **Testing Approach**:
   - Test on a few sample posts first?
   - Or confident enough to run on all posts?

---

## Estimated Effort

**Phase 1 (Complete Inventory)**: 30 minutes
**Phase 2 (Interactive Review)**: 15 minutes (this session)
**Phase 3 (Implementation)**: 1-2 hours (depending on complexity)
**Phase 4 (Testing)**: 30 minutes

**Total**: 2.5-3.5 hours

---

## Risk Assessment

**Low Risk**:
- YouTube, audio replacements (standard HTML elements)

**Medium Risk**:
- Tabs replacement (may affect content layout)
- Podcast subscribe removal (may remove useful functionality)

**Mitigation**:
- Test on sample posts first
- Keep backups of post content
- Review changes in Strapi admin before deploying
- Can always rollback via git if needed
