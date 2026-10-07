/**
 * Утилиты для работы с данными пользователя и ролями через Cookie.
 * 
 * Поддерживает работу:
 * - В клиентских компонентах (через document.cookie)
 * - В серверных компонентах/роутах (передачей cookieString из cookies() / req.headers)
 * - Реактивный хук useUserCookie() для компонентов страниц
 */

import { useState, useEffect, useCallback } from 'react';
import { UserMeResponse } from '@/api/types';

export const USER_COOKIE_NAME = 'user_data';
export const SESSION_COOKIE_NAME = 'is_authenticated';

/**
 * Роли, зафиксированные в базе данных системы (таблица `roles`):
 * 1 - 'Администратор'
 * 2 - 'Лицо, принимающее решения (ЛПР)'
 * 3 - 'Руководитель подразделения (заведующий кафедрой)'
 * 4 - 'Преподаватель'
 * 5 - 'Руководитель факультета / института'
 * 6 - 'Ответственный за подразделение'
 * 7 - 'Гость'
 */
export type SystemRole =
  | 'Администратор'
  | 'Лицо, принимающее решения (ЛПР)'
  | 'Лицо, принимающее решения'
  | 'ЛПР'
  | 'Руководитель подразделения (заведующий кафедрой)'
  | 'Заведующий кафедрой'
  | 'Преподаватель'
  | 'Руководитель факультета / института'
  | 'Ответственный за подразделение'
  | 'Гость'
  | 'Студент'
  | string;

export type RoleSlug =
  | 'admin'
  | 'lpr'
  | 'hod'
  | 'teacher'
  | 'rod'
  | 'guest'
  | 'student'
  | 'unknown';

export interface UserCookieData {
  id?: string | number;
  external_id?: string;
  name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  surname?: string;
  patronymic?: string;
  email?: string;
  role?: string;             // Основная роль (русскоязычное название, например 'Преподаватель')
  roleSlug?: RoleSlug;       // Кодовый слаг роли ('teacher', 'admin', 'hod' и др.)
  roles?: string[];          // Все роли пользователя из базы данных
  status_id?: number | null;
  status?: string;           // Статус (например 'Активен')
  faculty_id?: number | null;
  faculty?: string;          // Название факультета / института
}

/**
 * Словарь сопоставления строковых названий ролей из БД к нормализованным slug-кодам.
 */
const ROLE_TO_SLUG_MAP: Record<string, RoleSlug> = {
  // Администратор
  'администратор': 'admin',
  'admin': 'admin',
  'administrator': 'admin',

  // ЛПР
  'лицо, принимающее решения (лпр)': 'lpr',
  'лицо, принимающее решения': 'lpr',
  'лпр': 'lpr',
  'lpr': 'lpr',

  // Заведующий кафедрой / Руководитель подразделения
  'руководитель подразделения (заведующий кафедрой)': 'hod',
  'заведующий кафедрой': 'hod',
  'заведующий': 'hod',
  'hod': 'hod',
  'ответственный за подразделение': 'hod',

  // Преподаватель
  'преподаватель': 'teacher',
  'teacher': 'teacher',

  // Руководитель факультета / института
  'руководитель факультета / института': 'rod',
  'руководитель факультета': 'rod',
  'руководитель института': 'rod',
  'rod': 'rod',

  // Гость
  'гость': 'guest',
  'guest': 'guest',

  // Студент
  'студент': 'student',
  'student': 'student',
};

/**
 * Словарь нормализации slug-кода к читаемому названию.
 */
const SLUG_TO_ROLE_NAME: Record<RoleSlug, string> = {
  admin: 'Администратор',
  lpr: 'Лицо, принимающее решения (ЛПР)',
  hod: 'Руководитель подразделения (заведующий кафедрой)',
  teacher: 'Преподаватель',
  rod: 'Руководитель факультета / института',
  guest: 'Гость',
  student: 'Студент',
  unknown: 'Пользователь',
};

/**
 * Получить cookie по имени из строки или из document.cookie
 */
export function getCookie(name: string, cookieSource?: string): string | null {
  const source = cookieSource !== undefined
    ? cookieSource
    : (typeof document !== 'undefined' ? document.cookie : '');

  if (!source) return null;

  const matches = source.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return matches ? decodeURIComponent(matches[1]) : null;
}

/**
 * Установить cookie в браузере
 */
export function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Удалить cookie
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

/**
 * Установить cookie сессии (пользователь авторизован)
 */
export function setSessionCookie(days = 7): void {
  setCookie(SESSION_COOKIE_NAME, 'true', days);
}

