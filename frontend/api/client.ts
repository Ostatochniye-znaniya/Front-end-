import { FetchOptions } from './types';

const REDIRECT_KEY = 'auth_redirect_url';
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
let globalRouter: any = null;

const IS_DEV = process.env.NEXT_PUBLIC_NODE_ENV === 'development';

const getApiBaseUrl = (): string => {
  return IS_DEV
    ? '/api/auth'
    : process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://admin.kd.mospolytech.ru/api/v1';
};

const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
};

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('userLogin');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userData');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
};

export const saveRedirectUrl = (): void => {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname + window.location.search;
    if (!currentPath.includes('/login') && 
        !currentPath.includes('/csh/login') && 
        !currentPath.includes('/api/auth')) {
      localStorage.setItem(REDIRECT_KEY, currentPath);
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

export const redirectToLogin = (router?: any): void => {
  saveRedirectUrl();
  const loginPath = '/csh/login';
  if (router) {
    router.push(loginPath);
  } else if (typeof window !== 'undefined') {
    window.location.href = loginPath;
  }
};

export const redirectAfterLogin = (router?: any, defaultPath: string = '/'): void => {
  let redirectUrl = getAndClearRedirectUrl();
  let targetPath = redirectUrl || defaultPath;
  if (targetPath.startsWith('/csh')) {
    targetPath = targetPath.replace(/^\/csh/, '') || '/';
  }
  if (router) {
    router.push(targetPath);
  } else if (typeof window !== 'undefined') {
    window.location.href = targetPath;
  }
};

export const setGlobalRouter = (router: any) => {
  globalRouter = router;
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hasToken = !!getAccessToken();
  return hasToken;
};

export const logout = (router?: any): void => {
  clearTokens();
  if (router) {
    router.push('/csh/login');
  } else if (typeof window !== 'undefined') {
    window.location.href = '/csh/login';
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
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) {
    return null;
  }
  try {
    const url = `${getApiBaseUrl()}/users/refresh`;   
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshTokenValue }),
    });
    if (!response.ok) {
      throw new Error('Refresh failed');
    }
    const data = await response.json();
    if (data.access_token) {
      setTokens(data.access_token, data.refresh_token || refreshTokenValue);
      return data.access_token;
    }
    return null;
  } catch (error) {
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

export async function apiClient<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options;
  const url = `${getApiBaseUrl()}${endpoint}`;
  let accessToken = skipAuth ? null : getAccessToken();
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
      headers,
    });
  };
  try {
    let response = await makeRequest(accessToken);
    if (response.status === 403 && !skipAuth) {
      if (!skipRefresh && getRefreshToken()) {
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
      redirectToLogin(globalRouter);
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
    } catch (e) {
      return responseText as T;
    }
  } catch (error) {
    throw error;
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};