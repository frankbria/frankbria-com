/**
 * Header Component Integration Tests
 *
 * Tests the integration between Header and MobileMenu components.
 * Verifies responsive behavior and proper component interaction.
 *
 * Test Coverage:
 * - MobileMenu integration in Header
 * - Responsive behavior (desktop vs mobile)
 * - SearchDialog appears in both desktop and mobile
 * - No layout conflicts
 * - Proper class application
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '../Header';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, onClick, className }: any) => {
    return (
      <a href={href} onClick={onClick} className={className}>
        {children}
      </a>
    );
  };
});

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}));

describe('Header Integration Tests', () => {
  beforeEach(() => {
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    document.body.style.overflow = 'unset';
  });

  describe('Component Integration', () => {
    it('should render Header with MobileMenu', () => {
      render(<Header />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });
      expect(hamburger).toBeInTheDocument();
    });

    it('should render logo', () => {
      render(<Header />);
      const logo = screen.getByAltText(/frank bria/i);
      expect(logo).toBeInTheDocument();
    });

    it('should render desktop navigation links', () => {
      render(<Header />);
      const homeLinks = screen.getAllByRole('link', { name: /home/i });
      const blogLinks = screen.getAllByRole('link', { name: /blog/i });

      // Should have desktop links
      expect(homeLinks.length).toBeGreaterThan(0);
      expect(blogLinks.length).toBeGreaterThan(0);
    });

    it('should render SearchDialog', () => {
      render(<Header />);
      const searchButtons = screen.getAllByRole('button', { name: /search posts/i });

      // SearchDialog appears in both desktop and mobile
      expect(searchButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Responsive Behavior', () => {
    it('should have mobile-hidden class on desktop nav', () => {
      const { container } = render(<Header />);
      const desktopNav = container.querySelector('nav.hidden.md\\:flex');
      expect(desktopNav).toBeInTheDocument();
    });

    it('should have mobile-only class on mobile container', () => {
      const { container } = render(<Header />);
      const mobileContainer = container.querySelector('.flex.md\\:hidden');
      expect(mobileContainer).toBeInTheDocument();
    });

    it('should render hamburger with mobile-only class', () => {
      render(<Header />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });
      expect(hamburger).toHaveClass('md:hidden');
    });

    it('should show SearchDialog in both desktop and mobile sections', () => {
      render(<Header />);
      const searchButtons = screen.getAllByRole('button', { name: /search posts/i });

      // Should have at least 2 SearchDialog instances (desktop + mobile)
      expect(searchButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should have gap-2 between mobile items', () => {
      const { container } = render(<Header />);
      const mobileContainer = container.querySelector('.gap-2');
      expect(mobileContainer).toBeInTheDocument();
    });
  });

  describe('MobileMenu Functionality in Header', () => {
    it('should open mobile menu when hamburger clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburger = screen.getByRole('button', { name: /open menu/i });
      await user.click(hamburger);

      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('should show navigation links in mobile menu', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburger = screen.getByRole('button', { name: /open menu/i });
      await user.click(hamburger);

      // Mobile menu links should be visible
      const homeLinks = screen.getAllByRole('link', { name: /^home$/i });
      const blogLinks = screen.getAllByRole('link', { name: /^blog$/i });

      expect(homeLinks.length).toBeGreaterThan(0);
      expect(blogLinks.length).toBeGreaterThan(0);
    });

    it('should close mobile menu when close button clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburger = screen.getByRole('button', { name: /open menu/i });
      await user.click(hamburger);

      const closeButton = screen.getByRole('button', { name: /close menu/i });
      await user.click(closeButton);

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    it('should lock body scroll when mobile menu opens', async () => {
      const user = userEvent.setup();
      render(<Header />);

      expect(document.body.style.overflow).toBe('unset');

      const hamburger = screen.getByRole('button', { name: /open menu/i });
      await user.click(hamburger);

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Layout Structure', () => {
    it('should have proper header structure', () => {
      const { container } = render(<Header />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('bg-gray-900', 'border-b', 'border-gray-800');
    });

    it('should have max-width container', () => {
      const { container } = render(<Header />);
      const maxWidthContainer = container.querySelector('.max-w-6xl');
      expect(maxWidthContainer).toBeInTheDocument();
    });

    it('should have flex layout for items', () => {
      const { container } = render(<Header />);
      const flexContainer = container.querySelector('.flex.items-center.justify-between');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have proper padding', () => {
      const { container } = render(<Header />);
      const paddedContainer = container.querySelector('.px-4.py-4');
      expect(paddedContainer).toBeInTheDocument();
    });
  });

  describe('Desktop Navigation', () => {
    it('should render desktop Home link with correct styling', () => {
      const { container } = render(<Header />);
      const desktopNav = container.querySelector('nav.hidden.md\\:flex');
      expect(desktopNav).toBeInTheDocument();

      const homeLink = desktopNav?.querySelector('a[href="/"]');
      expect(homeLink).toHaveClass('text-gray-300', 'hover:text-white', 'transition-colors');
    });

    it('should render desktop Blog link with correct styling', () => {
      const { container } = render(<Header />);
      const desktopNav = container.querySelector('nav.hidden.md\\:flex');

      const blogLink = desktopNav?.querySelector('a[href="/blog"]');
      expect(blogLink).toHaveClass('text-gray-300', 'hover:text-white', 'transition-colors');
    });

    it('should have gap-6 in desktop nav', () => {
      const { container } = render(<Header />);
      const desktopNav = container.querySelector('nav.gap-6');
      expect(desktopNav).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible logo link', () => {
      render(<Header />);
      const logoLink = screen.getByRole('link', { name: /frank bria/i });
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('should have accessible hamburger button', () => {
      render(<Header />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });
      expect(hamburger).toHaveAttribute('aria-label', 'Open menu');
    });

    it('should have keyboard accessible navigation', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburger = screen.getByRole('button', { name: /open menu/i });
      hamburger.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByText('Menu')).toBeInTheDocument();
    });
  });

  describe('No Layout Conflicts', () => {
    it('should not have overlapping navigation elements', () => {
      const { container } = render(<Header />);

      const desktopNav = container.querySelector('nav.hidden.md\\:flex');
      const mobileContainer = container.querySelector('.flex.md\\:hidden');

      expect(desktopNav).toBeInTheDocument();
      expect(mobileContainer).toBeInTheDocument();
    });

    it('should render all components without errors', () => {
      const { container } = render(<Header />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should maintain proper z-index stacking', async () => {
      const user = userEvent.setup();
      const { container } = render(<Header />);

      const hamburger = screen.getByRole('button', { name: /open menu/i });
      await user.click(hamburger);

      // Sheet should have z-50
      const sheet = container.querySelector('.z-50');
      expect(sheet).toBeInTheDocument();
    });
  });
});
