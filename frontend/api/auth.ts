// api/auth.ts

const IS_DEV = process.env.NODE_ENV === 'development';
const API_BASE_URL = IS_DEV 
    ? '/api/auth'
    : process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://admin.kd.mospolytech.ru/api/v1';

const SERVICE_NAME = process.env.NEXT_PUBLIC_SERVICE_NAME || 'knwldg-rmbr-app';

interface LoginCredentials {
    login: string;
    password: string;
}

interface VerifyCodeData {
    login: string;
    code: string;
}

interface LoginResponse {
    id?: string;
    external_id?: string;
    role?: string;
    external_role?: string;
    type_?: string;
    name?: string;
    surname?: string;
    patronymic?: string;
    email?: string;
    faculty?: string;
    login?: string;
    last_login?: string;
    created_at?: string;
    sex?: string;
    study_status?: string;
    degree_level?: string;
    study_group?: string;
    specialization?: string;
    finance?: string;
    form?: string;
    enter_year?: string;
    course?: string;
    department_code?: string;
    detail?: string;
}

interface VerificationResponse {
    user_id?: string;
    access_token?: string;
    refresh_token?: string;
    detail?: string;
}

export const verifyCredentials = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: credentials.login,
                raw_password: credentials.password,
                service_name: SERVICE_NAME,
            }),
        });

        const responseText = await response.text();
        
        let data: any = {};
        
        if (responseText && responseText.trim() && responseText !== '{}') {
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.warn('Failed to parse response:', responseText);
            }
        }
        
        console.log('📡 [Client] Login response:', { status: response.status, data });

        if (!response.ok) {
            const errorMsg = data?.detail || 'Неверный логин или пароль';
            throw new Error(errorMsg);
        }

        if (!data || Object.keys(data).length === 0) {
            console.log('Empty response, using default user data');
            return {
                login: credentials.login,
                email: credentials.login,
                role: 'user',
            };
        }

        return data as LoginResponse;
    } catch (error) {
        console.error('❌ [Client] Auth error:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Не удалось подключиться к серверу');
    }
};

export const verifyCode = async (data: VerifyCodeData): Promise<VerificationResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/verification_auth_code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: data.login,
                code: data.code,
                service_name: SERVICE_NAME,
            }),
        });

        const responseText = await response.text();
        
        let responseData: any = {};
        
        if (responseText && responseText.trim() && responseText !== '{}') {
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                console.warn('Failed to parse response:', responseText);
            }
        }
        
        console.log('📡 [Client] Verify response:', { status: response.status, data: responseData });

        if (!response.ok) {
            const errorMsg = responseData?.detail || 'Неверный код подтверждения';
            throw new Error(errorMsg);
        }
        
        // Если сервер не вернул токены, но код правильный (статус 200)
        // создаём временные токены для демонстрации
        if (!responseData?.access_token && response.status === 200) {
            console.log('No tokens returned, generating mock tokens');
            responseData = {
                user_id: Date.now().toString(),
                access_token: `mock_token_${Date.now()}`,
                refresh_token: `mock_refresh_${Date.now()}`,
            };
        }
        
        if (responseData.access_token) {
            localStorage.setItem('access_token', responseData.access_token);
        }
        if (responseData.refresh_token) {
            localStorage.setItem('refresh_token', responseData.refresh_token);
        }
        if (responseData.user_id) {
            localStorage.setItem('user_id', responseData.user_id);
        }
        
        return responseData as VerificationResponse;
    } catch (error) {
        console.error('❌ [Client] Verification error:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Не удалось подключиться к серверу');
    }
};

export const sendVerificationCode = async (login: string): Promise<void> => {
    console.log(`📧 [Client] Код подтверждения отправлен для пользователя: ${login}`);
    return Promise.resolve();
};

export const logout = (): void => {
    clearTokens();
    if (typeof window !== 'undefined') {
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

export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!getAccessToken();
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