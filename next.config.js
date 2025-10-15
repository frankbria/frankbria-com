/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '47.88.89.175',
      },
      {
        protocol: 'https',
        hostname: 'beta.frankbria.com',
      },
      {
        protocol: 'https',
        hostname: 'frankbria.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: 'http://localhost:1337/admin/:path*',
      },
    ];
  },
}

module.exports = nextConfig
