# frankbria.com

[![Follow on X](https://img.shields.io/twitter/follow/FrankBria18044?style=social)](https://x.com/FrankBria18044)

Personal website and blog for Frank Bria, migrated from WordPress to a modern JAMstack architecture.

## Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) with App Router
- **UI Framework**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **CMS**: [Strapi 5](https://strapi.io/) (headless)
- **Database**: PostgreSQL 15
- **Deployment**: PM2 + nginx on Ubuntu
- **Process Management**: PM2
- **Issue Tracking**: [beads](https://github.com/steveyegge/beads)

## Features

- ⚡ **Incremental Static Regeneration (ISR)** - Fast page loads with automatic revalidation
- 🎨 **WordPress Gutenberg Block Support** - Preserved all WordPress content formatting
- 🔄 **On-Demand Revalidation** - Instant updates via Strapi webhooks
- 📱 **Responsive Design** - Mobile-first with Tailwind CSS
- 🔍 **SEO Optimized** - Meta tags, sitemaps, and semantic HTML
- 📝 **Headless CMS** - Easy content management via Strapi admin panel

## Getting Started

### Prerequisites

- Node.js 24.x or higher
- PostgreSQL 15 (for Strapi)
- Access to Strapi API (see `.env.local.example`)

### Installation

```bash
# Clone the repository
git clone https://github.com/frankbria/frankbria-com.git
cd frankbria-com

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your Strapi credentials
# NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
# STRAPI_API_TOKEN=your_token_here
# REVALIDATION_SECRET=your_secret_here

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the site.

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Project Structure

```
frankbria-com/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   ├── blog/              # Blog pages
│   │   ├── page.tsx       # Blog list
│   │   └── [slug]/        # Individual blog posts
│   ├── [slug]/            # Dynamic pages
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities and API clients
│   └── strapi.ts         # Strapi API client
├── docs/                  # Documentation
│   └── migration-plan.md # Migration implementation plan
├── scripts/               # Migration and deployment scripts
├── .beads/                # Issue tracking database
└── public/                # Static assets
```

## Issue Tracking

This project uses [beads](https://github.com/steveyegge/beads) for dependency-aware issue tracking.

```bash
# View all issues
bd list

# Show ready work (no blockers)
bd ready

# View issue details
bd show frankbria-com-5

# Update issue status
bd update frankbria-com-5 --status in_progress

# Close issue
bd close frankbria-com-5
```

## Deployment

### Beta Environment

Currently deployed at: [https://beta.frankbria.com](https://beta.frankbria.com)

```bash
# Deploy to beta server
./scripts/deploy.sh beta
```

### Production Cutover

Production deployment follows the plan in `docs/production-cutover-plan.md`. Key steps:

1. Complete beta testing (1-2 weeks)
2. Update DNS to point to new server
3. Update nginx configuration
4. Obtain SSL certificates
5. Monitor for 48 hours

## Migration from WordPress

This site was migrated from WordPress using a custom migration pipeline:

1. **Analysis**: Parse WordPress SQL dump to understand structure
2. **Content Migration**: Python scripts to migrate posts/pages to Strapi
3. **Media Migration**: rsync to transfer wp-content/uploads/
4. **URL Preservation**: All WordPress URLs preserved via Next.js dynamic routes
5. **Validation**: Automated content parity validation with Playwright

See `docs/migration-plan.md` for complete implementation details.

## Content Management

Content is managed through Strapi CMS:

1. Access Strapi admin: `https://beta.frankbria.com/admin`
2. Create or edit posts/pages
3. Publish changes
4. Webhook triggers automatic revalidation in Next.js
5. Changes appear on site within seconds

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

**Frank Bria**
- Website: [frankbria.com](https://frankbria.com)
- GitHub: [@frankbria](https://github.com/frankbria)

## Acknowledgments

- Migration architecture inspired by modern JAMstack best practices
- Built with the Next.js App Router and React Server Components
- Content managed through Strapi's intuitive headless CMS
- Issue tracking powered by [beads](https://github.com/steveyegge/beads)
