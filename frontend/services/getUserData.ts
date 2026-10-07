// services/getUserData.ts
import { useState, useEffect } from 'react';
import { api } from "@/api/client";
import { UserMeResponse } from "@/api/types";
import { NEXT_PUBLIC_ADMIN_API_URL } from '@/config';
import { getUserFromCookie, syncUserCookie, clearUserCookie } from './userCookie';

interface CachedUserData {
    data: UserMeResponse;
    timestamp: number;
}

let memoryCache: CachedUserData | null = null;
const DEFAULT_CACHE_TTL = 60 * 60 * 1000; // 60 минут в миллисекундах

export async function getUserData(options?: {
    ttl?: number;
    forceRefresh?: boolean;
}): Promise<UserMeResponse> {
    const { ttl = DEFAULT_CACHE_TTL, forceRefresh = false } = options || {};
    const now = Date.now();

    if (!forceRefresh) {
        if (memoryCache && now - memoryCache.timestamp < ttl) {
            return memoryCache.data;
        }

        const cookieUser = getUserFromCookie();
        if (cookieUser && cookieUser.id) {
            memoryCache = {
                data: cookieUser as unknown as UserMeResponse,
                timestamp: now,
            };
            return memoryCache.data;
        }
    }

    try {
        let userData: UserMeResponse;
        try {
            userData = await api.get<UserMeResponse>('/auth/me');
        } catch {
            userData = await api.get<UserMeResponse>('/users/me');
        }

        if (userData) {
            memoryCache = {
                data: userData,
                timestamp: Date.now(),
            };
            syncUserCookie(userData);
            // Чистим любые устаревшие данные из localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user_data_cache');
                localStorage.removeItem('navbar_user');
                localStorage.removeItem('navbar_status');
            }
        }
        return userData;
    } catch (error) {
        throw error;
    }
}

export function clearUserDataCache(): void {
    memoryCache = null;
    clearUserCookie();
    if (typeof window !== 'undefined') {
        localStorage.removeItem('user_data_cache');
        localStorage.removeItem('navbar_user');
        localStorage.removeItem('navbar_status');
    }
}

export function getLastCacheTime(): number | null {
    return memoryCache ? memoryCache.timestamp : null;
}

export function isCacheValid(ttlMinutes: number = 60): boolean {
    const lastTime = getLastCacheTime();
    if (!lastTime) return false;
    const now = Date.now();
    return now - lastTime < ttlMinutes * 60 * 1000;
}

export function useUserData(options?: {
    ttl?: number;
    autoFetch?: boolean;
}) {
    const { ttl = 60, autoFetch = true } = options || {};
    const [userData, setUserData] = useState<UserMeResponse | null>(null);
    const [loading, setLoading] = useState(autoFetch);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUserData({ ttl: ttl * 60 * 1000, forceRefresh });
            setUserData(data);
            return data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, [autoFetch, ttl]);

    return {
        userData,
        loading,
        error,
        refetch: () => fetchData(true),
        clearCache: clearUserDataCache,
        isCacheValid: () => isCacheValid(ttl),
    };
}

export async function getServerUserData(accessToken: string): Promise<UserMeResponse> {
    const API_URL = NEXT_PUBLIC_ADMIN_API_URL;
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}