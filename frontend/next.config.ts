/** @type {import('next').NextConfig} */
const nextConfig = {
  // Добавляем базовый путь
  basePath: '/csh',

  // Если нужно, чтобы статика тоже была с префиксом
  assetPrefix: '/csh',

  reactStrictMode: true,

  // Для продакшена
  output: 'standalone',

  // Перенаправления с корневых путей без /csh
  async redirects() {
    return [
      {
        source: '/',
        destination: '/csh',
        basePath: false,
        permanent: false,
      },
      {
        source: '/login',
        destination: '/csh/login',
        basePath: false,
        permanent: false,
      },
      {
        source: '/auth-redirect',
        destination: '/csh/auth-redirect',
        basePath: false,
        permanent: false,
      },
    ];
  },

  // Проксирование запросов к API бэкенда при локальной разработке
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'localhost:8000';
    const backendUrl = backend.startsWith('http') ? backend : `http://${backend}`;
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;