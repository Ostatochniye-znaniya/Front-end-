"use client";

import React, { useState, useMemo } from 'react';
import Table from '@/components/table/Table';
import Button from '@/components/button/Button';
import Input from '@/components/input/Input';
import Dropdown from '@/components/dropdown/Dropdown';
import Search from '@/components/search/Search';
import Capsule from '@/components/capsule/Capsule';
import Alert from '@/components/alert/Alert';
import { initialUsers, UserItem } from '@/components/admin/mockData';
import { UserPlus, Shield, UserCheck } from 'lucide-react';

export default function UsersAndRolesPage() {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Модалка предварительной регистрации (п. 7.4 ТЗ)
  const [isPreRegisterOpen, setIsPreRegisterOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newRole, setNewRole] = useState<UserItem['role']>('Преподаватель');

  // Модалка смены роли
  const [roleChangeUser, setRoleChangeUser] = useState<UserItem | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserItem['role']>('Преподаватель');

  const [alertInfo, setAlertInfo] = useState<{ title: string; text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const roleOptions = [
    { value: 'all', label: 'Все роли' },
    { value: 'Администратор', label: 'Администратор' },
    { value: 'ЛПР', label: 'ЛПР' },
    { value: 'Заведующий кафедрой', label: 'Заведующий кафедрой' },
    { value: 'Заместитель заведующего кафедрой', label: 'Зам. зав. кафедрой' },
    { value: 'Преподаватель', label: 'Преподаватель' },
    { value: 'Гость / Без роли', label: 'Гость / Без роли' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Все статусы' },
    { value: 'active', label: 'Активен' },
    { value: 'pending', label: 'Ожидает первой авторизации' },
    { value: 'deactivated', label: 'Деактивирован' }
  ];

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesDept = u.department.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDept) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const handlePreRegister = () => {
    if (!newEmail.trim() || !newName.trim()) {
      alert("Укажите корпоративный email и ФИО сотрудника!");
      return;
    }

    const newUser: UserItem = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      name: newName,
      email: newEmail,
      department: newDepartment || 'Кафедра Информационных технологий',
      role: newRole,
      permissions: ['schedule:view'],
      status: 'pending',
      lastLogin: 'Не авторизован'
    };

    setUsers(prev => [newUser, ...prev]);
    setAlertInfo({
      type: 'success',
      title: 'Пользователь успешно добавлен',
      text: `Пользователь ${newEmail} привязан к роли «${newRole}».`
    });

    setIsPreRegisterOpen(false);
    setNewEmail('');
    setNewName('');
    setNewDepartment('');
    setNewRole('Преподаватель');
  };

  const handleChangeRole = () => {
    if (!roleChangeUser) return;

    setUsers(prev => prev.map(u => {
      if (u.id === roleChangeUser.id) {
        return {
          ...u,
          role: selectedNewRole
        };
      }
      return u;
    }));

    setAlertInfo({
      type: 'info',
      title: 'Роль пользователя успешно изменена',
      text: `Для ${roleChangeUser.name} установлена роль «${selectedNewRole}». Изменение зафиксировано в журнале аудита.`
    });

    setRoleChangeUser(null);
  };

  const handleToggleDeactivate = (user: UserItem) => {
    const isDeactivating = user.status !== 'deactivated';
    setUsers(prev => prev.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          status: isDeactivating ? 'deactivated' : 'active'
        };
      }
      return u;
    }));

    setAlertInfo({
      type: isDeactivating ? 'warning' : 'success',
      title: isDeactivating ? 'Пользователь деактивирован' : 'Пользователь активирован',
      text: isDeactivating
        ? `Пользователь ${user.name} деактивирован.`
        : `Доступ для ${user.name} восстановлен.`
    });
  };

  const columns = [
    {
      header: 'Сотрудник',
      accessor: (row: UserItem) => (
        <div style={{ textAlign: 'left' }}>
          <div className="text-bold">{row.name}</div>
          <div className="text text-blind" style={{ fontSize: '12px' }}>
            {row.email}
          </div>
        </div>
      ),
      sortFn: (a: UserItem, b: UserItem) => a.name.localeCompare(b.name)
    },
    {
      header: 'Подразделение / Кафедра',
      accessor: (row: UserItem) => (
        <span className="text">{row.department}</span>
      ),
      sortFn: (a: UserItem, b: UserItem) => a.department.localeCompare(b.department)
    },
    {
      header: 'Назначенная роль (RBAC)',
      accessor: (row: UserItem) => {
        let variant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
        if (row.role === 'Администратор') variant = 'info';
        else if (row.role === 'ЛПР') variant = 'success';
        else if (row.role.includes('Заведующий')) variant = 'warning';

        return (
          <Capsule variant={variant}>
            {row.role}
          </Capsule>
        );
      }
    },
    {
      header: 'Статус доступа',
      accessor: (row: UserItem) => {
        let variant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
        let label = 'Неизвестно';
        if (row.status === 'active') {
          variant = 'success';
          label = 'Активен';
        } else if (row.status === 'pending') {
          variant = 'warning';
          label = 'Ожидает входа';
        } else if (row.status === 'deactivated') {
          variant = 'danger';
          label = 'Деактивирован';
        }
        return (
          <Capsule variant={variant}>
            {label}
          </Capsule>
        );
      }
    },
    {
      header: 'Последний вход',
      accessor: (row: UserItem) => (
        <span className="text text-blind" style={{ fontSize: '12px' }}>
          {row.lastLogin}
        </span>
      )
    },
    {
      header: 'Управление доступом',
      accessor: (row: UserItem) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <Button
            title="Сменить роль"
            color="btn-blue"
            onClick={() => {
              setRoleChangeUser(row);
              setSelectedNewRole(row.role);
            }}
          />
          <Button
            title={row.status === 'deactivated' ? 'Активировать' : 'Деактивировать'}
            color={row.status === 'deactivated' ? 'btn-green' : 'btn-red'}
            onClick={() => handleToggleDeactivate(row)}
          />
        </div>
      )
    }
  ];

  return (
    <div className="main-container">
      {/* Заголовок страницы с кнопкой действия */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-bold" style={{ fontSize: '24px', margin: 0 }}>
            Пользователи и роли
          </h1>
        </div>
        <Button
          title="Добавить пользователя"
          color="btn-blue"
          onClick={() => setIsPreRegisterOpen(true)}
        />
      </div>

      {alertInfo && (
        <div style={{ marginBottom: '24px' }}>
          <Alert
            type={alertInfo.type}
            title={alertInfo.title}
            text={alertInfo.text}
          />
        </div>
      )}

      {/* Панель поиска и фильтрации */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <Search
            hint="Поиск по ФИО, email, подразделению..."
            value={searchQuery}
            onChange={setSearchQuery}
            size="large"
          />
        </div>
        <div style={{ width: '220px' }}>
          <Dropdown
            label="Роль"
            options={roleOptions}
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="Все роли"
          />
        </div>
        <div style={{ width: '220px' }}>
          <Dropdown
            label="Статус"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Все статусы"
          />
        </div>
      </div>

      {/* Таблица пользователей */}
      <div className="table-wrapper">
        <Table columns={columns} data={filteredUsers} />
      </div>

      {/* Модальное окно предварительной регистрации (п. 7.4 ТЗ) */}
      {isPreRegisterOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setIsPreRegisterOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--background-c)',
              borderRadius: '16px',
              border: '1px solid var(--secondary-border-c)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
              padding: '28px',
              maxWidth: '540px',
              width: '100%'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <UserPlus size={20} color="var(--accent-blue-c)" />
              <h2 className="title text-bold" style={{ fontSize: '18px', margin: 0 }}>
                Добавление пользователя
              </h2>
            </div>

            <p className="text text-blind" style={{ fontSize: '13px', margin: '0 0 18px 0' }}>
              Назначение роли и подразделения сотруднику по корпоративной почте.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label className="text text-bold" style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>
                  Корпоративная почта (@mospolytech.ru):
                </label>
                <Input
                  hint="i.i.ivanov@mospolytech.ru"
                  value={newEmail}
                  onChange={setNewEmail}
                />
              </div>

              <div>
                <label className="text text-bold" style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>
                  ФИО сотрудника:
                </label>
                <Input
                  hint="Иванов Иван Иванович"
                  value={newName}
                  onChange={setNewName}
                />
              </div>

              <div>
                <label className="text text-bold" style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>
                  Подразделение / Кафедра:
                </label>
                <Input
                  hint="Кафедра Информационных технологий"
                  value={newDepartment}
                  onChange={setNewDepartment}
                />
              </div>

              <div>
                <Dropdown
                  label="Назначаемая роль"
                  options={roleOptions.filter(r => r.value !== 'all')}
                  value={newRole}
                  onChange={(val) => setNewRole(val as UserItem['role'])}
                  placeholder="Выберите роль"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                title="Отмена"
                color="btn-red"
                onClick={() => setIsPreRegisterOpen(false)}
              />
              <Button
                title="Создать привязку"
                color="btn-blue"
                onClick={handlePreRegister}
              />
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно изменения роли */}
      {roleChangeUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setRoleChangeUser(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--background-c)',
              borderRadius: '16px',
              border: '1px solid var(--secondary-border-c)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
              padding: '28px',
              maxWidth: '480px',
              width: '100%'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Shield size={20} color="var(--accent-blue-c)" />
              <h2 className="title text-bold" style={{ fontSize: '18px', margin: 0 }}>
                Изменение роли пользователя
              </h2>
            </div>

            <p className="text text-blind" style={{ fontSize: '13px', margin: '0 0 18px 0', lineHeight: '1.4' }}>
              Сотрудник: <strong>{roleChangeUser.name}</strong> ({roleChangeUser.email})<br />
              Текущая роль: <strong>{roleChangeUser.role}</strong>
            </p>

            <div style={{ marginBottom: '20px' }}>
              <Dropdown
                label="Новая роль"
                options={roleOptions.filter(r => r.value !== 'all')}
                value={selectedNewRole}
                onChange={(val) => setSelectedNewRole(val as UserItem['role'])}
                placeholder="Выберите роль"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                title="Отмена"
                color="btn-red"
                onClick={() => setRoleChangeUser(null)}
              />
              <Button
                title="Сохранить роль"
                color="btn-blue"
                onClick={handleChangeRole}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
