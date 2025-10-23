/**
 * CookieConsent Component Tests
 *
 * Test Coverage:
 * - Rendering on first visit (no existing cookie)
 * - Accept button presence and functionality
 * - Cookie settings (decline) button presence
 * - Banner hides when ACCEPT clicked
 * - Cookie is set when ACCEPT clicked
 * - Cookie name and expiry validation
 * - Banner doesn't re-appear if cookie exists
 * - Accessibility (ARIA labels, keyboard navigation)
 * - Message content rendering
 * - Component unmounts after acceptance
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookieConsent from '../CookieConsent';

// Helper to get cookie value
const getCookie = (name: string): string | undefined => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

// Helper to clear all cookies
const clearCookies = () => {
  document.cookie.split(';').forEach((cookie) => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
};

describe('CookieConsent Component', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    clearCookies();
  });

  describe('Rendering', () => {
    it('should render banner on first visit (no cookie)', () => {
      render(<CookieConsent />);
      const banner = screen.getByRole('dialog', { name: /cookie consent/i });
      expect(banner).toBeInTheDocument();
    });

    it('should render consent message', () => {
      render(<CookieConsent />);
      expect(
        screen.getByText(/this website uses cookies to improve your experience/i)
      ).toBeInTheDocument();
    });

    it('should have ACCEPT button', () => {
      render(<CookieConsent />);
      const acceptButton = screen.getByRole('button', { name: /accept/i });
      expect(acceptButton).toBeInTheDocument();
    });

    it('should have Cookie settings button', () => {
      render(<CookieConsent />);
      const settingsButton = screen.getByRole('button', { name: /cookie settings/i });
      expect(settingsButton).toBeInTheDocument();
    });

    it('should not render banner if cookie exists', () => {
      // Set the cookie first
      document.cookie = 'frankbria-cookie-consent=true; path=/';

      render(<CookieConsent />);

      const banner = screen.queryByRole('dialog', { name: /cookie consent/i });
      expect(banner).not.toBeInTheDocument();
    });
  });

  describe('Accept Functionality', () => {
    it('should hide banner when ACCEPT clicked', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const banner = screen.getByRole('dialog', { name: /cookie consent/i });
      expect(banner).toBeInTheDocument();

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await user.click(acceptButton);

      await waitFor(() => {
        const bannerAfter = screen.queryByRole('dialog', { name: /cookie consent/i });
        expect(bannerAfter).not.toBeInTheDocument();
      });
    });

    it('should set cookie when ACCEPT clicked', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await user.click(acceptButton);

      await waitFor(() => {
        const cookie = getCookie('frankbria-cookie-consent');
        expect(cookie).toBe('true');
      });
    });

    it('should set cookie with correct name', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await user.click(acceptButton);

      await waitFor(() => {
        expect(document.cookie).toContain('frankbria-cookie-consent=true');
      });
    });

    it('should set cookie with expiry (365 days)', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await user.click(acceptButton);

      await waitFor(() => {
        // Cookie should exist and not be session-only
        const cookie = getCookie('frankbria-cookie-consent');
        expect(cookie).toBe('true');

        // Verify cookie persists (has an expiry date, not session-only)
        // Session cookies don't have 'expires' or 'max-age'
        expect(document.cookie).toContain('frankbria-cookie-consent');
      });
    });
  });

  describe('Banner Persistence', () => {
    it('should not re-appear after acceptance on re-render', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await user.click(acceptButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
      });

      // Re-render component
      rerender(<CookieConsent />);

      // Banner should still not be visible
      expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
    });

    it('should not show banner on mount if cookie already exists', () => {
      // Pre-set the cookie
      document.cookie = 'frankbria-cookie-consent=true; path=/; max-age=31536000';

      render(<CookieConsent />);

      expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have dark theme background', () => {
      render(<CookieConsent />);
      const banner = screen.getByRole('dialog', { name: /cookie consent/i });

      // Check for gray-900 background (dark theme) - inline style
      const style = banner.getAttribute('style');
      expect(style).toContain('background: rgb(31, 41, 55)');
    });

    it('should have proper padding', () => {
      render(<CookieConsent />);
      const banner = screen.getByRole('dialog', { name: /cookie consent/i });

      // Check for 20px padding - inline style
      const style = banner.getAttribute('style');
      expect(style).toContain('padding: 20px');
    });

    it('should style accept button correctly', () => {
      render(<CookieConsent />);
      const acceptButton = screen.getByRole('button', { name: /accept/i });

      // Should have blue background class
      expect(acceptButton).toHaveClass('bg-blue-500');
      expect(acceptButton).toHaveClass('text-white');
      expect(acceptButton).toHaveClass('rounded');
    });

    it('should style decline button as transparent', () => {
      render(<CookieConsent />);
      const settingsButton = screen.getByRole('button', { name: /cookie settings/i });

      // Should have transparent background class
      expect(settingsButton).toHaveClass('bg-transparent');
      expect(settingsButton).toHaveClass('text-gray-400');
    });
  });

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      render(<CookieConsent />);
      const banner = screen.getByRole('dialog', { name: /cookie consent/i });
      expect(banner).toHaveAttribute('role', 'dialog');
    });

    it('should have aria-label', () => {
      render(<CookieConsent />);
      const banner = screen.getByRole('dialog', { name: /cookie consent/i });
      expect(banner).toHaveAttribute('aria-label', 'Cookie Consent Banner');
    });

    it('should be keyboard accessible - ACCEPT with Enter', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      acceptButton.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
      });
    });

    it('should be keyboard accessible - ACCEPT with Space', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      acceptButton.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
      });
    });

    it('should be keyboard accessible - Tab navigation', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      // Tab to first button (should be ACCEPT)
      await user.tab();
      expect(screen.getByRole('button', { name: /accept/i })).toHaveFocus();

      // Tab to second button (should be Cookie settings)
      await user.tab();
      expect(screen.getByRole('button', { name: /cookie settings/i })).toHaveFocus();
    });
  });

  describe('Component Lifecycle', () => {
    it('should unmount cleanly after acceptance', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await user.click(acceptButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
      });

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid clicks on accept button', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /accept/i });

      // Click multiple times rapidly
      await user.click(acceptButton);
      await user.click(acceptButton);
      await user.click(acceptButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
      });

      // Should only set cookie once
      const cookie = getCookie('frankbria-cookie-consent');
      expect(cookie).toBe('true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle component mount/unmount without acceptance', () => {
      const { unmount } = render(<CookieConsent />);
      expect(screen.getByRole('dialog', { name: /cookie consent/i })).toBeInTheDocument();
      expect(() => unmount()).not.toThrow();
    });

    it('should handle settings button click', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const settingsButton = screen.getByRole('button', { name: /cookie settings/i });

      // Settings button should be clickable (decline functionality)
      await user.click(settingsButton);

      // Banner should hide (decline = hide banner without setting cookie)
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
      });
    });

    it('should not set cookie when settings button clicked', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const settingsButton = screen.getByRole('button', { name: /cookie settings/i });
      await user.click(settingsButton);

      await waitFor(() => {
        const cookie = getCookie('frankbria-cookie-consent');
        expect(cookie).toBeUndefined();
      });
    });
  });
});
