import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
            Frank Bria
          </Link>

          <nav className="flex gap-6 items-center">
            <Link href="/" className="text-gray-700 hover:text-gray-900">
              Home
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-gray-900">
              Blog
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
