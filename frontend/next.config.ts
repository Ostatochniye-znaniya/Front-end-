const backendHost = process.env.BACKEND_URL || '127.0.0.1:5001';
const backendBase = /^https?:\/\//.test(backendHost) ? backendHost : `http://${backendHost}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/csh',
  assetPrefix: '/csh',
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/Statistics/:action',
        destination: `${backendBase}/Statistics/:action`,
      },
    ];
  },
};

module.exports = nextConfig;