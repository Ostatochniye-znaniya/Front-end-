/** @type {import('next').NextConfig} */
const nextConfig = {
    // Добавляем базовый путь
  basePath: '/csh',
  
  // Если нужно, чтобы статика тоже была с префиксом
  assetPrefix: '/csh',
  
  reactStrictMode: true,
  
  // Для продакшена
  output: 'standalone',

  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];

    const backendOrigin = process.env.BACKEND_API_PROXY_URL || 'http://127.0.0.1:5134';
    return [
      {
        source: '/csh/api/:path*',
        destination: `${backendOrigin}/csh/api/:path*`,
        basePath: false,
      },
    ];
  },
}

module.exports = nextConfig