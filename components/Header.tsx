import Link from 'next/link';
import Image from 'next/image';
// import { SearchDialog } from './search/SearchDialog'; // Disabled until Strapi permissions configured
import { MobileMenu } from './mobile/MobileMenu';

export default function Header() {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="https://beta.frankbria.com/uploads/2015/12/logo_back_clipped_rev_1-e1572167361317.png"
              alt="Frank Bria"
              width={272}
              height={103}
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
              Blog
            </Link>
            {/* <SearchDialog /> */}
          </nav>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            {/* <SearchDialog /> */}
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
