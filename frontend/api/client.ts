import { FetchOptions } from './types';
import {
  NEXT_PUBLIC_ADMIN_AUTH_BASE,
  NEXT_PUBLIC_SERVICE_NAME,
} from '@/config';
import {
  setSessionCookie,
  clearSessionCookie,
  isSessionActive,
} from '@/services/userCookie';

const REDIRECT_KEY = 'auth_redirect_url';
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
export type NavigationRouter = {
  push?: (path: string) => void;
  replace?: (path: string) => void;
};

let globalRouter: NavigationRouter | null = null;

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '/csh/api';
  }
  const backend = process.env.BACKEND_URL || 'localhost:5001';
  return backend.startsWith('http') ? backend : `http://${backend}`;
};

export const getAccessToken = (): string | null => {
  // Токены хранятся исключительно в cookies браузера
  return null;
};

export const getRefreshToken = (): string | null => {
  return null;
};

export const setTokens = (_accessToken?: string, _refreshToken?: string): void => {
  if (typeof window !== 'undefined') {
    // Вся сессия хранится в cookies
    setSessionCookie();
    // Удаляем любые остаточные токены из localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user_id');
  }
};

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  clearSessionCookie();
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('userLogin');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userData');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('navbar_user');
  localStorage.removeItem('navbar_status');
  localStorage.removeItem('user_data_cache');
};

export const saveRedirectUrl = (url?: string): void => {
  if (typeof window !== 'undefined') {
    const target = url || (window.location.pathname + window.location.search);
    if (
      !target.includes('/login') &&
      !target.includes('/auth-redirect')
    ) {
      localStorage.setItem(REDIRECT_KEY, target);
    }
  }
};

export const getAndClearRedirectUrl = (): string | null => {
  if (typeof window !== 'undefined') {
    const redirectUrl = localStorage.getItem(REDIRECT_KEY);
    localStorage.removeItem(REDIRECT_KEY);
    return redirectUrl;
  }
  return null;
};

export const clearRedirectUrl = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(REDIRECT_KEY);
  }
};

export const redirectToLoginPage = (router?: { push?: (path: string) => void; replace?: (path: string) => void } | null): void => {
  if (typeof window === 'undefined') return;

  const pathname = window.location.pathname;
  if (pathname.includes('/login') || pathname.includes('/auth-redirect')) {
    return;
  }

  saveRedirectUrl();

  const r = router || globalRouter;
  if (r?.replace) {
    r.replace('/login');
  } else if (r?.push) {
    r.push('/login');
  } else {
    window.location.replace('/csh/login');
  }
};

/**
 * Перенаправление на страницу входа через сторонний сервис авторизации (ЕУЗ / Admin API).
 */
export const redirectToLogin = (_router?: { push: (path: string) => void } | null): void => {
  if (typeof window === 'undefined') return;

  const pathname = window.location.pathname;
  if (pathname.includes('/auth-redirect')) {
    return;
  }

  saveRedirectUrl();

  const currentUrl = window.location.href;
  const savedUrl = localStorage.getItem(REDIRECT_KEY);
  const searchParams = new URLSearchParams(window.location.search);
  const queryReturnUrl = searchParams.get('return_url') || searchParams.get('return_to');

  let targetReturnUrl = queryReturnUrl || savedUrl;
  if (targetReturnUrl && (targetReturnUrl.includes('/login') || targetReturnUrl.includes('/auth-redirect'))) {
    targetReturnUrl = null;
  }

  let effectiveReturnUrl = currentUrl;
  if (pathname.includes('/login') || pathname === '/csh' || pathname === '/csh/') {
    if (targetReturnUrl) {
      effectiveReturnUrl = targetReturnUrl.startsWith('http')
        ? targetReturnUrl
        : `${window.location.origin}${targetReturnUrl.startsWith('/') ? '' : '/'}${targetReturnUrl}`;
    } else {
      effectiveReturnUrl = `${window.location.origin}/csh`;
    }
  }

  const returnUrl = encodeURIComponent(
    `${window.location.origin}/csh/auth-redirect?return_url=${encodeURIComponent(effectiveReturnUrl)}`
  );
  const target = `${NEXT_PUBLIC_ADMIN_AUTH_BASE}/auth?service_name=${NEXT_PUBLIC_SERVICE_NAME}&return_url=${returnUrl}`;

  console.log("Redirecting to external auth:", target);
  window.location.replace(target);
};

