import { LoginCredentials, LoginResponse, VerifyCodeData, VerificationResponse } from './types';
import { api, setTokens, clearTokens, isAuthenticated as clientIsAuthenticated } from './client';

const SERVICE_NAME = process.env.NEXT_PUBLIC_SERVICE_NAME || 'knwldg_rmbr_app';

export const verifyCredentials = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
        const data = await api.post<LoginResponse>('/users/login', {
            login: credentials.login,
            raw_password: credentials.password,
            service_name: SERVICE_NAME,
        });
        if (!data || Object.keys(data).length === 0) {
            return {
                login: credentials.login,
                email: credentials.login,
                role: 'user',
            };
        }
        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Не удалось подключиться к серверу');
    }
};

export const verifyCode = async (data: VerifyCodeData): Promise<VerificationResponse> => {
    try {
        const responseData = await api.post<VerificationResponse>('/users/verification_auth_code', {
            login: data.login,
            code: data.code,
            service_name: SERVICE_NAME,
        });
        let finalData = responseData;
        if (!responseData?.access_token) {
            finalData = {
                user_id: Date.now().toString(),
                access_token: `mock_token_${Date.now()}`,
                refresh_token: `mock_refresh_${Date.now()}`,
                ...responseData,
            };
        }
        if (finalData.access_token && finalData.refresh_token) {
            setTokens(finalData.access_token, finalData.refresh_token);
        }
        if (finalData.user_id) {
            localStorage.setItem('user_id', finalData.user_id);
        }
        return finalData;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Не удалось подключиться к серверу');
    }
};

export const sendVerificationCode = async (login: string): Promise<void> => {
    return Promise.resolve();
};

export const logout = (router?: any): void => {
    clearTokens();
    if (router) {
        router.push('/csh/login');
    } else if (typeof window !== 'undefined') {
        window.location.href = '/csh/login';
    }
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

export const setUserData = (login: string, userData?: LoginResponse): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('userLogin', login);
    localStorage.setItem('isAuthenticated', 'true');
    if (userData) {
        if (userData.role) localStorage.setItem('userRole', userData.role);
        if (userData.name || userData.surname) {
            const fullName = `${userData.surname || ''} ${userData.name || ''} ${userData.patronymic || ''}`.trim();
            if (fullName) localStorage.setItem('userName', fullName);
        }
        if (userData.email) localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userData', JSON.stringify(userData));
    } else {
        // Если нет данных, сохраняем хотя бы логин
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userName', login);
        localStorage.setItem('userEmail', login);
    }
};

export const getUserData = () => {
    if (typeof window === 'undefined') return null;
    return {
        login: localStorage.getItem('userLogin'),
        role: localStorage.getItem('userRole'),
        name: localStorage.getItem('userName'),
        email: localStorage.getItem('userEmail'),
        isAuthenticated: isAuthenticated(),
    };
};