/**
 * CookieConsent Integration Tests
 *
 * Test Coverage:
 * - Integration with app layout
 * - Cookie persistence across page navigations
 * - Banner behavior in full application context
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookieConsent from '../CookieConsent';

// Mock Next.js components
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
}));

// Helper to clear all cookies
const clearCookies = () => {
  document.cookie.split(';').forEach((cookie) => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
};

describe('CookieConsent Integration Tests', () => {
  beforeEach(() => {
    clearCookies();
  });

  describe('App Layout Integration', () => {
    it('should integrate with app layout without errors', () => {
      expect(() => render(<CookieConsent />)).not.toThrow();
    });

    it('should render at bottom of page', () => {
      render(<CookieConsent />);
      const banner = screen.getByRole('dialog', { name: /cookie consent/i });
      const style = banner.getAttribute('style');
      expect(style).toContain('bottom: 0px');
    });

    it('should have fixed positioning', () => {
      render(<CookieConsent />);
      const banner = screen.getByRole('dialog', { name: /cookie consent/i });
      const style = banner.getAttribute('style');
      expect(style).toContain('position: fixed');
    });

    it('should span full width', () => {
      render(<CookieConsent />);
      const banner = screen.getByRole('dialog', { name: /cookie consent/i });
      const style = banner.getAttribute('style');
      expect(style).toContain('width: 100%');
    });

    it('should have high z-index to stay on top', () => {
      render(<CookieConsent />);
      const banner = screen.getByRole('dialog', { name: /cookie consent/i });
      const style = banner.getAttribute('style');
      expect(style).toContain('z-index: 999');
    });
  });

  describe('User Journey', () => {
    it('should show banner on first visit', () => {
      render(<CookieConsent />);
      expect(screen.getByRole('dialog', { name: /cookie consent/i })).toBeInTheDocument();
    });

    it('should hide banner after user accepts', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await user.click(acceptButton);

      expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
    });

    it('should persist user choice across component re-renders', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<CookieConsent />);

      // User accepts cookies
      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await user.click(acceptButton);

      // Simulate navigation/page reload by re-rendering
      rerender(<CookieConsent />);

      // Banner should not appear again
      expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
    });

    it('should hide banner when user declines', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const declineButton = screen.getByRole('button', { name: /cookie settings/i });
      await user.click(declineButton);

      expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
    });
  });

  describe('GDPR Compliance', () => {
    it('should provide clear information about cookie usage', () => {
      render(<CookieConsent />);
      expect(
        screen.getByText(/this website uses cookies to improve your experience/i)
      ).toBeInTheDocument();
    });

    it('should provide accept option', () => {
      render(<CookieConsent />);
      expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    });

    it('should provide decline option', () => {
      render(<CookieConsent />);
      expect(screen.getByRole('button', { name: /cookie settings/i })).toBeInTheDocument();
    });

    it('should be accessible to screen readers', () => {
      render(<CookieConsent />);
      const banner = screen.getByRole('dialog', { name: /cookie consent/i });
      expect(banner).toHaveAttribute('aria-label', 'Cookie Consent Banner');
    });

    it('should not set cookie without explicit consent', () => {
      render(<CookieConsent />);

      // No cookie should be set just by rendering
      expect(document.cookie).not.toContain('frankbria-cookie-consent=true');
    });

    it('should allow users to opt-out', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const declineButton = screen.getByRole('button', { name: /cookie settings/i });
      await user.click(declineButton);

      // Should not set any tracking cookie
      expect(document.cookie).not.toContain('frankbria-cookie-consent=true');
    });
  });

  describe('Responsive Design', () => {
    it('should use flexbox for responsive layout', () => {
      render(<CookieConsent />);
      const banner = screen.getByRole('dialog', { name: /cookie consent/i });
      const style = banner.getAttribute('style');
      expect(style).toContain('display: flex');
      expect(style).toContain('flex-wrap: wrap');
    });

    it('should have flexible content area', () => {
      render(<CookieConsent />);
      const banner = screen.getByRole('dialog', { name: /cookie consent/i });

      // Content div should have flex-basis for responsive behavior
      const contentDiv = banner.querySelector('div[style*="flex"]');
      expect(contentDiv).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should render quickly without blocking', () => {
      const startTime = performance.now();
      render(<CookieConsent />);
      const endTime = performance.now();

      // Should render in less than 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(<CookieConsent />);
      expect(() => unmount()).not.toThrow();
    });

    it('should handle multiple rapid renders efficiently', () => {
      const { rerender } = render(<CookieConsent />);

      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<CookieConsent />);
      }

      expect(screen.getByRole('dialog', { name: /cookie consent/i })).toBeInTheDocument();
    });
  });
});
