"use client";
import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { getUserData } from '@/services/getUserData';
import { UserMeResponse } from '@/api/types';
import { getUserStatus, UserStatusResponse } from '@/services/getUserStatus';

interface UserContextValue {
  userData: UserMeResponse | null;
  userStatus: UserStatusResponse | null;
}

const UserContext = createContext<UserContextValue>({ userData: null, userStatus: null });

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Всегда null — сервер и клиент рендерят одинаково, нет hydration mismatch
  const [userData, setUserData] = useState<UserMeResponse | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatusResponse | null>(null);

  // useLayoutEffect: синхронно до отрисовки браузера — пользователь не видит пустоту
  useLayoutEffect(() => {
    try {
      const u = localStorage.getItem('navbar_user');
      const s = localStorage.getItem('navbar_status');
      if (u) setUserData(JSON.parse(u));
      if (s) setUserStatus(JSON.parse(s));
    } catch {}
  }, []);

  // Фоновое обновление с API (на страницах входа/редиректа без токена запрос не делаем)
  useEffect(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const isAuthPage = path.includes('/login') || path.includes('/auth-redirect');
    const hasToken = typeof window !== 'undefined' && (!!localStorage.getItem('access_token') || !!localStorage.getItem('isAuthenticated'));

    if (isAuthPage && !hasToken) return;

    (async () => {
      try {
        const data = await getUserData({ ttl: 60 });
        if (data) {
          setUserData(data);
          localStorage.setItem('navbar_user', JSON.stringify(data));
          const status = await getUserStatus();
          setUserStatus(status);
          localStorage.setItem('navbar_status', JSON.stringify(status));
        }
      } catch {
        // При 401 перехватчик в apiClient выполнит redirectToLogin
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
