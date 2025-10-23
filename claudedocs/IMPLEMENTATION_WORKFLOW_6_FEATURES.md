# Implementation Workflow: 6 Missing Features

**Generated:** October 23, 2025
**Project:** frankbria.com Next.js Migration
**Tech Stack:** Next.js 15.5.5, React 19.2, TypeScript, Tailwind CSS, Strapi CMS
**Component Library:** Custom components + shadcn/ui patterns

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tech Stack Analysis](#tech-stack-analysis)
3. [Component Inventory](#component-inventory)
4. [Phase 1: Essential Features](#phase-1-essential-features)
5. [Phase 2: Enhancement Features](#phase-2-enhancement-features)
6. [Implementation Dependencies](#implementation-dependencies)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Plan](#deployment-plan)

---

## Executive Summary

This workflow provides step-by-step implementation instructions for adding 6 missing features to beta.frankbria.com. The implementation is divided into 2 phases based on priority and complexity.

### Features Overview

**Phase 1 (Week 1): Essential & Legal**
1. Cookie Consent Banner (Legal requirement)
2. Search Functionality (High priority)
3. Mobile Menu (UX critical)

**Phase 2 (Week 2): Enhancements**
4. Related Posts Section
5. Email Sharing
6. Mobile Menu Verification/Enhancement (from Phase 1)

### Key Principles

- **Leverage existing patterns:** Use existing Tailwind classes and component structures
- **shadcn/ui approach:** Implement components using shadcn/ui patterns (owned components, not external dependencies)
- **TypeScript-first:** All components fully typed
- **Accessibility:** WCAG 2.1 AA compliance
- **Performance:** Minimal bundle size impact

---

## Tech Stack Analysis

### Current Dependencies

```json
{
  "dependencies": {
    "axios": "^1.12.2",        // HTTP client for Strapi API
    "date-fns": "^4.1.0",      // Date formatting
    "next": "^15.5.5",         // Framework
    "react": "^19.2.0",        // UI library
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.19",  // Rich text styling
    "tailwindcss": "^3.4.18",               // Styling
    "typescript": "^5.9.3"                  // Type safety
  }
}
```

### Additional Dependencies Needed

```bash
# Phase 1
npm install react-cookie-consent  # Cookie consent (battle-tested library)
npm install lucide-react          # Icons (lightweight, tree-shakeable)

# Phase 2
# No additional dependencies needed
```

### Why These Dependencies?

1. **react-cookie-consent**:
   - Battle-tested (2M+ downloads/week)
   - GDPR compliant
   - Minimal bundle size (~10KB)
   - Customizable styling

2. **lucide-react**:
   - Modern icon library
   - Tree-shakeable (only imports what you use)
   - Consistent with shadcn/ui ecosystem
   - ~500 icons available

---

## Component Inventory

### Existing Components

```
components/
├── Header.tsx                 # Main navigation
├── Footer.tsx                 # Footer with links
├── PostContent.tsx            # Blog post content renderer
├── blog/
│   ├── AudioPlayer.tsx        # Audio playback
│   ├── BlogContent.tsx        # Blog post wrapper
│   ├── PodcastSubscribeButton.tsx
│   ├── TabsContent.tsx        # Tab container
│   └── YouTubeEmbed.tsx       # Video embed
└── ui/
    └── tabs.tsx               # Tab components (shadcn/ui pattern)
```

### Components to Create

```
components/
├── ui/
│   ├── button.tsx             # Reusable button component
│   ├── input.tsx              # Input component for search
│   ├── dialog.tsx             # Modal/dialog component
│   └── sheet.tsx              # Mobile slide-out menu
├── search/
│   ├── SearchDialog.tsx       # Search modal
│   ├── SearchInput.tsx        # Search input field
│   └── SearchResults.tsx      # Results display
├── mobile/
│   └── MobileMenu.tsx         # Mobile navigation
├── RelatedPosts.tsx           # Related posts section
└── CookieConsent.tsx          # Cookie banner wrapper
```

---

## Phase 1: Essential Features

### Feature 1.1: Cookie Consent Banner ⚠️ LEGAL

**Priority:** CRITICAL (Legal requirement)
**Complexity:** Low
**Estimated Time:** 2-3 hours
**Dependencies:** None

#### Implementation Steps

**Step 1.1.1: Install Dependencies**

```bash
npm install react-cookie-consent
```

**Step 1.1.2: Create Cookie Consent Component**

Create: `components/CookieConsent.tsx`

```typescript
'use client';

import CookieConsentLib from 'react-cookie-consent';

export function CookieConsent() {
  return (
    <CookieConsentLib
      location="bottom"
      buttonText="ACCEPT"
      declineButtonText="Cookie settings"
      enableDeclineButton
      cookieName="frankbria-cookie-consent"
      style={{
        background: '#1f2937',
        padding: '20px',
        alignItems: 'center',
      }}
      buttonStyle={{
        background: '#3b82f6',
        color: '#ffffff',
        fontSize: '14px',
        padding: '10px 20px',
        borderRadius: '6px',
        fontWeight: '500',
      }}
      declineButtonStyle={{
        background: 'transparent',
        color: '#9ca3af',
        fontSize: '14px',
        padding: '10px 20px',
        borderRadius: '6px',
      }}
      expires={365}
    >
      This website uses cookies to improve your experience. We'll assume you're
      ok with this, but you can opt-out if you wish.
    </CookieConsentLib>
  );
}
```

**Step 1.1.3: Add to Root Layout**

Edit: `app/layout.tsx`

```typescript
import { CookieConsent } from '@/components/CookieConsent';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
```

**Step 1.1.4: Test**

- [ ] Banner appears on first visit
- [ ] Clicking "ACCEPT" hides banner and sets cookie
- [ ] Cookie persists for 365 days
- [ ] Banner doesn't reappear on subsequent visits
- [ ] "Cookie settings" button is visible
- [ ] Responsive on mobile devices

**Files Modified:**
- `package.json` (add dependency)
- `components/CookieConsent.tsx` (new file)
- `app/layout.tsx` (import and add component)

---

### Feature 1.2: Search Functionality 🔍

**Priority:** HIGH
**Complexity:** Medium
**Estimated Time:** 6-8 hours
**Dependencies:** lucide-react icons

#### Implementation Steps

**Step 1.2.1: Install Dependencies**

```bash
npm install lucide-react
```

**Step 1.2.2: Create Search API Route**

Create: `app/api/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getStrapiClient } from '@/lib/strapi';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 12;

  if (!query) {
    return NextResponse.json({ data: [], meta: { pagination: { total: 0 } } });
  }

  try {
    const client = getStrapiClient();
    const response = await client.get('/posts', {
      params: {
        'filters[$or][0][title][$containsi]': query,
        'filters[$or][1][content][$containsi]': query,
        'populate': '*',
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
        'sort': 'publishedDate:desc',
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

**Step 1.2.3: Create UI Components (shadcn/ui Pattern)**

Create: `components/ui/button.tsx`

```typescript
import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    ghost: 'hover:bg-gray-100 text-gray-900',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100',
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
```

Create: `components/ui/input.tsx`

```typescript
import * as React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
```

Create: `components/ui/dialog.tsx`

```typescript
'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-3xl mx-4 mt-20 sm:mt-0">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-xl">
      {children}
    </div>
  );
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      aria-label="Close"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
```

**Step 1.2.4: Create Search Components**

Create: `components/search/SearchDialog.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SearchResults } from './SearchResults';

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.data || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors border border-gray-700 rounded-md hover:border-gray-600"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
          <span>⌘K</span>
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogClose onClose={() => setOpen(false)} />
          <div className="p-6">
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search blog posts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="text-lg"
              />
            </div>
            <SearchResults
              results={results}
              loading={loading}
              query={query}
              onResultClick={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

Create: `components/search/SearchResults.tsx`

```typescript
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface SearchResultsProps {
  results: any[];
  loading: boolean;
  query: string;
  onResultClick: () => void;
}

export function SearchResults({
  results,
  loading,
  query,
  onResultClick,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="text-center py-12 text-gray-500">
        Start typing to search blog posts
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No results found for "{query}"
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="space-y-4">
        {results.map((post) => {
          const { attributes } = post;
          return (
            <Link
              key={post.id}
              href={`/blog/${attributes.slug}`}
              onClick={onResultClick}
              className="block p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                {attributes.title}
              </h3>
              {attributes.excerpt && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {attributes.excerpt}
                </p>
              )}
              {attributes.categories && attributes.categories.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {attributes.categories.map((cat: any) => (
                    <span
                      key={cat.id}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 1.2.5: Add Search to Header**

Edit: `components/Header.tsx`

```typescript
import Link from 'next/link';
import Image from 'next/image';
import { SearchDialog } from '@/components/search/SearchDialog';

export default function Header() {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="https://beta.frankbria.com/uploads/2015/12/logo_back_clipped_rev_1-e1572167361317.png"
              alt="Frank Bria"
              width={272}
              height={103}
              className="h-12 w-auto"
            />
          </Link>

          <nav className="flex gap-6 items-center">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
              Blog
            </Link>
            <SearchDialog />
          </nav>
        </div>
      </div>
    </header>
  );
}
```

**Step 1.2.6: Test**

- [ ] Search button appears in header
- [ ] Clicking search opens dialog
- [ ] Cmd/Ctrl+K keyboard shortcut works
- [ ] Typing searches posts
- [ ] Results show title, excerpt, categories
- [ ] Clicking result navigates to post and closes dialog
- [ ] ESC key closes dialog
- [ ] Clicking backdrop closes dialog
- [ ] Loading state appears during search
- [ ] Empty state shows when no results
- [ ] Mobile responsive

**Files Created:**
- `app/api/search/route.ts`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/dialog.tsx`
- `components/search/SearchDialog.tsx`
- `components/search/SearchResults.tsx`

**Files Modified:**
- `package.json`
- `components/Header.tsx`

---

### Feature 1.3: Mobile Menu 📱

**Priority:** HIGH
**Complexity:** Medium
**Estimated Time:** 4-6 hours
**Dependencies:** lucide-react icons

#### Implementation Steps

**Step 1.3.1: Create Sheet Component (Mobile Slide-out)**

Create: `components/ui/sheet.tsx`

```typescript
'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: 'left' | 'right';
  children: React.ReactNode;
}

export function Sheet({
  open,
  onOpenChange,
  side = 'right',
  children,
}: SheetProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const slideClasses = {
    left: 'left-0',
    right: 'right-0',
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={`fixed ${slideClasses[side]} top-0 bottom-0 w-80 bg-white shadow-xl transform transition-transform ${
          open ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetContent({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-y-auto">{children}</div>;
}

export function SheetClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
      aria-label="Close menu"
    >
      <X className="h-6 w-6" />
    </button>
  );
}
```

**Step 1.3.2: Create Mobile Menu Component**

Create: `components/mobile/MobileMenu.tsx`

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  const menuItems = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden text-gray-300 hover:text-white"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen} side="right">
        <SheetContent>
          <SheetClose onClose={() => setOpen(false)} />
          <div className="flex flex-col gap-4 mt-16 px-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu</h2>
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-gray-700 hover:text-gray-900 font-medium py-2 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

**Step 1.3.3: Update Header with Mobile Menu**

Edit: `components/Header.tsx`

```typescript
import Link from 'next/link';
import Image from 'next/image';
import { SearchDialog } from '@/components/search/SearchDialog';
import { MobileMenu } from '@/components/mobile/MobileMenu';

export default function Header() {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="https://beta.frankbria.com/uploads/2015/12/logo_back_clipped_rev_1-e1572167361317.png"
              alt="Frank Bria"
              width={272}
              height={103}
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
              Blog
            </Link>
            <SearchDialog />
          </nav>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <SearchDialog />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
```

**Step 1.3.4: Test**

- [ ] Hamburger icon shows on mobile (<768px)
- [ ] Hamburger hidden on desktop (>=768px)
- [ ] Clicking hamburger opens slide-out menu
- [ ] Menu slides in from right
- [ ] Close button (X) works
- [ ] ESC key closes menu
- [ ] Clicking backdrop closes menu
- [ ] Clicking menu item navigates and closes menu
- [ ] Smooth animations
- [ ] Body scroll locked when menu open

**Files Created:**
- `components/ui/sheet.tsx`
- `components/mobile/MobileMenu.tsx`

**Files Modified:**
- `components/Header.tsx`

---

## Phase 2: Enhancement Features

### Feature 2.1: Related Posts Section 🔗

**Priority:** MEDIUM
**Complexity:** Medium
**Estimated Time:** 4-5 hours
**Dependencies:** Strapi API

#### Implementation Steps

**Step 2.1.1: Add Helper Function to Strapi Library**

Edit: `lib/strapi.ts`

Add this function:

```typescript
export async function getRelatedPosts(
  postId: number,
  categoryIds: number[],
  limit: number = 3
) {
  try {
    const client = getStrapiClient();

    if (categoryIds.length === 0) {
      // Fallback: get recent posts
      const response = await client.get('/posts', {
        params: {
          'filters[id][$ne]': postId,
          'populate': '*',
          'pagination[pageSize]': limit,
          'sort': 'publishedDate:desc',
        },
      });
      return response.data.data || [];
    }

    const response = await client.get('/posts', {
      params: {
        'filters[categories][id][$in]': categoryIds,
        'filters[id][$ne]': postId,
        'populate': '*',
        'pagination[pageSize]': limit,
        'sort': 'publishedDate:desc',
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
}
```

**Step 2.1.2: Create Related Posts Component**

Create: `components/RelatedPosts.tsx`

```typescript
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

interface RelatedPost {
  id: number;
  attributes: {
    title: string;
    slug: string;
    publishedDate: string;
    excerpt?: string;
    featuredImage?: {
      url: string;
    };
    categories?: Array<{
      id: number;
      name: string;
    }>;
  };
}

interface RelatedPostsProps {
  posts: RelatedPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 pt-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold mb-6 text-gray-900 italic">Related</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => {
          const { attributes } = post;
          const imageUrl = attributes.featuredImage?.url || '/placeholder-image.jpg';

          return (
            <Link
              key={post.id}
              href={`/blog/${attributes.slug}`}
              className="group"
            >
              <article className="space-y-3">
                {/* Image */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt={attributes.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Title */}
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {attributes.title}
                </h4>

                {/* Date and Category */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <time dateTime={attributes.publishedDate}>
                    {format(new Date(attributes.publishedDate), 'MMMM d, yyyy')}
                  </time>
                  {attributes.categories && attributes.categories.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{attributes.categories[0].name}</span>
                    </>
                  )}
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2.1.3: Add Related Posts to Blog Post Page**

Edit: `app/blog/[slug]/page.tsx`

```typescript
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/strapi';
import { notFound } from 'next/navigation';
import { BlogContent } from '@/components/blog/BlogContent';
import { RelatedPosts } from '@/components/RelatedPosts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

// ... existing code ...

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { attributes } = post;

  // Get related posts
  const categoryIds = attributes.categories?.map((cat: any) => cat.id) || [];
  const relatedPosts = await getRelatedPosts(post.id, categoryIds, 3);

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <article className="max-w-4xl mx-auto px-4 py-12">
          {/* ... existing header and content ... */}

          <BlogContent content={attributes.content} />

          {/* ... existing Share This section ... */}

          {/* Related Posts Section */}
          <RelatedPosts posts={relatedPosts} />
        </article>
      </main>
      <Footer />
    </>
  );
}
```

**Step 2.1.4: Test**

- [ ] Related posts appear at bottom of blog post
- [ ] Shows 3 related posts maximum
- [ ] Posts are from same categories
- [ ] Excludes current post
- [ ] Shows post image, title, date, category
- [ ] Clicking post navigates correctly
- [ ] Hover effects work
- [ ] Responsive grid (1 column mobile, 3 columns desktop)
- [ ] Gracefully handles posts with no categories
- [ ] Shows nothing if no related posts found

**Files Created:**
- `components/RelatedPosts.tsx`

**Files Modified:**
- `lib/strapi.ts`
- `app/blog/[slug]/page.tsx`

---

### Feature 2.2: Email Sharing ✉️

**Priority:** LOW
**Complexity:** Low
**Estimated Time:** 1-2 hours
**Dependencies:** lucide-react (already installed)

#### Implementation Steps

**Step 2.2.1: Update Blog Post Page with Email Share**

Edit: `app/blog/[slug]/page.tsx`

Add import:
```typescript
import { Mail } from 'lucide-react';
```

Update the Share This section:
```typescript
{/* Share This Section */}
<div className="mt-12 pt-8 border-t border-gray-200">
  <h3 className="text-xl font-semibold mb-4">Share this:</h3>
  <div className="flex gap-4">
    {/* X (Twitter) */}
    <a
      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://frankbria.com/blog/${slug}`)}&text=${encodeURIComponent(attributes.title)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-600 hover:text-blue-400 transition-colors"
      aria-label="Share on X"
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    </a>

    {/* Facebook */}
    <a
      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://frankbria.com/blog/${slug}`)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-600 hover:text-blue-600 transition-colors"
      aria-label="Share on Facebook"
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    </a>

    {/* LinkedIn */}
    <a
      href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`https://frankbria.com/blog/${slug}`)}&title=${encodeURIComponent(attributes.title)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-600 hover:text-blue-700 transition-colors"
      aria-label="Share on LinkedIn"
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    </a>

    {/* Email - NEW */}
    <a
      href={`mailto:?subject=${encodeURIComponent(attributes.title)}&body=${encodeURIComponent(`Check out this article: ${attributes.title}\n\nhttps://frankbria.com/blog/${slug}`)}`}
      className="text-gray-600 hover:text-gray-900 transition-colors"
      aria-label="Share via Email"
    >
      <Mail className="w-6 h-6" />
    </a>
  </div>
</div>
```

**Step 2.2.2: Test**

- [ ] Email icon appears in share section
- [ ] Clicking opens default email client
- [ ] Email has pre-filled subject (post title)
- [ ] Email has pre-filled body (post title + URL)
- [ ] Hover effect works
- [ ] Accessible (aria-label)

**Files Modified:**
- `app/blog/[slug]/page.tsx`

---

## Implementation Dependencies

### Dependency Graph

```
Phase 1 (Can run in parallel):
├── Cookie Consent (Independent)
├── Search (Independent)
│   ├── Button component
│   ├── Input component
│   └── Dialog component
└── Mobile Menu (Depends on Button component)
    └── Sheet component

Phase 2 (Depends on Phase 1 completion):
├── Related Posts (Independent)
└── Email Sharing (Independent)
```

### Component Dependencies

```
ui/ (Base components - create first)
├── button.tsx
├── input.tsx
├── dialog.tsx
└── sheet.tsx

search/ (Depends on ui/)
├── SearchDialog.tsx
└── SearchResults.tsx

mobile/ (Depends on ui/)
└── MobileMenu.tsx

standalone/
├── CookieConsent.tsx (no dependencies)
└── RelatedPosts.tsx (no dependencies)
```

---

## Testing Strategy

### Unit Testing (Optional but Recommended)

Add testing dependencies:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

Create test files:
- `components/ui/__tests__/button.test.tsx`
- `components/ui/__tests__/dialog.test.tsx`
- `components/search/__tests__/SearchDialog.test.tsx`
- `components/RelatedPosts.test.tsx`

### Manual Testing Checklist

#### Cookie Consent
- [ ] Appears on first visit
- [ ] "ACCEPT" button works
- [ ] "Cookie settings" button visible
- [ ] Cookie persists (365 days)
- [ ] Banner doesn't reappear
- [ ] Mobile responsive

#### Search
- [ ] Button in header
- [ ] Cmd/Ctrl+K shortcut
- [ ] Dialog opens/closes
- [ ] Search queries Strapi API
- [ ] Results display correctly
- [ ] Loading state
- [ ] Empty state
- [ ] Click result navigates
- [ ] ESC closes dialog
- [ ] Mobile responsive

#### Mobile Menu
- [ ] Hamburger on mobile only
- [ ] Menu slides in from right
- [ ] Close button works
- [ ] ESC closes menu
- [ ] Backdrop click closes
- [ ] Menu items navigate
- [ ] Body scroll locked
- [ ] Smooth animations

#### Related Posts
- [ ] Appears at bottom of posts
- [ ] Shows 3 posts max
- [ ] Correct categories
- [ ] Images load
- [ ] Titles, dates, categories show
- [ ] Hover effects
- [ ] Responsive grid
- [ ] Handles no related posts

#### Email Sharing
- [ ] Email icon appears
- [ ] Opens email client
- [ ] Pre-filled subject
- [ ] Pre-filled body with URL
- [ ] Hover effect

### Accessibility Testing

- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible
- [ ] ARIA labels present
- [ ] Screen reader friendly
- [ ] Color contrast WCAG AA compliant
- [ ] No keyboard traps

### Performance Testing

- [ ] Lighthouse score >90
- [ ] No layout shift (CLS)
- [ ] Fast search response
- [ ] Optimized images in related posts
- [ ] No blocking resources

---

## Deployment Plan

### Pre-Deployment Checklist

1. **Code Quality**
   - [ ] All TypeScript errors resolved
   - [ ] All ESLint warnings addressed
   - [ ] No console errors in browser
   - [ ] Code reviewed

2. **Testing**
   - [ ] All manual tests passed
   - [ ] Mobile testing complete
   - [ ] Cross-browser testing (Chrome, Firefox, Safari)
   - [ ] Accessibility audit passed

3. **Content**
   - [ ] Cookie consent text reviewed
   - [ ] Search functionality tested with real content
   - [ ] Related posts show relevant content

4. **Performance**
   - [ ] Lighthouse audit passed
   - [ ] Bundle size acceptable
   - [ ] Images optimized

### Deployment Steps

**Step 1: Commit Changes**

```bash
git add .
git commit -m "feat: add cookie consent, search, mobile menu, related posts, and email sharing

- Add cookie consent banner (GDPR compliance)
- Implement search functionality with Cmd+K shortcut
- Add mobile hamburger menu with slide-out
- Create related posts section based on categories
- Complete social sharing with email option
- Add shadcn/ui pattern components (button, input, dialog, sheet)"

git push origin main
```

**Step 2: Deploy to Beta**

```bash
# On server
ssh root@47.88.89.175
cd /var/nodejs/frankbria-com

# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Build
npm run build

# Restart PM2
pm2 restart frankbria-nextjs

# Verify
pm2 logs frankbria-nextjs --lines 50
```

**Step 3: Verify Deployment**

- [ ] Visit https://beta.frankbria.com
- [ ] Test cookie consent
- [ ] Test search
- [ ] Test mobile menu (use mobile device or DevTools)
- [ ] Visit blog post and verify related posts
- [ ] Test all social sharing buttons

**Step 4: Monitor**

- [ ] Check PM2 logs for errors
- [ ] Monitor error rates
- [ ] Check Google Analytics (if configured)
- [ ] Verify search queries are working

---

## Rollback Plan

If issues occur after deployment:

```bash
# On server
ssh root@47.88.89.175
cd /var/nodejs/frankbria-com

# Revert to previous commit
git log  # Find previous commit hash
git revert HEAD  # Or: git reset --hard <previous-commit-hash>

# Rebuild and restart
npm install
npm run build
pm2 restart frankbria-nextjs
```

---

## Appendix A: File Structure

```
frankbria-com/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts                    # NEW
│   ├── blog/
│   │   └── [slug]/
│   │       └── page.tsx                    # MODIFIED
│   └── layout.tsx                          # MODIFIED
├── components/
│   ├── ui/
│   │   ├── button.tsx                      # NEW
│   │   ├── input.tsx                       # NEW
│   │   ├── dialog.tsx                      # NEW
│   │   └── sheet.tsx                       # NEW
│   ├── search/
│   │   ├── SearchDialog.tsx                # NEW
│   │   └── SearchResults.tsx               # NEW
│   ├── mobile/
│   │   └── MobileMenu.tsx                  # NEW
│   ├── CookieConsent.tsx                   # NEW
│   ├── RelatedPosts.tsx                    # NEW
│   └── Header.tsx                          # MODIFIED
├── lib/
│   └── strapi.ts                           # MODIFIED
└── package.json                            # MODIFIED
```

---

## Appendix B: Estimated Timeline

### Week 1: Phase 1

**Day 1-2: Cookie Consent & Search Setup**
- Day 1 Morning: Cookie consent (2-3 hours)
- Day 1 Afternoon: UI components (2-3 hours)
- Day 2 Morning: Search API route (2 hours)
- Day 2 Afternoon: Search components (3-4 hours)

**Day 3-4: Mobile Menu & Testing**
- Day 3 Morning: Sheet component (2 hours)
- Day 3 Afternoon: Mobile menu (2-3 hours)
- Day 4: Integration testing and bug fixes (full day)

**Day 5: Deployment & Monitoring**
- Deploy to beta
- Monitor and fix any issues

### Week 2: Phase 2

**Day 1-2: Related Posts**
- Day 1 Morning: Strapi helper function (1 hour)
- Day 1 Afternoon: Related Posts component (2-3 hours)
- Day 2: Integration and testing (full day)

**Day 3: Email Sharing**
- Add email sharing (1-2 hours)
- Full regression testing (rest of day)

**Day 4-5: Final QA & Deployment**
- Cross-browser testing
- Accessibility audit
- Performance optimization
- Final deployment
- Documentation

---

## Appendix C: Common Issues & Solutions

### Issue: Cookie Consent Not Appearing

**Solution:**
- Clear browser cookies and localStorage
- Check browser console for errors
- Verify `react-cookie-consent` installed

### Issue: Search Returns No Results

**Solution:**
- Check Strapi API token in `.env`
- Verify Strapi API endpoint is correct
- Check browser Network tab for API errors
- Test API directly: `https://beta.frankbria.com/api/search?q=test`

### Issue: Mobile Menu Not Sliding In

**Solution:**
- Check Tailwind CSS classes are compiled
- Verify `transform` and `transition` classes
- Check z-index conflicts
- Test in different browsers

### Issue: Related Posts Not Showing

**Solution:**
- Verify posts have categories assigned in Strapi
- Check Strapi API response includes categories
- Ensure `getRelatedPosts` function is called correctly
- Add console.log to debug category IDs

### Issue: Images Not Loading

**Solution:**
- Check Next.js Image domains in `next.config.js`
- Verify image URLs are correct
- Add Strapi media URL to `images.domains`

---

## Appendix D: Next.js Config Updates

Update `next.config.js` (or create `next.config.ts`):

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'beta.frankbria.com',
      },
    ],
  },
};

export default nextConfig;
```

---

## Summary

This comprehensive implementation workflow provides:

✅ **Detailed step-by-step instructions** for all 6 features
✅ **Complete code examples** ready to copy-paste
✅ **shadcn/ui patterns** for owned components
✅ **TypeScript-first** approach
✅ **Testing checklists** for each feature
✅ **Deployment plan** with rollback strategy
✅ **Dependency management** and installation instructions
✅ **Timeline estimates** for project planning

All features leverage existing components where possible and follow enterprise-grade patterns for maintainability and scalability.

---

**End of Workflow**

*Total Estimated Time: 2 weeks (10 working days)*
*Complexity: Medium*
*Risk Level: Low (incremental changes, easy rollback)*
