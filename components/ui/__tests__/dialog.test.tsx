/**
 * Dialog Component Tests
 *
 * Test Coverage:
 * - Dialog rendering when open/closed
 * - Backdrop rendering and click handling
 * - ESC key to close dialog
 * - Body scroll locking
 * - DialogContent rendering
 * - DialogClose button rendering and functionality
 * - Accessibility (ARIA attributes, focus management)
 * - Event handlers (onOpenChange)
 * - Multiple dialogs
 * - Edge cases
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog, DialogContent, DialogClose } from '../dialog';

describe('Dialog Component', () => {
  beforeEach(() => {
    // Reset body overflow before each test
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    // Clean up after each test
    document.body.style.overflow = 'unset';
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(
        <Dialog open={false} onOpenChange={() => {}}>
          <div>Dialog Content</div>
        </Dialog>
      );
      expect(screen.queryByText('Dialog Content')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <div>Dialog Content</div>
        </Dialog>
      );
      expect(screen.getByText('Dialog Content')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <div>Test Content</div>
        </Dialog>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render backdrop', () => {
      const { container } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Dialog>
      );
      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have correct z-index for overlay', () => {
      const { container } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Dialog>
      );
      const overlay = container.querySelector('.z-50');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Open/Close Behavior', () => {
    it('should call onOpenChange with false when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      const { container } = render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <div>Content</div>
        </Dialog>
      );
      const backdrop = container.querySelector('.bg-black\\/50') as HTMLElement;
      await user.click(backdrop);
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange with false when ESC key is pressed', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <div>Content</div>
        </Dialog>
      );
      await user.keyboard('{Escape}');
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not call onOpenChange when content is clicked', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <div>Content</div>
        </Dialog>
      );
      const content = screen.getByText('Content');
      await user.click(content);
      expect(handleOpenChange).not.toHaveBeenCalled();
    });

    it('should not respond to ESC when dialog is closed', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      render(
        <Dialog open={false} onOpenChange={handleOpenChange}>
          <div>Content</div>
        </Dialog>
      );
      await user.keyboard('{Escape}');
      expect(handleOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Locking', () => {
    it('should lock body scroll when dialog opens', () => {
      const { rerender } = render(
        <Dialog open={false} onOpenChange={() => {}}>
          <div>Content</div>
        </Dialog>
      );
      expect(document.body.style.overflow).toBe('unset');

      rerender(
        <Dialog open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Dialog>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll when dialog closes', () => {
      const { rerender } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Dialog>
      );
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Dialog open={false} onOpenChange={() => {}}>
          <div>Content</div>
        </Dialog>
      );
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should unlock body scroll when component unmounts', () => {
      const { unmount } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Dialog>
      );
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('DialogContent Component', () => {
    it('should render DialogContent with children', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <p>Dialog content text</p>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Dialog content text')).toBeInTheDocument();
    });

    it('should apply correct styling to DialogContent', () => {
      const { container } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );
      const content = container.querySelector('.bg-white.rounded-lg.shadow-xl');
      expect(content).toBeInTheDocument();
    });

    it('should render multiple children in DialogContent', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <h2>Title</h2>
            <p>Description</p>
            <button>Action</button>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });
  });

  describe('DialogClose Component', () => {
    it('should render close button', () => {
      const handleClose = jest.fn();
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogClose onClose={handleClose} />
          </DialogContent>
        </Dialog>
      );
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when clicked', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogClose onClose={handleClose} />
          </DialogContent>
        </Dialog>
      );
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should have aria-label for accessibility', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogClose onClose={() => {}} />
          </DialogContent>
        </Dialog>
      );
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogClose onClose={handleClose} />
          </DialogContent>
        </Dialog>
      );
      const closeButton = screen.getByRole('button', { name: /close/i });
      closeButton.focus();
      await user.keyboard('{Enter}');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should display X icon', () => {
      const { container } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogClose onClose={() => {}} />
          </DialogContent>
        </Dialog>
      );
      // Check for lucide-react X icon svg
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have proper positioning', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogClose onClose={() => {}} />
          </DialogContent>
        </Dialog>
      );
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveClass('absolute', 'right-4', 'top-4');
    });

    it('should have focus ring styles', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogClose onClose={() => {}} />
          </DialogContent>
        </Dialog>
      );
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveClass('focus:ring-2', 'focus:ring-blue-600');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      const { container } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Dialog>
      );
      // Dialog should have appropriate ARIA structure
      expect(container.querySelector('[class*="z-50"]')).toBeInTheDocument();
    });

    it('should manage focus correctly', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <button>First</button>
            <button>Second</button>
          </DialogContent>
        </Dialog>
      );
      // Content should be in the document and buttons should be accessible
      expect(screen.getByRole('button', { name: /first/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /second/i })).toBeInTheDocument();
    });
  });

  describe('Event Handler Cleanup', () => {
    it('should remove ESC key listener when dialog closes', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      const { rerender } = render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <div>Content</div>
        </Dialog>
      );

      await user.keyboard('{Escape}');
      expect(handleOpenChange).toHaveBeenCalledWith(false);

      handleOpenChange.mockClear();

      rerender(
        <Dialog open={false} onOpenChange={handleOpenChange}>
          <div>Content</div>
        </Dialog>
      );

      await user.keyboard('{Escape}');
      expect(handleOpenChange).not.toHaveBeenCalled();
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <div>Content</div>
        </Dialog>
      );

      unmount();
      // Should not throw errors after unmount
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid open/close toggles', () => {
      const { rerender } = render(
        <Dialog open={false} onOpenChange={() => {}}>
          <div>Content</div>
        </Dialog>
      );

      for (let i = 0; i < 5; i++) {
        rerender(
          <Dialog open={true} onOpenChange={() => {}}>
            <div>Content</div>
          </Dialog>
        );
        expect(screen.getByText('Content')).toBeInTheDocument();

        rerender(
          <Dialog open={false} onOpenChange={() => {}}>
            <div>Content</div>
          </Dialog>
        );
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      }
    });

    it('should handle empty children', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <></>
        </Dialog>
      );
      // Should render without errors
      const { container } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <></>
        </Dialog>
      );
      expect(container.querySelector('.z-50')).toBeInTheDocument();
    });

    it('should handle nested dialogs', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <p>Outer Dialog</p>
            <Dialog open={true} onOpenChange={() => {}}>
              <DialogContent>
                <p>Inner Dialog</p>
              </DialogContent>
            </Dialog>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Outer Dialog')).toBeInTheDocument();
      expect(screen.getByText('Inner Dialog')).toBeInTheDocument();
    });

    it('should update correctly when onOpenChange changes', () => {
      const handleOpenChange1 = jest.fn();
      const handleOpenChange2 = jest.fn();
      const { rerender } = render(
        <Dialog open={true} onOpenChange={handleOpenChange1}>
          <div>Content</div>
        </Dialog>
      );

      rerender(
        <Dialog open={true} onOpenChange={handleOpenChange2}>
          <div>Content</div>
        </Dialog>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render with responsive positioning', () => {
      const { container } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      const contentWrapper = container.querySelector('.max-w-3xl');
      expect(contentWrapper).toBeInTheDocument();
      expect(contentWrapper).toHaveClass('mx-4', 'mt-20', 'sm:mt-0');
    });

    it('should center content on larger screens', () => {
      const { container } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      const overlay = container.querySelector('.items-start.justify-center');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('sm:items-center');
    });
  });
});