/**
 * Очистить сессионные куки
 */
export function clearSessionCookie(): void {
  deleteCookie(SESSION_COOKIE_NAME);
  clearUserCookie();
}

/**
 * Проверить активна ли сессия пользователя по куки
 */
export function isSessionActive(cookieSource?: string): boolean {
  return getCookie(SESSION_COOKIE_NAME, cookieSource) === 'true' || !!getCookie(USER_COOKIE_NAME, cookieSource);
}

/**
 * Преобразовать строку роли в стандартизированный slug
 */
export function normalizeRoleSlug(roleName?: string | null): RoleSlug {
  if (!roleName) return 'unknown';
  const clean = roleName.trim().toLowerCase();
  return ROLE_TO_SLUG_MAP[clean] || 'unknown';
}

/**
 * Преобразовать slug в читаемое название роли
 */
export function getRoleNameBySlug(slug: RoleSlug): string {
  return SLUG_TO_ROLE_NAME[slug] || slug;
}

/**
 * Получить полные данные о пользователе из cookie.
 *
 * @param cookieSource Опциональная строка cookie (для Server Components: `(await cookies()).toString()`)
 */
export function getUserFromCookie(cookieSource?: string): UserCookieData | null {
  const rawCookie = getCookie(USER_COOKIE_NAME, cookieSource);

  if (rawCookie) {
    try {
      const data: UserCookieData = JSON.parse(rawCookie);
      // Гарантируем наличие roleSlug и role
      if (!data.roleSlug && data.role) {
        data.roleSlug = normalizeRoleSlug(data.role);
      } else if (!data.role && data.roles && data.roles.length > 0) {
        data.role = data.roles[0];
        data.roleSlug = normalizeRoleSlug(data.role);
      }
      return data;
    } catch (e) {
      console.warn('[userCookie] Ошибка разбора JSON из куки пользователя:', e);
    }
  }

  return null;
}

/**
 * Получить основную роль пользователя из cookie (на русском языке, например: 'Администратор', 'Преподаватель', 'Гость')
 */
export function getUserRole(cookieSource?: string): string | null {
  const user = getUserFromCookie(cookieSource);
  if (!user) return null;

  if (user.role) return user.role;
  if (user.roles && user.roles.length > 0) return user.roles[0];
  if (user.roleSlug && user.roleSlug !== 'unknown') return getRoleNameBySlug(user.roleSlug);

  return 'Гость';
}

/**
 * Получить кодовый слаг роли пользователя ('admin' | 'lpr' | 'hod' | 'teacher' | 'rod' | 'guest' | 'student' | 'unknown')
 */
export function getUserRoleSlug(cookieSource?: string): RoleSlug {
  const user = getUserFromCookie(cookieSource);
  if (!user) return 'unknown';

  if (user.roleSlug && user.roleSlug !== 'unknown') {
    return user.roleSlug;
  }

  const roleName = user.role || (user.roles && user.roles[0]) || '';
  return normalizeRoleSlug(roleName);
}

/**
 * Получить массив всех ролей пользователя из cookie
 */
export function getUserRoles(cookieSource?: string): string[] {
  const user = getUserFromCookie(cookieSource);
  if (!user) return [];

  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles;
  }

  if (user.role) {
    return [user.role];
  }

  return [];
}

/**
 * Проверить, обладает ли пользователь указанной ролью или хотя бы одной из указанных ролей.
 * Поддерживает как русские названия ('Администратор', 'Преподаватель'), так и кодовые слаги ('admin', 'teacher').
 *
 * Пример:
 * hasRole('admin')
 * hasRole(['Администратор', 'ЛПР'])
 * hasRole(['hod', 'teacher'])
 */
export function hasRole(requiredRoles: string | string[], cookieSource?: string): boolean {
  const user = getUserFromCookie(cookieSource);
  if (!user) return false;

  const userRoles = getUserRoles(cookieSource);
  const userSlug = getUserRoleSlug(cookieSource);

  const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return rolesToCheck.some((role) => {
    const targetSlug = normalizeRoleSlug(role);
    const targetClean = role.trim().toLowerCase();

    // 1. Проверка по слагу
    if (userSlug !== 'unknown' && targetSlug !== 'unknown' && userSlug === targetSlug) {
      return true;
    }

    // 2. Проверка по точному совпадению или частичному совпадению названий ролей в массиве
    return userRoles.some((userRole) => {
      const uClean = userRole.trim().toLowerCase();
      const uSlug = normalizeRoleSlug(uClean);
      return uClean === targetClean || (targetSlug !== 'unknown' && uSlug === targetSlug);
    });
  });
}

