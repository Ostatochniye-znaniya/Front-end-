import { api, setTokens, isAuthenticated as clientIsAuthenticated } from './client';
import { getUserFromCookie } from '@/services/userCookie';

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
    // Токены хранятся в HttpOnly Cookies
    return null;
};

export const getRefreshToken = (): string | null => {
    return null;
};

export const getUserId = (): string | null => {
    const user = getUserFromCookie();
    return (user?.id ?? user?.external_id ?? null) as string | null;
};

export const isAuthenticated = (): boolean => {
    return clientIsAuthenticated();
};