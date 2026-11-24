import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/csh',
  assetPrefix: '/csh',
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  output: 'standalone',

  async redirects() {
    const origin = process.env.PUBLIC_APP_ORIGIN?.replace(/\/$/, '');

    if (!origin) {
      return [];
    }

    return [
      {
        source: '/',
        destination: `${origin}/csh`,
        basePath: false,
        permanent: false,
      },
      {
        source: '/login',
        destination: `${origin}/csh/login`,
        basePath: false,
        permanent: false,
      },
      {
        source: '/auth-redirect',
        destination: `${origin}/csh/auth-redirect`,
        basePath: false,
        permanent: false,
      },
      {
        source: '/403',
        destination: `${origin}/csh/403`,
        basePath: false,
        permanent: false,
      },
    ];
  },

  async rewrites() {
    let backendUrl: string;

    if (process.env.NODE_ENV === 'development') {
      backendUrl =
        process.env.BACKEND_API_PROXY_URL ||
        'http://127.0.0.1:5134';
    } else {
      backendUrl =
        process.env.BACKEND_URL ||
        'http://api:8080';
    }

    if (!backendUrl.startsWith('http')) {
      backendUrl = `http://${backendUrl}`;
    }

    backendUrl = backendUrl.replace(/\/$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/csh/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
