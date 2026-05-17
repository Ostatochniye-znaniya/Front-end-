// api/user.ts
import { useState, useEffect } from 'react';
import { api } from "@/api/client";
import { UserMeResponse } from "@/api/types";
import { NEXT_PUBLIC_ADMIN_API_URL } from '@/config';

interface CachedUserData {
    data: UserMeResponse;
    timestamp: number;
}

const CACHE_KEY = 'user_data_cache';
const DEFAULT_CACHE_TTL = 60 * 60 * 1000; // 60 минут в миллисекундах

export async function getUserData(options?: {
    ttl?: number;
    forceRefresh?: boolean;
}): Promise<UserMeResponse> {
    const { ttl = DEFAULT_CACHE_TTL, forceRefresh = false } = options || {};
    const ttlMs = ttl;

    if (!forceRefresh && typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        
        if (cached) {
            try {
                const cachedData: CachedUserData = JSON.parse(cached);
                const now = Date.now();
                const isExpired = now - cachedData.timestamp > ttlMs;
                if (!isExpired) {
                    return cachedData.data;
                } else { }
            } catch (e) { }
        }
    }
    try {
        const userData = await api.get<UserMeResponse>('/users/me');
        if (typeof window !== 'undefined' && userData) {
            const cacheData: CachedUserData = {
                data: userData,
                timestamp: Date.now(),
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        }
        return userData;
    } catch (error) {
        throw error;
    }
}

export function clearUserDataCache(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(CACHE_KEY);
    }
}

export function getLastCacheTime(): number | null {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    try {
        const cachedData: CachedUserData = JSON.parse(cached);
        return cachedData.timestamp;
    } catch {
        return null;
    }
}

export function isCacheValid(ttlMinutes: number = 60): boolean {
    const lastTime = getLastCacheTime();
    if (!lastTime) return false;
    const now = Date.now();
    const ttlMs = ttlMinutes * 60 * 1000;
    return now - lastTime < ttlMs;
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