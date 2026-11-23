import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config';

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyAdmin(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const base = /^https?:\/\//.test(BACKEND_URL) ? BACKEND_URL : `http://${BACKEND_URL}`;
  const target = `${base.replace(/\/$/, '')}/admin/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const name of ['authorization', 'cookie', 'content-type']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' ? undefined : await request.text(),
      cache: 'no-store',
      redirect: 'manual',
      signal: request.signal,
    });
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Бэкенд администратора недоступен. Проверьте BACKEND_URL и запуск API.' },
      { status: 502 }
    );
  }
}

export { proxyAdmin as GET, proxyAdmin as POST, proxyAdmin as PATCH, proxyAdmin as PUT };
