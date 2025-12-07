/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Viewport',
            value: 'width=1200, viewport-fit=cover'
          }
        ]
      }
    ];
  },
  allowedDevOrigins: [
    'https://*.replit.dev',
    'https://*.replit.app',
  ]
};

module.exports = nextConfig;
