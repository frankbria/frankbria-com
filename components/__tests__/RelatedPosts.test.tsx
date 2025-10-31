/**
 * Tests for RelatedPosts Component
 * Following TDD methodology - these tests define expected behavior
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RelatedPosts } from '../RelatedPosts';
import { format } from 'date-fns';

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatString) => '2024-01-15'),
}));

describe('RelatedPosts Component', () => {
  const mockPosts = [
    {
      id: 1,
      attributes: {
        title: 'First Related Post',
        slug: 'first-related-post',
        publishedDate: '2024-01-15T00:00:00.000Z',
        excerpt: 'This is the first related post',
        featuredImage: {
          url: 'https://example.com/image1.jpg',
        },
        categories: [
          { id: 1, name: 'Technology' },
          { id: 2, name: 'Programming' },
        ],
      },
    },
    {
      id: 2,
      attributes: {
        title: 'Second Related Post',
        slug: 'second-related-post',
        publishedDate: '2024-01-10T00:00:00.000Z',
        excerpt: 'This is the second related post',
        featuredImage: {
          url: 'https://example.com/image2.jpg',
        },
        categories: [{ id: 1, name: 'Technology' }],
      },
    },
    {
      id: 3,
      attributes: {
        title: 'Third Related Post',
        slug: 'third-related-post',
        publishedDate: '2024-01-05T00:00:00.000Z',
        featuredImage: {
          url: 'https://example.com/image3.jpg',
        },
        categories: [{ id: 3, name: 'Design' }],
      },
    },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should return null when posts array is empty', () => {
      const { container } = render(<RelatedPosts posts={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render "Related" heading', () => {
      render(<RelatedPosts posts={mockPosts} />);
      const heading = screen.getByText('Related');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });

    it('should render grid with 3 posts', () => {
      render(<RelatedPosts posts={mockPosts} />);

      expect(screen.getByText('First Related Post')).toBeInTheDocument();
      expect(screen.getByText('Second Related Post')).toBeInTheDocument();
      expect(screen.getByText('Third Related Post')).toBeInTheDocument();
    });

    it('should render featured image for each post', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
      expect(images[2]).toHaveAttribute('src', 'https://example.com/image3.jpg');
    });

    it('should render title for each post', () => {
      render(<RelatedPosts posts={mockPosts} />);

      expect(screen.getByText('First Related Post')).toBeInTheDocument();
      expect(screen.getByText('Second Related Post')).toBeInTheDocument();
      expect(screen.getByText('Third Related Post')).toBeInTheDocument();
    });

    it('should render publishedDate formatted for each post', () => {
      render(<RelatedPosts posts={mockPosts} />);

      // Date should be formatted using date-fns
      expect(format).toHaveBeenCalledWith(
        new Date('2024-01-15T00:00:00.000Z'),
        'MMMM d, yyyy'
      );
      expect(format).toHaveBeenCalledWith(
        new Date('2024-01-10T00:00:00.000Z'),
        'MMMM d, yyyy'
      );
      expect(format).toHaveBeenCalledWith(
        new Date('2024-01-05T00:00:00.000Z'),
        'MMMM d, yyyy'
      );
    });

    it('should render first category for each post', () => {
      render(<RelatedPosts posts={mockPosts} />);

      // First and second post both show "Technology" (first category)
      const techCategories = screen.getAllByText('Technology');
      expect(techCategories.length).toBeGreaterThan(0);
      // Third post shows "Design"
      expect(screen.getByText('Design')).toBeInTheDocument();
    });

    it('should have images with alt text', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('alt', 'First Related Post');
      expect(images[1]).toHaveAttribute('alt', 'Second Related Post');
      expect(images[2]).toHaveAttribute('alt', 'Third Related Post');
    });
  });

  describe('Link Tests', () => {
    it('should link each post to /blog/[slug]', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/blog/first-related-post');
      expect(links[1]).toHaveAttribute('href', '/blog/second-related-post');
      expect(links[2]).toHaveAttribute('href', '/blog/third-related-post');
    });

    it('should have correct href for each link', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const firstLink = screen.getByRole('link', { name: /First Related Post/i });
      expect(firstLink).toHaveAttribute('href', '/blog/first-related-post');
    });

    it('should make entire card clickable via Link wrapper', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const links = screen.getAllByRole('link');
      // Each post should have one link wrapping the entire card
      expect(links).toHaveLength(3);
    });
  });

  describe('Styling Tests', () => {
    it('should have border-top on section', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const section = screen.getByText('Related').parentElement;
      expect(section).toHaveClass('border-t');
    });

    it('should have proper margins and padding', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const section = screen.getByText('Related').parentElement;
      expect(section).toHaveClass('mt-16');
      expect(section).toHaveClass('pt-8');
    });

    it('should have grid responsive classes (1 col mobile, 3 col desktop)', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const gridContainer = screen.getByText('First Related Post')
        .closest('div.grid');
      expect(gridContainer).toHaveClass('grid-cols-1');
      expect(gridContainer).toHaveClass('md:grid-cols-3');
    });

    it('should have heading styled correctly', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const heading = screen.getByText('Related');
      expect(heading).toHaveClass('text-2xl');
      expect(heading).toHaveClass('font-bold');
      expect(heading).toHaveClass('italic');
      expect(heading).toHaveClass('text-gray-900');
    });
  });

  describe('Data Handling Tests', () => {
    it('should handle posts without featured image', () => {
      const postsWithoutImage = [
        {
          id: 1,
          attributes: {
            title: 'Post Without Image',
            slug: 'post-without-image',
            publishedDate: '2024-01-15T00:00:00.000Z',
            categories: [{ id: 1, name: 'Tech' }],
          },
        },
      ];

      render(<RelatedPosts posts={postsWithoutImage} />);

      const image = screen.getByRole('img');
      // Should use placeholder image
      expect(image).toHaveAttribute('src', '/placeholder-image.jpg');
    });

    it('should handle posts without categories', () => {
      const postsWithoutCategories = [
        {
          id: 1,
          attributes: {
            title: 'Post Without Categories',
            slug: 'post-without-categories',
            publishedDate: '2024-01-15T00:00:00.000Z',
            featuredImage: {
              url: 'https://example.com/image.jpg',
            },
          },
        },
      ];

      render(<RelatedPosts posts={postsWithoutCategories} />);

      expect(screen.getByText('Post Without Categories')).toBeInTheDocument();
      // Should not crash, and no category should be displayed
      expect(screen.queryByText('•')).not.toBeInTheDocument();
    });

    it('should handle posts with empty categories array', () => {
      const postsWithEmptyCategories = [
        {
          id: 1,
          attributes: {
            title: 'Post With Empty Categories',
            slug: 'post-with-empty-categories',
            publishedDate: '2024-01-15T00:00:00.000Z',
            featuredImage: {
              url: 'https://example.com/image.jpg',
            },
            categories: [],
          },
        },
      ];

      render(<RelatedPosts posts={postsWithEmptyCategories} />);

      expect(screen.getByText('Post With Empty Categories')).toBeInTheDocument();
      expect(screen.queryByText('•')).not.toBeInTheDocument();
    });

    it('should format date correctly using date-fns', () => {
      render(<RelatedPosts posts={mockPosts} />);

      expect(format).toHaveBeenCalledWith(expect.any(Date), 'MMMM d, yyyy');
    });
  });

  describe('Accessibility Tests', () => {
    it('should have semantic HTML for heading', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Related');
    });

    it('should use time element for dates', () => {
      const { container } = render(<RelatedPosts posts={mockPosts} />);

      const timeElements = container.querySelectorAll('time');
      expect(timeElements).toHaveLength(3);
      expect(timeElements[0]).toHaveAttribute('dateTime', '2024-01-15T00:00:00.000Z');
      expect(timeElements[1]).toHaveAttribute('dateTime', '2024-01-10T00:00:00.000Z');
      expect(timeElements[2]).toHaveAttribute('dateTime', '2024-01-05T00:00:00.000Z');
    });

    it('should have article elements for semantic structure', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(3);
    });

    it('should have accessible links', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Image Styling', () => {
    it('should have aspect-video class on image container', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const imageContainers = screen.getAllByRole('img').map(img => img.parentElement);
      imageContainers.forEach(container => {
        expect(container).toHaveClass('aspect-video');
      });
    });

    it('should have rounded corners on image container', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const imageContainers = screen.getAllByRole('img').map(img => img.parentElement);
      imageContainers.forEach(container => {
        expect(container).toHaveClass('rounded-lg');
      });
    });

    it('should have proper fill styling on images', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const images = screen.getAllByRole('img');
      images.forEach(image => {
        // Images should have object-cover for proper aspect ratio handling
        expect(image.parentElement).toHaveClass('relative');
      });
    });
  });

  describe('Grid Layout', () => {
    it('should have gap between grid items', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const grid = screen.getByText('First Related Post').closest('div.grid');
      expect(grid).toHaveClass('gap-6');
    });

    it('should render correct number of posts', () => {
      render(<RelatedPosts posts={mockPosts.slice(0, 2)} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });

    it('should handle single post', () => {
      render(<RelatedPosts posts={[mockPosts[0]]} />);

      expect(screen.getByText('First Related Post')).toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(1);
    });
  });
});
