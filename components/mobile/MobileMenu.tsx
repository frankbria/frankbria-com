/**
 * MobileMenu Component
 *
 * A mobile-responsive navigation menu that appears on smaller screens.
 * Uses a hamburger icon to open a slide-out Sheet component containing
 * navigation links and search functionality.
 *
 * Features:
 * - Hamburger button visible only on mobile (<768px)
 * - Slide-out menu from right side
 * - Navigation links (Home, Blog)
 * - Closes on link click, backdrop click, or ESC key
 * - Body scroll locking when open
 * - Keyboard accessible
 *
 * @module components/mobile/MobileMenu
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

/**
 * Interface for menu item structure
 */
interface MenuItem {
  href: string;
  label: string;
}

/**
 * Menu items configuration
 * Centralized list of navigation links displayed in the mobile menu
 */
const MENU_ITEMS: MenuItem[] = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
];

/**
 * MobileMenu Component
 *
 * Renders a hamburger menu button that opens a slide-out navigation panel
 * on mobile devices. The menu includes navigation links and automatically
 * closes when a link is clicked or the user presses ESC.
 *
 * @returns {JSX.Element} The mobile menu component
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  /**
   * Handles opening the menu
   */
  const handleOpen = () => setOpen(true);

  /**
   * Handles closing the menu
   */
  const handleClose = () => setOpen(false);

  /**
   * Handles link clicks - closes menu after navigation
   */
  const handleLinkClick = () => setOpen(false);

  return (
    <>
      {/* Hamburger Button - Visible only on mobile */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        className="md:hidden text-gray-300 hover:text-white"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" role="img" aria-hidden="true" />
      </Button>

      {/* Slide-out Menu Sheet */}
      <Sheet open={open} onOpenChange={setOpen} side="right">
        <SheetContent>
          <SheetClose onClose={handleClose} />
          <div className="flex flex-col gap-4 mt-16 px-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu</h2>
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className="text-gray-700 hover:text-gray-900 font-medium py-2 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
