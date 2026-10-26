
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Базовый путь приложения
  basePath: '/csh',

  // Префикс для статических ресурсов
  assetPrefix: '/csh',

  reactStrictMode: true,

  // Разрешаем открывать dev-сервер по 127.0.0.1, иначе HMR блокируется и страница не гидратируется
  allowedDevOrigins: ['127.0.0.1', 'localhost'],

  // Сборка для Docker
  output: 'standalone',

  // Перенаправления с корневых путей без /csh
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

  // Проксирование запросов к API бэкенда
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

    // Добавляем протокол, если он отсутствует
    if (!backendUrl.startsWith('http')) {
      backendUrl = `http://${backendUrl}`;
    }

    // Убираем завершающий слеш
    backendUrl = backendUrl.replace(/\/$/, '');

    return [
      {
        // С учётом basePath запрос будет /csh/api/:path*
        source: '/api/:path*',

        // ASP.NET Core API
        destination: `${backendUrl}/csh/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
