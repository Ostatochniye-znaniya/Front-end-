import { api, setTokens, isAuthenticated as clientIsAuthenticated } from './client';

export { redirectToLogin, redirectToLoginPage, logout } from './client';

export const handleAuthCallback = async (access: string, refresh: string) => {
    const data = await api.post<{ ok: boolean; user_id?: string }>('/auth/callback', {
        access,
        refresh,
    });
    setTokens(access, refresh);
    return data;
};

export const getAccessToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
};

export const getUserId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('user_id');
};

export const isAuthenticated = (): boolean => {
    return clientIsAuthenticated();
};