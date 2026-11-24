"use client";

import React, { useEffect, useState } from 'react';
import Table from '@/components/table/Table';
import Button from '@/components/button/Button';
import Dropdown from '@/components/dropdown/Dropdown';
import Search from '@/components/search/Search';
import Capsule from '@/components/capsule/Capsule';
import { AuditLog, AuditFilters, AuditQuery, LogPage, getAuditLogs, getAuditFilters } from '@/services/adminLogs';

const initialQuery: AuditQuery = { dateFrom: '', dateTo: '', userId: '', action: '', entityType: '', entityId: '', search: '', page: 1, pageSize: 50 };

export default function AuditLogsPage() {
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<LogPage<AuditLog> | null>(null);
  const [filters, setFilters] = useState<AuditFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterError, setFilterError] = useState('');
  const [reload, setReload] = useState(0);
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setFilterError('');
    getAuditFilters(controller.signal).then(value => {
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
    getAuditLogs(query, controller.signal).then(value => {
      if (!controller.signal.aborted) setData(value);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Не удалось загрузить журнал аудита.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [query, reload]);

  function changeFilter(key: keyof AuditQuery, value: string | number) {
    setQuery(current => ({ ...current, [key]: value, page: 1 }));
    setSelectedAudit(null);
  }

  const columns = [
    { header: 'Дата и время', accessor: (row: AuditLog) => new Date(row.timestamp).toLocaleString('ru-RU') },
    { header: 'Пользователь / Роль', accessor: (row: AuditLog) => <div>{row.user}<br /><Capsule variant="info">{row.role ?? '—'}</Capsule></div> },
    { header: 'Действие', accessor: (row: AuditLog) => row.actionLabel },
    { header: 'Сущность', accessor: (row: AuditLog) => <div>{row.entityTypeLabel}<br />{row.entity ?? row.entityId ?? '—'}</div> },
    { header: 'Причина', accessor: (row: AuditLog) => row.reason ?? '—' },
    { header: 'Детализация', accessor: (row: AuditLog) => <Button title="Подробнее" color="btn-blue" onClick={() => setSelectedAudit(row)} /> },
  ];

  return (
    <div className="main-container text">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <h1 className="text-bold" style={{ fontSize: 24, margin: 0 }}>Журнал аудита</h1>
        <Button title="Обновить" color="btn-blue" disabled={loading} onClick={() => setReload(value => value + 1)} />
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 24 }}>
        <div style={{ minWidth: 280, flex: 1 }}><Search hint="Пользователь, сущность, состояние, причина…" value={query.search} onChange={value => changeFilter('search', value)} size="large" /></div>
        <Dropdown label="Пользователь" options={[{ value: '', label: 'Все пользователи' }, ...(filters?.users ?? [])]} value={query.userId} onChange={value => changeFilter('userId', value)} />
        <Dropdown label="Действие" options={[{ value: '', label: 'Все действия' }, ...(filters?.actions ?? [])]} value={query.action} onChange={value => changeFilter('action', value)} />
        <Dropdown label="Тип сущности" options={[{ value: '', label: 'Все типы' }, ...(filters?.entityTypes ?? [])]} value={query.entityType} onChange={value => changeFilter('entityType', value)} />
        <label>ID сущности<input className="input-field" value={query.entityId} onChange={event => changeFilter('entityId', event.target.value)} /></label>
        <label>Дата с (МСК)<input className="input-field" type="date" value={query.dateFrom} onChange={event => changeFilter('dateFrom', event.target.value)} /></label>
        <label>Дата по (МСК)<input className="input-field" type="date" value={query.dateTo} onChange={event => changeFilter('dateTo', event.target.value)} /></label>
        <Dropdown label="Записей на странице" options={[25, 50, 100, 200].map(value => ({ value: String(value), label: String(value) }))} value={String(query.pageSize)} onChange={value => changeFilter('pageSize', Number(value))} />
      </div>
      {filterError && <p role="alert">Фильтры недоступны: {filterError}</p>}
      {error && <p role="alert" style={{ color: 'var(--accent-red-c)' }}>{error}</p>}
      {loading && <p role="status">Загрузка журнала аудита…</p>}
      {!loading && data && <>
        {data.items.length ? <Table columns={columns} data={data.items} /> : <p>Записи аудита не найдены.</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
          <Button title="Назад" color="btn-blue" disabled={data.page <= 1} onClick={() => setQuery(current => ({ ...current, page: data.page - 1 }))} />
          <span>Страница {data.page} из {Math.max(1, Math.ceil(data.total / data.pageSize))}; всего: {data.total}</span>
          <Button title="Вперёд" color="btn-blue" disabled={data.page * data.pageSize >= data.total} onClick={() => setQuery(current => ({ ...current, page: data.page + 1 }))} />
        </div>
      </>}
      {selectedAudit && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setSelectedAudit(null)}>
        <section role="dialog" aria-modal="true" aria-labelledby="audit-title" style={{ backgroundColor: 'var(--background-c)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }} onClick={event => event.stopPropagation()}>
          <h2 id="audit-title">Карточка аудита #{selectedAudit.id}</h2>
          <dl>
            {[
              ['Время', new Date(selectedAudit.timestamp).toLocaleString('ru-RU')],
              ['Пользователь', `${selectedAudit.user} (ID: ${selectedAudit.userId ?? '—'})`],
              ['Роль', selectedAudit.role], ['Действие', `${selectedAudit.actionLabel} (${selectedAudit.action})`],
              ['Тип сущности', `${selectedAudit.entityTypeLabel} (${selectedAudit.entityType})`],
              ['Сущность', selectedAudit.entity], ['ID сущности', selectedAudit.entityId],
              ['Состояние до', selectedAudit.previousState], ['Состояние после', selectedAudit.newState],
              ['Причина', selectedAudit.reason], ['IP-адрес', selectedAudit.ipAddress],
            ].map(([label, value]) => <div key={label} style={{ marginBottom: 12 }}><dt className="text-bold">{label}</dt><dd style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{value ?? '—'}</dd></div>)}
          </dl>
          <Button title="Закрыть" color="btn-blue" onClick={() => setSelectedAudit(null)} />
        </section>
      </div>}
    </div>
  );
}
