"use client";
import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { getUserData } from '@/services/getUserData';
import { UserMeResponse } from '@/api/types';
import { getUserStatus, UserStatusResponse } from '@/services/getUserStatus';
import { getUserFromCookie } from '@/services/userCookie';
import { isAuthenticated } from '@/api/client';

interface UserContextValue {
  userData: UserMeResponse | null;
  userStatus: UserStatusResponse | null;
}

const UserContext = createContext<UserContextValue>({ userData: null, userStatus: null });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserMeResponse | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatusResponse | null>(null);

  // useLayoutEffect: синхронно читаем данные из Cookie до отрисовки
  useLayoutEffect(() => {
    try {
      const u = getUserFromCookie();
      if (u) {
        setUserData(u as unknown as UserMeResponse);
        if (u.role || u.roleSlug) {
          setUserStatus({
            status: u.roleSlug || 'guest',
            verbose: u.role || 'Гость',
          });
        }
      }
    } catch {}
  }, []);

  // Фоновое обновление с API (на страницах входа/редиректа без сессии запрос не делаем)
  useEffect(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const isAuthPage = path.includes('/login') || path.includes('/auth-redirect');
    const hasSession = typeof window !== 'undefined' && isAuthenticated();

    if (isAuthPage || !hasSession) return;

    (async () => {
      try {
        const data = await getUserData({ ttl: 60 });
        if (data) {
          setUserData(data);
          const status = await getUserStatus();
          setUserStatus(status);
        }
      } catch {
        // При 401 перехватчик в apiClient выполнит redirectToLoginPage
      }
    })();
  }, []);

  return (
    <UserContext.Provider value={{ userData, userStatus }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
