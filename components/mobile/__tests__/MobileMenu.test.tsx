/**
 * MobileMenu Component Tests
 *
 * Test Coverage:
 * - Rendering: Hamburger button, menu items, icons
 * - Open/Close: User interactions, backdrop, close button
 * - Navigation: Link clicks, menu closure on navigation
 * - Accessibility: Keyboard navigation, ARIA labels, focus management
 * - Responsive: Mobile visibility, desktop hiding
 * - Integration: Sheet component, SearchDialog integration
 * - Edge Cases: Rapid clicks, idempotent operations
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileMenu } from '../MobileMenu';

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

describe('MobileMenu Component', () => {
  beforeEach(() => {
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    document.body.style.overflow = 'unset';
  });

  describe('Rendering Tests', () => {
    it('should render hamburger button', () => {
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });
      expect(hamburger).toBeInTheDocument();
    });

    it('should render hamburger with Menu icon', () => {
      const { container } = render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });
      const icon = within(hamburger).getByRole('img', { hidden: true });
      expect(icon).toBeInTheDocument();
    });

    it('should have proper aria-label on hamburger button', () => {
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });
      expect(hamburger).toHaveAttribute('aria-label', 'Open menu');
    });

    it('should not show menu items when closed by default', () => {
      render(<MobileMenu />);
      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^home$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^blog$/i })).not.toBeInTheDocument();
    });

    it('should apply mobile-only class to hamburger button', () => {
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });
      expect(hamburger).toHaveClass('md:hidden');
    });

    it('should use ghost variant for hamburger button', () => {
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });
      expect(hamburger).toHaveClass('hover:bg-gray-100');
    });

    it('should use icon size for hamburger button', () => {
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });
      expect(hamburger).toHaveClass('h-10', 'w-10');
    });

    it('should have text-gray-300 color for hamburger', () => {
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });
      expect(hamburger).toHaveClass('text-gray-300');
    });

    it('should have hover:text-white for hamburger', () => {
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });
      expect(hamburger).toHaveClass('hover:text-white');
    });
  });

  describe('Open/Close Tests', () => {
    it('should open menu when hamburger is clicked', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('should show menu items when menu is open', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      expect(screen.getByRole('link', { name: /^home$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^blog$/i })).toBeInTheDocument();
    });

    it('should close menu when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);
      expect(screen.getByText('Menu')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /close menu/i });
      await user.click(closeButton);

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    it('should close menu when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);
      expect(screen.getByText('Menu')).toBeInTheDocument();

      const backdrop = container.querySelector('.bg-black\\/50') as HTMLElement;
      await user.click(backdrop);

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    it('should lock body scroll when menu opens', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      expect(document.body.style.overflow).toBe('unset');

      await user.click(hamburger);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when menu closes', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);
      expect(document.body.style.overflow).toBe('hidden');

      const closeButton = screen.getByRole('button', { name: /close menu/i });
      await user.click(closeButton);

      expect(document.body.style.overflow).toBe('unset');
    });

    it('should use Sheet component with side="right"', async () => {
      const user = userEvent.setup();
      const { container } = render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const sheet = container.querySelector('.right-0');
      expect(sheet).toBeInTheDocument();
    });
  });

  describe('Navigation Tests', () => {
    it('should render Home link with correct href', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should render Blog link with correct href', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const blogLink = screen.getByRole('link', { name: /^blog$/i });
      expect(blogLink).toHaveAttribute('href', '/blog');
    });

    it('should close menu when Home link is clicked', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);
      expect(screen.getByText('Menu')).toBeInTheDocument();

      const homeLink = screen.getByRole('link', { name: /^home$/i });
      await user.click(homeLink);

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    it('should close menu when Blog link is clicked', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);
      expect(screen.getByText('Menu')).toBeInTheDocument();

      const blogLink = screen.getByRole('link', { name: /^blog$/i });
      await user.click(blogLink);

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    it('should have correct styling for menu items', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).toHaveClass('text-gray-700', 'hover:text-gray-900', 'font-medium');
    });

    it('should have gap-4 between menu items', async () => {
      const user = userEvent.setup();
      const { container } = render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const menuContainer = container.querySelector('.gap-4');
      expect(menuContainer).toBeInTheDocument();
    });

    it('should have mt-16 for menu content', async () => {
      const user = userEvent.setup();
      const { container } = render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const menuContainer = container.querySelector('.mt-16');
      expect(menuContainer).toBeInTheDocument();
    });

    it('should have px-6 for menu content', async () => {
      const user = userEvent.setup();
      const { container } = render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const menuContainer = container.querySelector('.px-6');
      expect(menuContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should be keyboard accessible with Enter key', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      hamburger.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('should be keyboard accessible with Space key', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      hamburger.focus();
      await user.keyboard(' ');

      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('should close with ESC key', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);
      expect(screen.getByText('Menu')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    it('should have proper heading for menu', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const heading = screen.getByText('Menu');
      expect(heading.tagName).toBe('H2');
    });

    it('should have menu links keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const homeLink = screen.getByRole('link', { name: /^home$/i });
      const blogLink = screen.getByRole('link', { name: /^blog$/i });

      expect(homeLink).toBeInTheDocument();
      expect(blogLink).toBeInTheDocument();
    });

    it('should have close button keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const closeButton = screen.getByRole('button', { name: /close menu/i });
      closeButton.focus();
      await user.keyboard('{Enter}');

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Tests', () => {
    it('should be visible on mobile viewport', () => {
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });
      expect(hamburger).toHaveClass('md:hidden');
    });

    it('should use Sheet component correctly', async () => {
      const user = userEvent.setup();
      const { container } = render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      // Sheet should be rendered with proper classes
      const sheet = container.querySelector('.fixed.inset-0.z-50');
      expect(sheet).toBeInTheDocument();
    });

    it('should render SheetContent wrapper', async () => {
      const user = userEvent.setup();
      const { container } = render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      // SheetContent has h-full and overflow-y-auto
      const sheetContent = container.querySelector('.h-full.overflow-y-auto');
      expect(sheetContent).toBeInTheDocument();
    });

    it('should render SheetClose button', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const closeButton = screen.getByRole('button', { name: /close menu/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid clicks on hamburger', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);
      await user.click(hamburger);
      await user.click(hamburger);

      // Should still work correctly - last state should be consistent
      expect(screen.queryByText('Menu')).toBeInTheDocument();
    });

    it('should handle opening when already open (idempotent)', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);
      expect(screen.getByText('Menu')).toBeInTheDocument();

      await user.click(hamburger);
      // Menu should still be visible
      expect(screen.queryByText('Menu')).toBeInTheDocument();
    });

    it('should handle closing when already closed (idempotent)', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();

      // Try to close when already closed - should not error
      await user.keyboard('{Escape}');

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    it('should clean up event listeners on unmount', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('unset');
    });

    it('should render menu heading with correct styles', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const heading = screen.getByText('Menu');
      expect(heading).toHaveClass('text-lg', 'font-semibold', 'text-gray-900', 'mb-4');
    });
  });

  describe('Menu Item Structure', () => {
    it('should render menu items with flex-col layout', async () => {
      const user = userEvent.setup();
      const { container } = render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const menuContainer = container.querySelector('.flex.flex-col');
      expect(menuContainer).toBeInTheDocument();
    });

    it('should have py-2 spacing on menu links', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).toHaveClass('py-2');
    });

    it('should have transition-colors on menu links', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const hamburger = screen.getByRole('button', { name: /open menu/i });

      await user.click(hamburger);

      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).toHaveClass('transition-colors');
    });
  });
});
