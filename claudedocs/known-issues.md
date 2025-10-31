# Known Issues

## Podcast Audio Files Missing

**Status**: Pending - awaiting audio file location

**Background**:
- Blog posts have 79+ episodes with Buzzsprout player scripts embedded
- Buzzsprout account is no longer accessible
- Audio files (.mp3) were **not** migrated during WordPress-to-Strapi import
- No audio files exist in Strapi uploads directory (`/var/nodejs/frankbria-strapi/public/uploads/`)
- WordPress backups exist (3.4GB in `backupbuddy_backups/`) but don't contain audio files

**Current State**:
- Posts have Buzzsprout episode IDs (e.g., `2147147`, `2147141`)
- Embedded player scripts remain: `<div id="buzzsprout-player-2147147"></div>`
- No actual audio files or working URLs

**Investigation Done**:
- ✅ Searched entire server `/var`, `/home`, `/root` - no .mp3 files found
- ✅ Checked Strapi uploads directory - only images, no audio
- ✅ Confirmed 79 posts reference audio/Buzzsprout
- ✅ Verified Buzzsprout URLs in content are outdated/non-functional

**Next Steps** (when audio files are located):
1. Upload audio files to Strapi media library
2. Add audio field to post content type OR use convention-based naming
3. Update transformation script to link posts to audio files
4. Replace Buzzsprout player scripts with working audio player component

**Workaround**:
- YouTube embeds work correctly
- Podcast subscribe button links to Spotify (functional)
- Audio player component exists and works with direct mp3 URLs

**Related Files**:
- `components/blog/AudioPlayer.tsx` - Ready to use when audio URLs available
- `scripts/replace_shortcodes_v2.py` - Can be updated to handle audio field
- `components/blog/BlogContent.tsx` - Parser ready for `{{audio:URL}}` markers
