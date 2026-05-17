// api/user.ts
import { useState, useEffect } from 'react';
import { api } from "@/api/client";
import { UserMeResponse } from "@/api/types";

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
                    console.log('📦 [getUserData] Using cached data');
                    return cachedData.data;
                } else {
                    console.log('🕐 [getUserData] Cache expired, fetching fresh data');
                }
            } catch (e) {
                console.warn('Failed to parse cached user data:', e);
            }
        }
    }

    try {
        console.log('🌐 [getUserData] Fetching fresh data from API');
        const userData = await api.get<UserMeResponse>('/users/me');
        
        if (typeof window !== 'undefined' && userData) {
            const cacheData: CachedUserData = {
                data: userData,
                timestamp: Date.now(),
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            console.log('💾 [getUserData] Data cached');
        }
        
        return userData;
    } catch (error) {
        console.error('❌ [getUserData] Error fetching user data:', error);
        throw error;
    }
}

export function clearUserDataCache(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(CACHE_KEY);
        console.log('🗑️ [getUserData] Cache cleared');
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
    const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://admin.kd.mospolytech.ru/api/v1';
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
        console.error('Failed to fetch user data on server:', error);
        throw error;
    }
}