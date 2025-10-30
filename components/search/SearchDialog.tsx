'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchResults, SearchResult } from './SearchResults';

// Constants
const DEBOUNCE_DELAY = 300;
const SEARCH_PAGE = 1;

// Custom hook for search functionality
function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/search?q=${encodeURIComponent(query)}&page=${SEARCH_PAGE}`;
        console.log('Fetching:', url);
        const response = await fetch(url);

        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Search results:', data);
          setResults(data.data || []);
          if (!data.data || data.data.length === 0) {
            console.log('No results found for:', query);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Search API error:', response.status, errorData);
          const errorMessage = typeof errorData === 'string'
            ? errorData
            : errorData.error || errorData.message || response.statusText;
          setError(`Search failed (${response.status}): ${errorMessage}`);
          setResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setError('Failed to connect to search service');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch,
  };
}

// Custom hook for keyboard shortcuts
function useKeyboardShortcut(callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callback]);
}

// Helper function to detect OS
function getKeyboardShortcutLabel(): string {
  if (typeof window === 'undefined') return 'Ctrl+K';

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? '⌘K' : 'Ctrl+K';
}

/**
 * SearchDialog Component
 *
 * A searchable dialog that allows users to search blog posts.
 * Features:
 * - Keyboard shortcut (Cmd/Ctrl+K) to open
 * - Debounced search (300ms)
 * - Real-time results
 * - Loading states
 * - Closes on result click or ESC key
 */
export function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { query, setQuery, results, loading, error, clearSearch } = useSearch();

  // Open dialog with keyboard shortcut
  const openDialog = useCallback(() => setIsOpen(true), []);
  useKeyboardShortcut(openDialog);

  // Handle dialog close
  const handleClose = useCallback(() => {
    setIsOpen(false);
    clearSearch();
  }, [clearSearch]);

  // Handle dialog open/close state changes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      } else {
        setIsOpen(true);
      }
    },
    [handleClose]
  );

  // Handle result click
  const handleResultClick = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const shortcutKey = getKeyboardShortcutLabel();

  return (
    <>
      {/* Search button */}
      <Button
        variant="ghost"
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200"
        onClick={openDialog}
        aria-label="Search posts"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search</span>
        <span className="hidden sm:inline text-xs text-gray-500 ml-2 px-1.5 py-0.5 bg-gray-200 rounded">
          {shortcutKey}
        </span>
      </Button>

      {/* Search dialog */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <div className="p-4">
            <Input
              type="text"
              placeholder="Search posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="mb-4"
            />

            {error && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <SearchResults
              results={results}
              loading={loading}
              query={query}
              onResultClick={handleResultClick}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

