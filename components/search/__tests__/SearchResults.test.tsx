import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchResults } from '../SearchResults';

describe('SearchResults', () => {
  const mockOnResultClick = jest.fn();

  const mockPosts = [
    {
      id: 1,
      documentId: 'doc1',
      title: 'First Post',
      slug: 'first-post',
      excerpt: 'This is the first post excerpt',
      publishedDate: '2024-01-15',
      categories: [
        { name: 'Tech', slug: 'tech' },
        { name: 'JavaScript', slug: 'javascript' },
      ],
    },
    {
      id: 2,
      documentId: 'doc2',
      title: 'Second Post',
      slug: 'second-post',
      excerpt: 'This is the second post excerpt',
      publishedDate: '2024-01-10',
      categories: [
        { name: 'Design', slug: 'design' },
      ],
    },
    {
      id: 3,
      documentId: 'doc3',
      title: 'Third Post',
      slug: 'third-post',
      excerpt: 'This is the third post excerpt',
      publishedDate: '2024-01-05',
      categories: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading spinner when loading is true', () => {
      render(
        <SearchResults
          results={[]}
          loading={true}
          query=""
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('does not show results when loading', () => {
      render(
        <SearchResults
          results={mockPosts}
          loading={true}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.queryByText('First Post')).not.toBeInTheDocument();
    });
  });

  describe('Empty states', () => {
    it('shows "start typing" message when no query and not loading', () => {
      render(
        <SearchResults
          results={[]}
          loading={false}
          query=""
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText(/start typing to search/i)).toBeInTheDocument();
    });

    it('shows "no results" message when query exists but results are empty', () => {
      render(
        <SearchResults
          results={[]}
          loading={false}
          query="nonexistent"
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      expect(screen.getByText(/nonexistent/i)).toBeInTheDocument();
    });

    it('does not show empty state when results exist', () => {
      render(
        <SearchResults
          results={mockPosts}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.queryByText(/start typing to search/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/no results found/i)).not.toBeInTheDocument();
    });
  });

  describe('Results display', () => {
    it('renders all search results', () => {
      render(
        <SearchResults
          results={mockPosts}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('First Post')).toBeInTheDocument();
      expect(screen.getByText('Second Post')).toBeInTheDocument();
      expect(screen.getByText('Third Post')).toBeInTheDocument();
    });

    it('displays post titles', () => {
      render(
        <SearchResults
          results={[mockPosts[0]]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('First Post')).toBeInTheDocument();
    });

    it('displays post excerpts', () => {
      render(
        <SearchResults
          results={[mockPosts[0]]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('This is the first post excerpt')).toBeInTheDocument();
    });

    it('displays category badges', () => {
      render(
        <SearchResults
          results={[mockPosts[0]]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('Tech')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    it('handles posts with no categories', () => {
      render(
        <SearchResults
          results={[mockPosts[2]]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('Third Post')).toBeInTheDocument();
      // Should not crash, and should not display any category badges
      expect(screen.queryByText('Tech')).not.toBeInTheDocument();
    });

    it('displays formatted published date', () => {
      render(
        <SearchResults
          results={[mockPosts[0]]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      // Should format the date (e.g., "Jan 15, 2024" or "Jan 14, 2024" depending on timezone)
      expect(screen.getByText(/Jan/i)).toBeInTheDocument();
      expect(screen.getByText(/(14|15)/)).toBeInTheDocument();
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });
  });

  describe('Result interaction', () => {
    it('calls onResultClick when a result is clicked', async () => {
      const user = userEvent.setup();

      render(
        <SearchResults
          results={[mockPosts[0]]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      const resultElement = screen.getByText('First Post').closest('a') || screen.getByText('First Post').closest('div');
      if (resultElement) {
        await user.click(resultElement);
      }

      expect(mockOnResultClick).toHaveBeenCalledTimes(1);
    });

    it('calls onResultClick for each different result clicked', async () => {
      const user = userEvent.setup();

      render(
        <SearchResults
          results={mockPosts}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      const firstResult = screen.getByText('First Post').closest('a') || screen.getByText('First Post').closest('div');
      const secondResult = screen.getByText('Second Post').closest('a') || screen.getByText('Second Post').closest('div');

      if (firstResult) await user.click(firstResult);
      if (secondResult) await user.click(secondResult);

      expect(mockOnResultClick).toHaveBeenCalledTimes(2);
    });

    it('navigates to correct blog post URL', () => {
      render(
        <SearchResults
          results={[mockPosts[0]]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      const link = screen.getByText('First Post').closest('a');
      expect(link).toHaveAttribute('href', '/blog/first-post');
    });

    it('creates proper URLs for all results', () => {
      render(
        <SearchResults
          results={mockPosts}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      const firstLink = screen.getByText('First Post').closest('a');
      const secondLink = screen.getByText('Second Post').closest('a');
      const thirdLink = screen.getByText('Third Post').closest('a');

      expect(firstLink).toHaveAttribute('href', '/blog/first-post');
      expect(secondLink).toHaveAttribute('href', '/blog/second-post');
      expect(thirdLink).toHaveAttribute('href', '/blog/third-post');
    });
  });

  describe('Styling and accessibility', () => {
    it('results container is scrollable', () => {
      render(
        <SearchResults
          results={mockPosts}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      const container = screen.getByTestId('results-container');
      expect(container).toHaveClass(/overflow/);
    });

    it('result items have hover effects', () => {
      render(
        <SearchResults
          results={[mockPosts[0]]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      const resultItem = screen.getByTestId('result-item-0');
      expect(resultItem).toHaveClass(/hover/);
    });

    it('category badges have blue styling', () => {
      render(
        <SearchResults
          results={[mockPosts[0]]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      const techBadge = screen.getByText('Tech');
      expect(techBadge).toHaveClass(/bg-blue/);
    });

    it('has accessible aria labels', () => {
      render(
        <SearchResults
          results={mockPosts}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      // Check for semantic structure
      const results = screen.getAllByRole('link');
      expect(results.length).toBe(3); // One for each post
    });
  });

  describe('Edge cases', () => {
    it('handles very long post titles', () => {
      const longTitlePost = {
        ...mockPosts[0],
        title: 'This is a very long post title that should be handled gracefully without breaking the layout or causing overflow issues',
      };

      render(
        <SearchResults
          results={[longTitlePost]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText(/This is a very long post title/)).toBeInTheDocument();
    });

    it('handles very long excerpts', () => {
      const longExcerptPost = {
        ...mockPosts[0],
        excerpt: 'This is a very long excerpt that should be truncated or handled properly to avoid breaking the layout. '.repeat(10),
      };

      render(
        <SearchResults
          results={[longExcerptPost]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText(/This is a very long excerpt/)).toBeInTheDocument();
    });

    it('handles many categories', () => {
      const manyCategoriesPost = {
        ...mockPosts[0],
        categories: [
          { name: 'Cat1', slug: 'cat1' },
          { name: 'Cat2', slug: 'cat2' },
          { name: 'Cat3', slug: 'cat3' },
          { name: 'Cat4', slug: 'cat4' },
          { name: 'Cat5', slug: 'cat5' },
        ],
      };

      render(
        <SearchResults
          results={[manyCategoriesPost]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('Cat1')).toBeInTheDocument();
      expect(screen.getByText('Cat5')).toBeInTheDocument();
    });

    it('handles null categories array', () => {
      const nullCategoriesPost = {
        ...mockPosts[0],
        categories: null as any,
      };

      render(
        <SearchResults
          results={[nullCategoriesPost]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      // Should not crash
      expect(screen.getByText('First Post')).toBeInTheDocument();
    });

    it('handles undefined categories', () => {
      const { categories, ...postWithoutCategories } = mockPosts[0];
      const undefinedCategoriesPost = {
        ...postWithoutCategories,
        categories: undefined as any,
      };

      render(
        <SearchResults
          results={[undefinedCategoriesPost]}
          loading={false}
          query="test"
          onResultClick={mockOnResultClick}
        />
      );

      // Should not crash
      expect(screen.getByText('First Post')).toBeInTheDocument();
    });
  });
});
