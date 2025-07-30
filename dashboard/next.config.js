/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/senso/:path*',
        destination: 'http://localhost:3000/api/senso/:path*',
      },
    ];
  },
}

module.exports = nextConfig