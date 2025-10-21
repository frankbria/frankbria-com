# Claude Instructions for frankbria-com

## Issue Tracking with Beads

**IMPORTANT**: This project uses **beads** for issue tracking. Always use beads instead of creating ad-hoc markdown files for issues.

### Beads Setup
- **Database**: `.beads/frankbria-com.db` (SQLite)
- **Command**: `/home/frankbria/go/bin/bd` (Go binary)
- **Quickstart**: Run `/home/frankbria/go/bin/bd quickstart` for usage reference
- **Installation**: Go binary at `/home/frankbria/go/bin/bd`

### When to Use Beads
- Track bugs and issues discovered during development
- Document missing features or incomplete implementations
- Record technical debt and future improvements
- Create actionable items that persist across sessions

### How to Add Issues
```bash
# Add a new issue
/home/frankbria/go/bin/bd create "Issue title" -d "Detailed description"

# List current issues
/home/frankbria/go/bin/bd list

# View specific issue
/home/frankbria/go/bin/bd show <issue-id>

# Update issue status
/home/frankbria/go/bin/bd update <issue-id> --status <status>

# Show ready work (unblocked issues)
/home/frankbria/go/bin/bd ready
```

### Current Known Issues
Check beads for latest issues:
```bash
/home/frankbria/go/bin/bd list
```

Key issues (as of 2025-10-15):

1. **frankbria-com-12**: Podcast Audio Files Missing [P2]
   - Status: open
   - Impact: 79+ posts with non-functional Buzzsprout player scripts
   - Details: Run `/home/frankbria/go/bin/bd show frankbria-com-12`
   - Also documented: `claudedocs/known-issues.md`

2. **frankbria-com-5**: WordPress shortcode cleanup [P1] [in_progress]

3. **frankbria-com-6**: Complete manual testing checklist [P1]

---

## Project Context

### Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v3, shadcn/ui components
- **CMS**: Strapi 5 (running on remote server via SSH tunnel)
- **Remote Server**: beta.frankbria.com

### Critical Files
- `.env.local` - Frontend env vars (copy `STRAPI_API_TOKEN` from `.env.server`)
- `.env.server` - Server configuration (contains real Strapi token)
- `scripts/replace_shortcodes_v2.py` - WordPress shortcode transformation
- `components/blog/BlogContent.tsx` - Content parser and renderer

### SSH Tunnel
Strapi runs remotely. Required tunnel:
```bash
ssh -f -N -L 1337:localhost:1337 frankbria-server
```

### Environment Setup
Always check `claudedocs/environment-setup.md` for:
- Strapi API token location (to prevent repeated questions)
- SSH tunnel setup
- Testing commands
- Remote server details

### Content Transformation Flow
1. WordPress content in Strapi database
2. Python script transforms shortcodes → markers (`{{type:data}}`)
3. BlogContent.tsx parses markers → React components
4. Components render (YouTube, audio, tabs, podcast subscribe)

### Working Components
- ✅ YouTube embeds
- ✅ Tabs (with base64-encoded data)
- ✅ Podcast subscribe button (Spotify link)
- ✅ Audio player component (needs mp3 URLs)

### Pending Issues
- ❌ Podcast audio files missing (see beads / known-issues.md)
