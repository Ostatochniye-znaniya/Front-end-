"use client";

import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Table from '@/components/table/Table';
import Button from '@/components/button/Button';
import Input from '@/components/input/Input';
import Dropdown from '@/components/dropdown/Dropdown';
import Alert from '@/components/alert/Alert';
import { initialUsers, UserItem } from '@/components/admin/mockData';

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
      title: 'Предварительная регистрация выполнена (п. 7.4 ТЗ)',
      text: `Пользователь ${newEmail} успешно привязан к роли «${newRole}». Роль активируется автоматически при первой SSO-авторизации.`
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
      title: isDeactivating ? 'Мягкая деактивация пользователя (п. 7.5 ТЗ)' : 'Пользователь снова активирован',
      text: isDeactivating
        ? `Пользователь ${user.name} переведён в статус «Деактивирован». Все созданные им отчеты и ведомости сохранены в истории системы.`
        : `Доступ для ${user.name} восстановлен.`
    });
  };

  const renderRoleBadge = (role: UserItem['role']) => {
    let color = 'var(--accent-blue-c)';
    let bg = 'var(--accent-blue-bg-c)';

    if (role === 'Администратор') {
      color = 'var(--accent-purple-c)';
      bg = 'var(--accent-purple-bg-c)';
    } else if (role === 'ЛПР') {
      color = 'var(--accent-green-c)';
      bg = 'var(--accent-green-bg-c)';
    } else if (role.includes('Заведующий')) {
      color = 'var(--accent-orange-c)';
      bg = 'var(--accent-orange-bg-c)';
    } else if (role === 'Гость / Без роли') {
      color = 'var(--secondary-lock-font-c)';
      bg = 'var(--secondary-divider-bg-c)';
    }

    return (
      <span style={{
        padding: '3px 8px',
        borderRadius: '6px',
        backgroundColor: bg,
        color: color,
        fontWeight: 600,
        fontSize: '12px'
      }}>
        {role}
      </span>
    );
  };

  const renderStatusBadge = (status: UserItem['status']) => {
    if (status === 'active') {
      return (
        <span style={{ color: 'var(--accent-green-c)', fontWeight: 600, fontSize: '12px' }}>
          ● Активен
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span style={{ color: 'var(--accent-orange-c)', fontWeight: 600, fontSize: '12px' }}>
          ⏳ Ожидает входа
        </span>
      );
    }
    return (
      <span style={{ color: 'var(--accent-red-c)', fontWeight: 600, fontSize: '12px' }}>
        ✖ Деактивирован
      </span>
    );
  };

  const columns = [
    {
      header: 'Сотрудник',
      accessor: (row: UserItem) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--secondary-font-c)', fontSize: '13px' }}>
            {row.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--secondary-lock-font-c)', fontFamily: 'monospace' }}>
            {row.email}
          </div>
        </div>
      ),
      sortFn: (a: UserItem, b: UserItem) => a.name.localeCompare(b.name)
    },
    {
      header: 'Подразделение / Кафедра',
      accessor: (row: UserItem) => (
        <span style={{ fontSize: '13px', color: 'var(--secondary-font-c)' }}>
          {row.department}
        </span>
      ),
      sortFn: (a: UserItem, b: UserItem) => a.department.localeCompare(b.department)
    },
    {
      header: 'Назначенная роль (RBAC)',
      accessor: (row: UserItem) => renderRoleBadge(row.role)
    },
    {
      header: 'Статус доступа',
      accessor: (row: UserItem) => renderStatusBadge(row.status)
    },
    {
      header: 'Последний вход',
      accessor: (row: UserItem) => (
        <span style={{ fontSize: '12px', color: 'var(--secondary-lock-font-c)', fontFamily: 'monospace' }}>
          {row.lastLogin}
        </span>
      )
    },
    {
      header: 'Управление доступом',
      accessor: (row: UserItem) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setRoleChangeUser(row);
              setSelectedNewRole(row.role);
            }}
            style={{
              background: 'none',
              border: '1px solid var(--secondary-border-c)',
              color: 'var(--secondary-link-c, #6d86e4)',
              padding: '5px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            Сменить роль
          </button>
          <button
            onClick={() => handleToggleDeactivate(row)}
            title={row.status === 'deactivated' ? 'Восстановить доступ' : 'Мягкая деактивация без удаления истории'}
            style={{
              background: 'none',
              border: `1px solid ${row.status === 'deactivated' ? 'var(--accent-green-c)' : 'var(--accent-red-c)'}`,
              color: row.status === 'deactivated' ? 'var(--accent-green-c)' : 'var(--accent-red-c)',
              padding: '5px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            {row.status === 'deactivated' ? 'Активировать' : 'Деактивировать'}
          </button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout
      title="Роли, разрешения и пользователи"
      subtitle="Модель разграничения доступа RBAC. Предварительное назначение ролей до первой авторизации через корпоративную почту и мягкая деактивация сотрудников без удаления аудита."
      actions={
        <Button
          title="+ Предварительно добавить по email"
          color="btn-blue"
          onClick={() => setIsPreRegisterOpen(true)}
        />
      }
    >
      {alertInfo && (
        <div style={{ marginBottom: '20px' }}>
          <Alert
            type={alertInfo.type}
            title={alertInfo.title}
            text={alertInfo.text}
          />
        </div>
      )}

      {/* Метрики пользователей */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Всего учетных записей</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-blue-c)', marginTop: '4px' }}>
            {users.length}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Активных преподавателей и ЛПР</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-green-c)', marginTop: '4px' }}>
            {users.filter(u => u.status === 'active' && u.role !== 'Гость / Без роли').length}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Ожидают первого входа (предрегистрация)</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-orange-c)', marginTop: '4px' }}>
            {users.filter(u => u.status === 'pending').length}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Сохранённых в аудите (деактивированных)</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--secondary-lock-font-c)', marginTop: '4px' }}>
            {users.filter(u => u.status === 'deactivated').length}
          </div>
        </div>
      </div>

      {/* Панель фильтрации */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'flex-end',
        backgroundColor: 'var(--background-main-element-c)',
        border: '1px solid var(--secondary-border-c)',
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '20px'
      }}>
        <div style={{ flex: '1 1 260px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--secondary-lock-font-c)' }}>
            Поиск по ФИО, email или кафедре
          </label>
          <Input
            hint="Например: Иванов, mospolytech.ru, кафедра..."
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
          />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--secondary-lock-font-c)' }}>
            Роль в системе
          </label>
          <Dropdown
            options={roleOptions}
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            placeholder="Все роли"
          />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--secondary-lock-font-c)' }}>
            Статус активности
          </label>
          <Dropdown
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            placeholder="Все статусы"
          />
        </div>

        <div style={{ paddingBottom: '4px', fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>
          Найдено: <strong style={{ color: 'var(--secondary-font-c)' }}>{filteredUsers.length}</strong>
        </div>
      </div>

      {/* Таблица пользователей */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <Table columns={columns} data={filteredUsers} />
      </div>

      {/* Модалка предварительной регистрации по email (п. 7.4 ТЗ) */}
      {isPreRegisterOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--background-main-element-c)',
            border: '1px solid var(--secondary-border-c)',
            borderRadius: '12px',
            maxWidth: '540px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--secondary-font-c)' }}>
              Предварительное назначение роли (до первого входа)
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--secondary-lock-font-c)', lineHeight: '1.4' }}>
              В соответствии с п. 7.4 ТЗ, укажите корпоративную почту преподавателя или руководителя. При первом входе система автоматически применит назначенную роль.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '4px' }}>
                Корпоративный Email (@mospolytech.ru) <span style={{ color: 'var(--accent-red-c)' }}>*</span>
              </label>
              <Input
                hint="example@mospolytech.ru"
                value={newEmail}
                onChange={(val) => setNewEmail(val)}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '4px' }}>
                ФИО сотрудника <span style={{ color: 'var(--accent-red-c)' }}>*</span>
              </label>
              <Input
                hint="Иванов Иван Иванович"
                value={newName}
                onChange={(val) => setNewName(val)}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '4px' }}>
                Кафедра / Подразделение
              </label>
              <Input
                hint="Кафедра Информационных технологий"
                value={newDepartment}
                onChange={(val) => setNewDepartment(val)}
              />
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '4px' }}>
                Назначаемая роль
              </label>
              <Dropdown
                options={roleOptions.filter(o => o.value !== 'all')}
                value={newRole}
                onChange={(val) => setNewRole(val as UserItem['role'])}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                title="Отмена"
                color="btn-red"
                onClick={() => setIsPreRegisterOpen(false)}
              />
              <Button
                title="Предварительно создать"
                color="btn-blue"
                onClick={handlePreRegister}
              />
            </div>
          </div>
        </div>
      )}

      {/* Модалка смены роли */}
      {roleChangeUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--background-main-element-c)',
            border: '1px solid var(--secondary-border-c)',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--secondary-font-c)' }}>
              Изменение роли пользователя
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>
              Сотрудник: <strong>{roleChangeUser.name}</strong> ({roleChangeUser.email})
            </p>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '6px' }}>
                Выберите новую роль:
              </label>
              <Dropdown
                options={roleOptions.filter(o => o.value !== 'all')}
                value={selectedNewRole}
                onChange={(val) => setSelectedNewRole(val as UserItem['role'])}
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
    </AdminLayout>
  );
}