export const redirectAfterLogin = (router?: { push: (path: string) => void } | null, defaultPath: string = '/'): void => {
  const redirectUrl = getAndClearRedirectUrl();
  let targetPath = redirectUrl || defaultPath;
  if (targetPath.startsWith('/csh')) {
    targetPath = targetPath.replace(/^\/csh/, '') || '/';
  }
  if (router) {
    router.push(targetPath);
  } else if (typeof window !== 'undefined') {
    window.location.href = targetPath.startsWith('/') ? `/csh${targetPath}` : `/csh/${targetPath}`;
  }
};

export const setGlobalRouter = (router: NavigationRouter | null) => {
  globalRouter = router;
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return isSessionActive();
};

export const logout = async (router?: { push?: (path: string) => void; replace?: (path: string) => void } | null): Promise<void> => {
  try {
    await fetch('/csh/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearTokens();
    const r = router || globalRouter;
    if (r?.replace) {
      r.replace('/login');
    } else if (r?.push) {
      r.push('/login');
    } else if (typeof window !== 'undefined') {
      window.location.replace('/csh/login');
    }
  }
};

const onRefreshed = (token: string): void => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

const subscribeToRefresh = (cb: (token: string) => void): void => {
  refreshSubscribers.push(cb);
};

const refreshToken = async (): Promise<string | null> => {
  try {
    const url = `${getApiBaseUrl()}/auth/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      throw new Error('Refresh failed');
    }
    const data = await response.json();
    setSessionCookie();
    return data.access_token || 'ok';
  } catch {
    return null;
  }
};

const parseError = async (response: Response): Promise<{ message: string; status: number }> => {
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return {
        message: `HTTP ${response.status}`,
        status: response.status,
      };
    }
    const data = JSON.parse(text);
    return {
      message: data.detail || data.message || `HTTP ${response.status}`,
      status: response.status,
    };
  } catch {
    return {
      message: `HTTP ${response.status}`,
      status: response.status,
    };
  }
};

const buildRequestUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const base = getApiBaseUrl();
  if (endpoint.startsWith(base)) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
};

export async function apiClient<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options;
  const url = buildRequestUrl(endpoint);
  const accessToken = skipAuth ? null : getAccessToken();

  const makeRequest = async (token: string | null): Promise<Response> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };
    if (token && !skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, {
      ...fetchOptions,
      credentials: 'include',
      headers,
    });
  };

  try {
    const response = await makeRequest(accessToken);
    if ((response.status === 401 || response.status === 403) && !skipAuth) {
      if (!skipRefresh && isSessionActive()) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeToRefresh(async (newToken: string) => {
              try {
                const retryResponse = await makeRequest(newToken);
                if (!retryResponse.ok) {
                  const error = await parseError(retryResponse);
                  reject(new Error(error.message));
                  return;
                }
                const text = await retryResponse.text();
                if (!text || text.trim() === '' || text === '{}') {
                  resolve({} as T);
                  return;
                }
                resolve(JSON.parse(text));
              } catch (err) {
                reject(err);
              }
            });
          });
        }
        isRefreshing = true;
        const newToken = await refreshToken();
        isRefreshing = false;
        if (newToken) {
          onRefreshed(newToken);
          const retryResponse = await makeRequest(newToken);
          if (!retryResponse.ok) {
            const error = await parseError(retryResponse);
            throw new Error(error.message);
          }
          const text = await retryResponse.text();
          if (!text || text.trim() === '' || text === '{}') {
            return {} as T;
          }
          return JSON.parse(text);
        }
      }

      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isAuthPage = path.includes('/auth-redirect') || path.includes('/login');
        if (!isAuthPage) {
          console.warn("Сессия истекла или отсутствует. Редирект на страницу входа.");
          clearTokens();
          saveRedirectUrl();
          redirectToLoginPage(globalRouter);
        }
      }
      throw new Error('Сессия истекла. Пожалуйста, войдите заново.');
    }

    if (!response.ok) {
      const errorData = await parseError(response);
      throw new Error(errorData.message);
    }
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '' || responseText.trim() === '{}') {
      return {} as T;
    }
    try {
      return JSON.parse(responseText);
    } catch {
      return responseText as T;
    }
  } catch (error) {
    throw error;
  }
}

export const api = {
  get: <T = unknown>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};