/**
 * Проверки конкретных ролей
 */
export function isAdmin(cookieSource?: string): boolean {
  return hasRole('admin', cookieSource);
}

export function isTeacher(cookieSource?: string): boolean {
  return hasRole('teacher', cookieSource);
}

export function isHod(cookieSource?: string): boolean {
  return hasRole('hod', cookieSource);
}

export function isLpr(cookieSource?: string): boolean {
  return hasRole('lpr', cookieSource);
}

export function isRod(cookieSource?: string): boolean {
  return hasRole('rod', cookieSource);
}

export function isGuest(cookieSource?: string): boolean {
  return hasRole('guest', cookieSource) || getUserRoleSlug(cookieSource) === 'guest';
}

export function isStudent(cookieSource?: string): boolean {
  return hasRole('student', cookieSource);
}

/**
 * Сохранить данные пользователя в cookie
 */
export function setUserCookie(userData: Partial<UserCookieData>, days = 7): void {
  const existing = getUserFromCookie() || {};
  const merged: UserCookieData = {
    ...existing,
    ...userData,
  };

  // Нормализуем роли
  if (!merged.role && merged.roles && merged.roles.length > 0) {
    merged.role = merged.roles[0];
  }
  if (!merged.roleSlug && merged.role) {
    merged.roleSlug = normalizeRoleSlug(merged.role);
  }

  setCookie(USER_COOKIE_NAME, JSON.stringify(merged), days);
}

/**
 * Очистить cookie с данными пользователя (например, при логауте)
 */
export function clearUserCookie(): void {
  deleteCookie(USER_COOKIE_NAME);
}

/**
 * Форматировать ответ /auth/me или профиля в UserCookieData
 */
export function formatUserCookieData(userData: UserMeResponse | any): UserCookieData {
  const roles: string[] = Array.isArray(userData.roles) && userData.roles.length > 0
    ? userData.roles
    : (userData.role ? [userData.role] : ['Гость']);

  const primaryRole = roles[0] || 'Гость';
  const roleSlug = normalizeRoleSlug(primaryRole);

  const fullName = userData.full_name || userData.name || [userData.surname, userData.first_name, userData.patronymic].filter(Boolean).join(' ') || '';

  return {
    id: userData.id,
    external_id: userData.external_id,
    name: userData.first_name || userData.name || fullName,
    full_name: fullName,
    first_name: userData.first_name,
    last_name: userData.last_name || userData.surname,
    surname: userData.surname || userData.last_name,
    patronymic: userData.patronymic,
    email: userData.email || userData.mail_box,
    role: primaryRole,
    roleSlug,
    roles,
    status_id: userData.status_id,
    status: userData.status,
    faculty_id: userData.faculty_id,
    faculty: userData.faculty,
  };
}

/**
 * Синхронизировать ответ от /auth/me в cookie
 */
export function syncUserCookie(userData: UserMeResponse | any, days = 7): UserCookieData {
  const formatted = formatUserCookieData(userData);
  setUserCookie(formatted, days);
  return formatted;
}

/**
 * React-хук для использования в клиентских компонентах страниц.
 * Автоматически подтягивает данные из cookie и предоставляет удобные методы для проверки ролей.
 * 
 * Пример использования:
 * ```tsx
 * const { user, role, roleSlug, isAdmin, isTeacher, hasRole } = useUserCookie();
 * if (isAdmin) return <AdminPanel />;
 * ```
 */
export function useUserCookie() {
  const [user, setUser] = useState<UserCookieData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    const data = getUserFromCookie();
    setUser(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const role = user?.role || (user?.roles?.[0]) || 'Гость';
  const roleSlug = user?.roleSlug || normalizeRoleSlug(role);
  const roles = user?.roles || (user?.role ? [user.role] : []);

  return {
    user,
    role,
    roleSlug,
    roles,
    isLoading,
    refresh,
    hasRole: (requiredRoles: string | string[]) => hasRole(requiredRoles),
    isAdmin: roleSlug === 'admin' || hasRole('admin'),
    isTeacher: roleSlug === 'teacher' || hasRole('teacher'),
    isHod: roleSlug === 'hod' || hasRole('hod'),
    isLpr: roleSlug === 'lpr' || hasRole('lpr'),
    isRod: roleSlug === 'rod' || hasRole('rod'),
    isGuest: roleSlug === 'guest' || hasRole('guest'),
    isStudent: roleSlug === 'student' || hasRole('student'),
  };
}
