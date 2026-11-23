"use client";

import { useEffect, useRef, useState } from 'react';
import Table from '@/components/table/Table';
import Button from '@/components/button/Button';
import Dropdown from '@/components/dropdown/Dropdown';
import Search from '@/components/search/Search';
import Capsule from '@/components/capsule/Capsule';
import { adminRequest } from '@/services/adminRequest';
import { AdminUser, UserFilters, UserPage } from '@/services/adminUsers';

const initialQuery = { search: '', roleId: '', status: '', facultyId: '', departmentId: '', page: 1, pageSize: 25 };
const emptyForm = { name: '', email: '', roleId: '', departmentId: '', facultyId: '', reason: '' };
type UserAction = { kind: 'create' } | { kind: 'role' | 'status'; user: AdminUser };

export default function UsersAndRolesPage() {
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<UserPage | null>(null);
  const [filters, setFilters] = useState<UserFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterError, setFilterError] = useState('');
  const [reload, setReload] = useState(0);
  const [action, setAction] = useState<UserAction | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const [success, setSuccess] = useState('');
  const pending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setFilterError('');
    adminRequest<UserFilters>('/users/filters', { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setFilters(value);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setFilterError(cause instanceof Error ? cause.message : 'Не удалось загрузить фильтры.');
    });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setData(null);
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== '') params.set(key, String(value));
    });
    adminRequest<UserPage>(`/users?${params}`, { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setData(value);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Не удалось загрузить пользователей.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [query, reload]);

  function openAction(next: UserAction) {
    setAction(next);
    setForm({ ...emptyForm, roleId: next.kind === 'role' && next.user.roles.length === 1 ? String(next.user.roles[0].id) : '' });
    setMutationError('');
    setSuccess('');
  }

  async function submitAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action || pending.current) return;
    if (action.kind === 'role' && !form.roleId) { setMutationError('Выберите новую роль.'); return; }
    pending.current = true;
    setSaving(true);
    setMutationError('');
    try {
      let result: AdminUser;
      if (action.kind === 'create') {
        result = await adminRequest<AdminUser>('/users', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(), email: form.email.trim(),
            roleId: form.roleId ? Number(form.roleId) : null,
            departmentId: form.departmentId ? Number(form.departmentId) : null,
            facultyId: form.facultyId ? Number(form.facultyId) : null,
          }),
        });
      } else {
        result = await adminRequest<AdminUser>(`/users/${action.user.id}/${action.kind}`, {
          method: 'PATCH',
          body: JSON.stringify(action.kind === 'role'
            ? { roleId: Number(form.roleId), reason: form.reason.trim() || null }
            : { status: action.user.status === 'blocked' ? 'active' : 'blocked', reason: form.reason.trim() || null }),
        });
      }
      setSuccess(`Сервер сохранил изменения: ${result.name ?? result.email ?? result.id}; роль: ${result.role}; статус: ${result.statusLabel}.`);
      setAction(null);
      setReload(value => value + 1);
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : 'Не удалось сохранить изменения.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  const columns = [
    { header: 'Сотрудник', accessor: (row: AdminUser) => <div>{row.name ?? '—'}<br /><span className="text-blind">{row.email ?? '—'}</span></div> },
    { header: 'Подразделение', accessor: (row: AdminUser) => <div>{row.faculty ?? '—'}<br />{row.department ?? '—'}</div> },
    { header: 'Роль', accessor: (row: AdminUser) => row.role },
    { header: 'Статус', accessor: (row: AdminUser) => <Capsule variant={row.status === 'blocked' ? 'danger' : 'success'}>{row.statusLabel}</Capsule> },
    { header: 'Последний вход', accessor: (row: AdminUser) => row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('ru-RU') : 'Не авторизован' },
    { header: 'Действия', accessor: (row: AdminUser) => <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button title="Изменить роль" color="btn-blue" disabled={saving || !filters} onClick={() => openAction({ kind: 'role', user: row })} />
      <Button title={row.status === 'blocked' ? 'Активировать' : 'Заблокировать'} color={row.status === 'blocked' ? 'btn-green' : 'btn-red'} disabled={saving} onClick={() => openAction({ kind: 'status', user: row })} />
    </div> },
  ];

  return (
    <div className="main-container text">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <h1 className="text-bold" style={{ fontSize: 24, margin: 0 }}>Пользователи и роли</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button title="Обновить" color="btn-blue" disabled={loading || saving} onClick={() => setReload(value => value + 1)} />
          <Button title="Добавить пользователя" color="btn-blue" disabled={!filters || saving} onClick={() => openAction({ kind: 'create' })} />
        </div>
      </div>
      {success && <p role="status">{success}</p>}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 24 }}>
        <Search hint="Поиск по ФИО, email, подразделению..." value={query.search} onChange={value => setQuery(current => ({ ...current, search: value, page: 1 }))} size="large" />
        {([
          ['roleId', 'Роль', filters?.roles], ['status', 'Статус', filters?.statuses],
          ['facultyId', 'Факультет', filters?.faculties], ['departmentId', 'Кафедра', filters?.departments],
        ] as const).map(([key, label, options]) => <Dropdown key={key} label={label} options={[{ value: '', label: 'Все' }, ...(options ?? [])]} value={query[key]} onChange={value => setQuery(current => ({ ...current, [key]: value, page: 1 }))} />)}
      </div>
      {filterError && <p role="alert">Фильтры недоступны: {filterError}</p>}
      {error && <p role="alert" style={{ color: 'var(--accent-red-c)' }}>{error}</p>}
      {loading && <p role="status">Загрузка пользователей…</p>}
      {!loading && data && <>
        {data.items.length ? <div className="table-wrapper"><Table columns={columns} data={data.items} /></div> : <p>Пользователи не найдены.</p>}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 20 }}>
          <Button title="Назад" color="btn-blue" disabled={data.page <= 1} onClick={() => setQuery(current => ({ ...current, page: data.page - 1 }))} />
          <span>Страница {data.page} из {Math.max(1, Math.ceil(data.total / data.pageSize))}; всего: {data.total}</span>
          <Button title="Вперёд" color="btn-blue" disabled={data.page * data.pageSize >= data.total} onClick={() => setQuery(current => ({ ...current, page: data.page + 1 }))} />
        </div>
      </>}
      {action && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
        <form role="dialog" aria-modal="true" aria-labelledby="user-action-title" onSubmit={submitAction} style={{ backgroundColor: 'var(--background-c)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
          <h2 id="user-action-title">{action.kind === 'create' ? 'Добавление пользователя' : action.kind === 'role' ? 'Изменение роли' : action.user.status === 'blocked' ? 'Активация пользователя' : 'Блокировка пользователя'}</h2>
          {action.kind !== 'create' && <p>{action.user.name} — {action.user.email}</p>}
          {action.kind === 'role' && <p>Новая роль заменит все текущие роли: {action.user.role}.</p>}
          {mutationError && <p role="alert" style={{ color: 'var(--accent-red-c)' }}>{mutationError}</p>}
          <fieldset disabled={saving} style={{ border: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {action.kind === 'create' && <>
              <label>ФИО сотрудника<input className="input-field" required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></label>
              <label>Корпоративная почта<input className="input-field" type="email" required value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} /></label>
              <label>Факультет<select className="input-field" value={form.facultyId} onChange={event => setForm(current => ({ ...current, facultyId: event.target.value }))}>
                <option value="">Не указан</option>{filters?.faculties.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select></label>
              <label>Кафедра<select className="input-field" value={form.departmentId} onChange={event => setForm(current => ({ ...current, departmentId: event.target.value }))}>
                <option value="">Не указана</option>{filters?.departments.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select></label>
            </>}
            {action.kind !== 'status' && <label>{action.kind === 'role' ? 'Новая роль' : 'Назначаемая роль'}<select className="input-field" required={action.kind === 'role'} value={form.roleId} onChange={event => setForm(current => ({ ...current, roleId: event.target.value }))}>
              <option value="">{action.kind === 'role' ? 'Выберите роль' : 'Без роли'}</option>{filters?.roles.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select></label>}
            {action.kind !== 'create' && <label>Причина изменения (необязательно)<textarea className="input-field" rows={3} value={form.reason} onChange={event => setForm(current => ({ ...current, reason: event.target.value }))} /></label>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button title="Отмена" color="btn-red" onClick={() => setAction(null)} />
              <button className="btn btn-blue" type="submit">{saving ? 'Сохранение…' : 'Подтвердить изменение'}</button>
            </div>
          </fieldset>
        </form>
      </div>}
    </div>
  );
}
