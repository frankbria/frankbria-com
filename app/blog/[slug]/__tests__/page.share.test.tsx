/**
 * Tests for Blog Post Share Section
 * Following TDD methodology - Phase 1: RED (Failing Tests)
 *
 * Testing: Email sharing button functionality in blog post pages
 * Coverage Target: >90% (simple feature, high bar)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the Strapi data fetching functions
jest.mock('@/lib/strapi', () => ({
  getAllPosts: jest.fn(),
  getPostBySlug: jest.fn(),
  getRelatedPosts: jest.fn(),
}));

// Mock Header and Footer components
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <header data-testid="header">Header</header>,
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

// Mock BlogContent component
jest.mock('@/components/blog/BlogContent', () => ({
  BlogContent: ({ content }: { content: string }) => (
    <div data-testid="blog-content">{content}</div>
  ),
}));

// Mock RelatedPosts component
jest.mock('@/components/RelatedPosts', () => ({
  RelatedPosts: ({ posts }: { posts: any[] }) => (
    <div data-testid="related-posts">Related Posts</div>
  ),
}));

// Import after mocks
import BlogPost from '../page';
import { getPostBySlug, getRelatedPosts } from '@/lib/strapi';

describe('Blog Post Share Section - Email Sharing', () => {
  const mockPost = {
    id: 1,
    attributes: {
      title: 'Test Blog Post Title',
      slug: 'test-blog-post',
      content: 'This is test content',
      publishedDate: '2024-01-15T00:00:00.000Z',
      excerpt: 'Test excerpt',
      categories: [
        { id: 1, name: 'Technology', slug: 'technology' },
      ],
    },
  };

  beforeEach(() => {
    (getPostBySlug as jest.Mock).mockResolvedValue(mockPost);
    (getRelatedPosts as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Share Button - Existence and Structure', () => {
    it('should render email share button', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      expect(emailButton).toBeInTheDocument();
    });

    it('should render Mail icon from lucide-react', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const icon = emailButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have correct aria-label "Share via Email"', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      expect(emailButton).toHaveAttribute('aria-label', 'Share via Email');
    });

    it('should use anchor tag for semantic HTML', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      expect(emailButton.tagName).toBe('A');
    });
  });

  describe('Email Share Button - mailto: Protocol', () => {
    it('should use mailto: protocol', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href');
      expect(href).toMatch(/^mailto:/);
    });

    it('should include subject parameter', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href');
      expect(href).toContain('subject=');
    });

    it('should set subject to post title (URL encoded)', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href') || '';
      const encodedTitle = encodeURIComponent('Test Blog Post Title');
      expect(href).toContain(`subject=${encodedTitle}`);
    });

    it('should include body parameter', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href');
      expect(href).toContain('body=');
    });

    it('should include "Check out this article:" in body text', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href') || '';
      const decodedHref = decodeURIComponent(href);
      expect(decodedHref).toContain('Check out this article:');
    });

    it('should include post title in body', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href') || '';
      const decodedHref = decodeURIComponent(href);
      expect(decodedHref).toContain('Test Blog Post Title');
    });

    it('should include correct URL in body (https://frankbria.com/blog/[slug])', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href') || '';
      const decodedHref = decodeURIComponent(href);
      expect(decodedHref).toContain('https://frankbria.com/blog/test-blog-post');
    });

    it('should properly URL encode all parameters', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href') || '';

      // Should not contain raw spaces
      const paramsPart = href.split('?')[1] || '';
      expect(paramsPart).not.toContain(' ');

      // Should contain URL-encoded characters
      expect(href).toMatch(/mailto:\?subject=.*&body=.*/);
    });
  });

  describe('Email Share Button - Styling', () => {
    it('should have base color text-gray-600', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      expect(emailButton).toHaveClass('text-gray-600');
    });

    it('should have hover color hover:text-gray-900', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      expect(emailButton).toHaveClass('hover:text-gray-900');
    });

    it('should have transition-colors class', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      expect(emailButton).toHaveClass('transition-colors');
    });

    it('should have Mail icon with correct size (w-6 h-6)', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const icon = emailButton.querySelector('svg');
      expect(icon).toHaveClass('w-6', 'h-6');
    });
  });

  describe('Share Section Integration', () => {
    it('should have 4 share buttons total (X, Facebook, LinkedIn, Email)', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const shareButtons = [
        screen.getByLabelText('Share on X'),
        screen.getByLabelText('Share on Facebook'),
        screen.getByLabelText('Share on LinkedIn'),
        screen.getByLabelText('Share via Email'),
      ];

      expect(shareButtons).toHaveLength(4);
      shareButtons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should render all share buttons with same base styling', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const shareButtons = [
        screen.getByLabelText('Share on X'),
        screen.getByLabelText('Share on Facebook'),
        screen.getByLabelText('Share on LinkedIn'),
        screen.getByLabelText('Share via Email'),
      ];

      shareButtons.forEach(button => {
        expect(button).toHaveClass('text-gray-600');
        expect(button).toHaveClass('transition-colors');
      });
    });

    it('should render email button last in the share section', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      // Get all share buttons in order
      const emailButton = screen.getByLabelText('Share via Email');

      // Email button should come after all others
      const shareSection = emailButton.closest('div.flex');
      const buttons = shareSection?.querySelectorAll('a');

      expect(buttons).toHaveLength(4);
      expect(buttons?.[3]).toBe(emailButton);
    });

    it('should have all icons with same size (w-6 h-6)', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const shareSection = screen.getByLabelText('Share on X').closest('div.flex');
      const icons = shareSection?.querySelectorAll('svg');

      icons?.forEach(icon => {
        expect(icon).toHaveClass('w-6');
        expect(icon).toHaveClass('h-6');
      });
    });
  });

  describe('Accessibility Tests', () => {
    it('should have aria-label for screen readers', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      expect(emailButton).toHaveAttribute('aria-label');
    });

    it('should be keyboard accessible (anchor tag)', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      expect(emailButton.tagName).toBe('A');
      expect(emailButton).toHaveAttribute('href');
    });

    it('should use semantic HTML (anchor tag for links)', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      expect(emailButton.tagName).toBe('A');
    });
  });

  describe('Edge Cases - Special Characters in Title', () => {
    it('should handle title with special characters (&, ?, #)', async () => {
      const postWithSpecialChars = {
        ...mockPost,
        attributes: {
          ...mockPost.attributes,
          title: 'Test & Debug: How? #DevTips',
          slug: 'test-debug-how',
        },
      };
      (getPostBySlug as jest.Mock).mockResolvedValue(postWithSpecialChars);

      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-debug-how' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href') || '';

      // Special characters should be properly encoded
      expect(href).toContain(encodeURIComponent('Test & Debug: How? #DevTips'));
    });

    it('should handle title with quotes', async () => {
      const postWithQuotes = {
        ...mockPost,
        attributes: {
          ...mockPost.attributes,
          title: 'The "Best" Programming Tips',
          slug: 'best-programming-tips',
        },
      };
      (getPostBySlug as jest.Mock).mockResolvedValue(postWithQuotes);

      const Component = await BlogPost({ params: Promise.resolve({ slug: 'best-programming-tips' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href') || '';

      expect(href).toContain(encodeURIComponent('The "Best" Programming Tips'));
    });

    it('should handle very long title', async () => {
      const postWithLongTitle = {
        ...mockPost,
        attributes: {
          ...mockPost.attributes,
          title: 'This is a Very Long Title That Goes On and On and Contains Many Words and Should Still Work Properly When Encoded for Email Sharing',
          slug: 'very-long-title',
        },
      };
      (getPostBySlug as jest.Mock).mockResolvedValue(postWithLongTitle);

      const Component = await BlogPost({ params: Promise.resolve({ slug: 'very-long-title' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href');

      expect(href).toBeTruthy();
      expect(href).toMatch(/^mailto:/);
    });

    it('should handle empty title gracefully', async () => {
      const postWithEmptyTitle = {
        ...mockPost,
        attributes: {
          ...mockPost.attributes,
          title: '',
          slug: 'untitled-post',
        },
      };
      (getPostBySlug as jest.Mock).mockResolvedValue(postWithEmptyTitle);

      const Component = await BlogPost({ params: Promise.resolve({ slug: 'untitled-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href');

      expect(href).toBeTruthy();
      expect(href).toMatch(/^mailto:/);
    });

    it('should handle slug with special characters', async () => {
      const postWithSpecialSlug = {
        ...mockPost,
        attributes: {
          ...mockPost.attributes,
          title: 'Test Post',
          slug: 'test-post-2024',
        },
      };
      (getPostBySlug as jest.Mock).mockResolvedValue(postWithSpecialSlug);

      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-post-2024' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href') || '';
      const decodedHref = decodeURIComponent(href);

      expect(decodedHref).toContain('https://frankbria.com/blog/test-post-2024');
    });
  });

  describe('Email Body Format', () => {
    it('should have exact body format: "Check out this article: [title]\\n\\n[URL]"', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href') || '';
      const decodedHref = decodeURIComponent(href);

      const expectedBody = `Check out this article: Test Blog Post Title\n\nhttps://frankbria.com/blog/test-blog-post`;
      expect(decodedHref).toContain(expectedBody);
    });

    it('should have double newline between title and URL', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href') || '';
      const decodedHref = decodeURIComponent(href);

      // Should contain \n\n (double newline)
      expect(decodedHref).toMatch(/Test Blog Post Title\n\nhttps:\/\/frankbria\.com/);
    });
  });

  describe('Security - XSS Prevention', () => {
    it('should prevent XSS in title with script tags', async () => {
      const maliciousPost = {
        ...mockPost,
        attributes: {
          ...mockPost.attributes,
          title: '<script>alert("XSS")</script>',
          slug: 'malicious-post',
        },
      };
      (getPostBySlug as jest.Mock).mockResolvedValue(maliciousPost);

      const Component = await BlogPost({ params: Promise.resolve({ slug: 'malicious-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href') || '';

      // Script tags should be encoded, not executable
      expect(href).toContain(encodeURIComponent('<script>alert("XSS")</script>'));
      expect(href).not.toContain('<script>');
    });

    it('should prevent XSS with JavaScript protocol', async () => {
      const Component = await BlogPost({ params: Promise.resolve({ slug: 'test-blog-post' }) });
      render(Component);

      const emailButton = screen.getByLabelText('Share via Email');
      const href = emailButton.getAttribute('href') || '';

      // Should not allow javascript: protocol
      expect(href).not.toContain('javascript:');
      expect(href).toMatch(/^mailto:/);
    });
  });
});
