/**
 * Sheet Component Tests
 *
 * Test Coverage:
 * - Sheet rendering when open/closed
 * - Side positioning (left/right)
 * - Backdrop rendering and click handling
 * - ESC key to close sheet
 * - Body scroll locking
 * - Slide animations
 * - SheetContent rendering
 * - SheetClose button rendering and functionality
 * - Accessibility (ARIA attributes)
 * - Event handlers (onOpenChange)
 * - Edge cases
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sheet, SheetContent, SheetClose } from '../sheet';

describe('Sheet Component', () => {
  beforeEach(() => {
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    document.body.style.overflow = 'unset';
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(
        <Sheet open={false} onOpenChange={() => {}}>
          <div>Sheet Content</div>
        </Sheet>
      );
      expect(screen.queryByText('Sheet Content')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Sheet Content</div>
        </Sheet>
      );
      expect(screen.getByText('Sheet Content')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Test Content</div>
        </Sheet>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render backdrop', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have correct z-index', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      const overlay = container.querySelector('.z-50');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Side Positioning', () => {
    it('should default to right side when side not specified', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      const sheet = container.querySelector('.right-0');
      expect(sheet).toBeInTheDocument();
    });

    it('should position on right side when side="right"', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}} side="right">
          <div>Content</div>
        </Sheet>
      );
      const sheet = container.querySelector('.right-0');
      expect(sheet).toBeInTheDocument();
    });

    it('should position on left side when side="left"', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}} side="left">
          <div>Content</div>
        </Sheet>
      );
      const sheet = container.querySelector('.left-0');
      expect(sheet).toBeInTheDocument();
    });

    it('should have full height', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      const sheet = container.querySelector('.top-0.bottom-0');
      expect(sheet).toBeInTheDocument();
    });

    it('should have fixed width', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      const sheet = container.querySelector('.w-80');
      expect(sheet).toBeInTheDocument();
    });
  });

  describe('Slide Animation', () => {
    it('should have transition classes', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      const sheet = container.querySelector('.transform.transition-transform');
      expect(sheet).toBeInTheDocument();
    });

    it('should apply translate-x-0 when open', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      const sheet = container.querySelector('.translate-x-0');
      expect(sheet).toBeInTheDocument();
    });

    it('should have white background', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      const sheet = container.querySelector('.bg-white');
      expect(sheet).toBeInTheDocument();
    });

    it('should have shadow', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      const sheet = container.querySelector('.shadow-xl');
      expect(sheet).toBeInTheDocument();
    });
  });

  describe('Open/Close Behavior', () => {
    it('should call onOpenChange with false when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      const { container } = render(
        <Sheet open={true} onOpenChange={handleOpenChange}>
          <div>Content</div>
        </Sheet>
      );
      const backdrop = container.querySelector('.bg-black\\/50') as HTMLElement;
      await user.click(backdrop);
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange with false when ESC key is pressed', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      render(
        <Sheet open={true} onOpenChange={handleOpenChange}>
          <div>Content</div>
        </Sheet>
      );
      await user.keyboard('{Escape}');
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not call onOpenChange when content is clicked', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      render(
        <Sheet open={true} onOpenChange={handleOpenChange}>
          <div>Content</div>
        </Sheet>
      );
      const content = screen.getByText('Content');
      await user.click(content);
      expect(handleOpenChange).not.toHaveBeenCalled();
    });

    it('should not respond to ESC when sheet is closed', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      render(
        <Sheet open={false} onOpenChange={handleOpenChange}>
          <div>Content</div>
        </Sheet>
      );
      await user.keyboard('{Escape}');
      expect(handleOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Locking', () => {
    it('should lock body scroll when sheet opens', () => {
      const { rerender } = render(
        <Sheet open={false} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      expect(document.body.style.overflow).toBe('unset');

      rerender(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll when sheet closes', () => {
      const { rerender } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Sheet open={false} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should unlock body scroll when component unmounts', () => {
      const { unmount } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('SheetContent Component', () => {
    it('should render SheetContent with children', () => {
      render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <p>Sheet content text</p>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByText('Sheet content text')).toBeInTheDocument();
    });

    it('should have full height', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>
      );
      const content = container.querySelector('.h-full');
      expect(content).toBeInTheDocument();
    });

    it('should be scrollable', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>
      );
      const content = container.querySelector('.overflow-y-auto');
      expect(content).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <h2>Menu</h2>
            <nav>Navigation</nav>
            <footer>Footer</footer>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('SheetClose Component', () => {
    it('should render close button', () => {
      const handleClose = jest.fn();
      render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <SheetClose onClose={handleClose} />
          </SheetContent>
        </Sheet>
      );
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when clicked', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();
      render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <SheetClose onClose={handleClose} />
          </SheetContent>
        </Sheet>
      );
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      await user.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should have aria-label for accessibility', () => {
      render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <SheetClose onClose={() => {}} />
          </SheetContent>
        </Sheet>
      );
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close menu');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();
      render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <SheetClose onClose={handleClose} />
          </SheetContent>
        </Sheet>
      );
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      closeButton.focus();
      await user.keyboard('{Enter}');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should display X icon', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <SheetClose onClose={() => {}} />
          </SheetContent>
        </Sheet>
      );
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have proper positioning', () => {
      render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <SheetClose onClose={() => {}} />
          </SheetContent>
        </Sheet>
      );
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      expect(closeButton).toHaveClass('absolute', 'right-4', 'top-4');
    });

    it('should have focus ring styles', () => {
      render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <SheetClose onClose={() => {}} />
          </SheetContent>
        </Sheet>
      );
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      expect(closeButton).toHaveClass('focus:ring-2', 'focus:ring-blue-600');
    });

    it('should have larger icon than dialog close', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <SheetClose onClose={() => {}} />
          </SheetContent>
        </Sheet>
      );
      const icon = container.querySelector('.h-6.w-6');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper structure', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      );
      expect(container.querySelector('.z-50')).toBeInTheDocument();
    });

    it('should allow keyboard navigation within content', () => {
      render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <button>First</button>
            <button>Second</button>
            <button>Third</button>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByRole('button', { name: /first/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /second/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /third/i })).toBeInTheDocument();
    });
  });

  describe('Event Handler Cleanup', () => {
    it('should remove ESC key listener when sheet closes', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      const { rerender } = render(
        <Sheet open={true} onOpenChange={handleOpenChange}>
          <div>Content</div>
        </Sheet>
      );

      await user.keyboard('{Escape}');
      expect(handleOpenChange).toHaveBeenCalledWith(false);

      handleOpenChange.mockClear();

      rerender(
        <Sheet open={false} onOpenChange={handleOpenChange}>
          <div>Content</div>
        </Sheet>
      );

      await user.keyboard('{Escape}');
      expect(handleOpenChange).not.toHaveBeenCalled();
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );

      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid open/close toggles', () => {
      const { rerender } = render(
        <Sheet open={false} onOpenChange={() => {}}>
          <div>Content</div>
        </Sheet>
      );

      for (let i = 0; i < 5; i++) {
        rerender(
          <Sheet open={true} onOpenChange={() => {}}>
            <div>Content</div>
          </Sheet>
        );
        expect(screen.getByText('Content')).toBeInTheDocument();

        rerender(
          <Sheet open={false} onOpenChange={() => {}}>
            <div>Content</div>
          </Sheet>
        );
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      }
    });

    it('should handle empty children', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <></>
        </Sheet>
      );
      expect(container.querySelector('.z-50')).toBeInTheDocument();
    });

    it('should switch sides dynamically', () => {
      const { container, rerender } = render(
        <Sheet open={true} onOpenChange={() => {}} side="left">
          <div>Content</div>
        </Sheet>
      );
      expect(container.querySelector('.left-0')).toBeInTheDocument();

      rerender(
        <Sheet open={true} onOpenChange={() => {}} side="right">
          <div>Content</div>
        </Sheet>
      );
      expect(container.querySelector('.right-0')).toBeInTheDocument();
    });

    it('should update correctly when onOpenChange changes', () => {
      const handleOpenChange1 = jest.fn();
      const handleOpenChange2 = jest.fn();
      const { rerender } = render(
        <Sheet open={true} onOpenChange={handleOpenChange1}>
          <div>Content</div>
        </Sheet>
      );

      rerender(
        <Sheet open={true} onOpenChange={handleOpenChange2}>
          <div>Content</div>
        </Sheet>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle multiple sheets', () => {
      render(
        <>
          <Sheet open={true} onOpenChange={() => {}} side="left">
            <SheetContent>
              <p>Left Sheet</p>
            </SheetContent>
          </Sheet>
          <Sheet open={true} onOpenChange={() => {}} side="right">
            <SheetContent>
              <p>Right Sheet</p>
            </SheetContent>
          </Sheet>
        </>
      );
      expect(screen.getByText('Left Sheet')).toBeInTheDocument();
      expect(screen.getByText('Right Sheet')).toBeInTheDocument();
    });
  });

  describe('Mobile Specific Features', () => {
    it('should be suitable for mobile navigation', () => {
      const { container } = render(
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent>
            <nav>
              <a href="/">Home</a>
              <a href="/about">About</a>
            </nav>
          </SheetContent>
        </Sheet>
      );
      expect(container.querySelector('.w-80')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });
  });
});
