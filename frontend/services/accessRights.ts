import { apiClient } from '@/api/client';

export interface RoleItem {
  id: number;
  roleName: string;
}

export interface UserRoleItem {
  roleId: number;
  roleName: string;
}

export interface UserAccessItem {
  id: number;
  name: string;
  email: string;
  facultyId?: number | null;
  facultyName?: string | null;
  position?: string;
  roles: UserRoleItem[];
}

export async function fetchRoles(): Promise<RoleItem[]> {
  try {
    const roles = await apiClient<RoleItem[]>('/Role/GetRoles');
    if (Array.isArray(roles) && roles.length > 0) {
      return roles;
    }
  } catch (err) {
    console.error('Ошибка получения списка ролей:', err);
  }

  // Запасной список системных ролей если бэкенд временно недоступен
  return [
    { id: 1, roleName: 'Администратор' },
    { id: 2, roleName: 'Лицо, принимающее решения (ЛПР)' },
    { id: 3, roleName: 'Руководитель подразделения (заведующий кафедрой)' },
    { id: 4, roleName: 'Преподаватель' },
    { id: 5, roleName: 'Руководитель факультета / института' },
    { id: 6, roleName: 'Ответственный за подразделение' },
    { id: 7, roleName: 'Гость' },
  ];
}

export async function fetchUsersAccessList(): Promise<UserAccessItem[]> {
  try {
    const users = await apiClient<UserAccessItem[]>('/User/GetUserAccessList');
    if (Array.isArray(users) && users.length > 0) {
      return users;
    }
  } catch (err) {
    console.error('Ошибка получения пользователей из API:', err);
  }

  return [];
}

export async function saveUserRoles(userId: number, roleIds: number[]): Promise<boolean> {
  try {
    const res = await apiClient<{ success?: boolean }>('/User/SetUserRoles', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        roleIds,
      }),
    });
    return !!res?.success;
  } catch (err) {
    console.error('Ошибка сохранения ролей пользователя:', err);
    throw err;
  }
}
