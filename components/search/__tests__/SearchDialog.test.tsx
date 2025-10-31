import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchDialog } from '../SearchDialog';

// Mock fetch
global.fetch = jest.fn();

describe('SearchDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [],
        meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } },
      }),
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Search button rendering', () => {
    it('renders search button', () => {
      render(<SearchDialog />);
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('displays keyboard shortcut badge', () => {
      render(<SearchDialog />);
      // Check for ⌘K or Ctrl+K badge
      expect(screen.getByText(/⌘K|Ctrl\+K/i)).toBeInTheDocument();
    });

    it('button has gray background', () => {
      render(<SearchDialog />);
      const button = screen.getByRole('button', { name: /search/i });
      expect(button).toHaveClass(/bg-gray/);
    });

    it('button has hover effect', () => {
      render(<SearchDialog />);
      const button = screen.getByRole('button', { name: /search/i });
      expect(button).toHaveClass(/hover/);
    });
  });

  describe('Dialog opening', () => {
    it('clicking button opens dialog', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      expect(screen.getByPlaceholderText(/search posts/i)).toBeInTheDocument();
    });

    it('Cmd+K shortcut opens dialog on Mac', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      await user.keyboard('{Meta>}k{/Meta}');

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search posts/i)).toBeInTheDocument();
      });
    });

    it('Ctrl+K shortcut opens dialog on Windows/Linux', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      await user.keyboard('{Control>}k{/Control}');

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search posts/i)).toBeInTheDocument();
      });
    });

    it('input field has autofocus when dialog opens', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);
      expect(input).toHaveFocus();
    });
  });

  describe('Dialog closing', () => {
    it('ESC key closes dialog', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      // Open dialog
      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      expect(screen.getByPlaceholderText(/search posts/i)).toBeInTheDocument();

      // Close with ESC
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/search posts/i)).not.toBeInTheDocument();
      });
    });

    it('clicking result closes dialog', async () => {
      const user = userEvent.setup({ delay: null });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 1,
              documentId: 'doc1',
              title: 'Test Post',
              slug: 'test-post',
              excerpt: 'Test excerpt',
              publishedDate: '2024-01-01',
              categories: [],
            },
          ],
          meta: { pagination: { page: 1, pageSize: 12, pageCount: 1, total: 1 } },
        }),
      });

      render(<SearchDialog />);

      // Open dialog
      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      // Type search query
      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, 'test');

      // Wait for debounce
      jest.advanceTimersByTime(300);

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Test Post')).toBeInTheDocument();
      });

      // Click result
      const result = screen.getByText('Test Post').closest('a');
      if (result) await user.click(result);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/search posts/i)).not.toBeInTheDocument();
      });
    });

    it('clicking overlay closes dialog', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      // Open dialog
      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      expect(screen.getByPlaceholderText(/search posts/i)).toBeInTheDocument();

      // Find and click overlay (the backdrop)
      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
      if (overlay) {
        await user.click(overlay as Element);

        await waitFor(() => {
          expect(screen.queryByPlaceholderText(/search posts/i)).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Search functionality', () => {
    it('typing triggers debounced search after 300ms', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      // Open dialog
      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      // Type search query
      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, 'test');

      // Should not fetch immediately
      expect(global.fetch).not.toHaveBeenCalled();

      // Advance timer by 300ms
      jest.advanceTimersByTime(300);

      // Now should have called fetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/search?q=test&page=1');
      });
    });

    it('debounce resets on each keystroke', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      // Open dialog
      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);

      // Type 't'
      await user.type(input, 't');
      jest.advanceTimersByTime(200);

      // Type 'e' (should reset debounce)
      await user.type(input, 'e');
      jest.advanceTimersByTime(200);

      // Type 's' (should reset debounce)
      await user.type(input, 's');
      jest.advanceTimersByTime(200);

      // Type 't' (should reset debounce)
      await user.type(input, 't');

      // Should not have called fetch yet (total 600ms but resets each time)
      expect(global.fetch).not.toHaveBeenCalled();

      // Now advance full 300ms
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('fetches from /api/search endpoint', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, 'react');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/search?q=react&page=1');
      });
    });

    it('passes query parameter to API', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, 'typescript');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('q=typescript')
        );
      });
    });
  });

  describe('Loading state', () => {
    it('displays loading state while fetching', async () => {
      const user = userEvent.setup({ delay: null });

      // Mock slow fetch
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    data: [],
                    meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } },
                  }),
                }),
              1000
            )
          )
      );

      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, 'test');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });
    });

    it('hides loading state after results arrive', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, 'test');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Results display', () => {
    it('passes results to SearchResults component', async () => {
      const user = userEvent.setup({ delay: null });

      const mockResults = [
        {
          id: 1,
          documentId: 'doc1',
          title: 'React Basics',
          slug: 'react-basics',
          excerpt: 'Learn React',
          publishedDate: '2024-01-01',
          categories: [],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockResults,
          meta: { pagination: { page: 1, pageSize: 12, pageCount: 1, total: 1 } },
        }),
      });

      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, 'react');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('React Basics')).toBeInTheDocument();
      });
    });

    it('displays multiple results', async () => {
      const user = userEvent.setup({ delay: null });

      const mockResults = [
        {
          id: 1,
          documentId: 'doc1',
          title: 'First Post',
          slug: 'first-post',
          excerpt: 'Excerpt 1',
          publishedDate: '2024-01-01',
          categories: [],
        },
        {
          id: 2,
          documentId: 'doc2',
          title: 'Second Post',
          slug: 'second-post',
          excerpt: 'Excerpt 2',
          publishedDate: '2024-01-02',
          categories: [],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockResults,
          meta: { pagination: { page: 1, pageSize: 12, pageCount: 1, total: 2 } },
        }),
      });

      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, 'post');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
        expect(screen.getByText('Second Post')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog component integration', () => {
    it('uses Dialog component from ui', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      // Check for Dialog structure (white background, rounded, shadow)
      const dialogContent = screen.getByPlaceholderText(/search posts/i).closest('div');
      expect(dialogContent?.parentElement).toHaveClass(/bg-white/);
      expect(dialogContent?.parentElement).toHaveClass(/rounded/);
    });
  });

  describe('Error handling', () => {
    it('handles fetch errors gracefully', async () => {
      const user = userEvent.setup({ delay: null });

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, 'test');

      jest.advanceTimersByTime(300);

      // Should not crash, and should show empty results or error message
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });

    it('handles empty API response', async () => {
      const user = userEvent.setup({ delay: null });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } },
        }),
      });

      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, 'nonexistent');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup', () => {
    it('clears search when dialog closes', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      // Open and search
      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, 'test');

      // Close dialog
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/search posts/i)).not.toBeInTheDocument();
      });

      // Reopen dialog
      await user.click(button);

      // Input should be empty
      const newInput = screen.getByPlaceholderText(/search posts/i);
      expect(newInput).toHaveValue('');
    });

    it('does not fetch when query is empty', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      // Wait for debounce
      jest.advanceTimersByTime(300);

      // Should not have called fetch because query is empty
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not fetch when query contains only whitespace', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, '   ');

      jest.advanceTimersByTime(300);

      // Should not have called fetch because query is only whitespace
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles API response when not ok', async () => {
      const user = userEvent.setup({ delay: null });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      render(<SearchDialog />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      const input = screen.getByPlaceholderText(/search posts/i);
      await user.type(input, 'test');

      jest.advanceTimersByTime(300);

      // Should show no results
      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      });
    });
  });
});
