"use client";

import React, { useEffect, useState } from 'react';
import Table from '@/components/table/Table';
import Button from '@/components/button/Button';
import Dropdown from '@/components/dropdown/Dropdown';
import Search from '@/components/search/Search';
import Capsule from '@/components/capsule/Capsule';
import { TechLog, TechLogDetails, TechFilters, TechQuery, TechLogPage, getTechLogs, getTechFilters, getTechLog } from '@/services/adminLogs';

const initialQuery: TechQuery = { dateFrom: '', dateTo: '', level: '', service: '', traceId: '', search: '', page: 1, pageSize: 50 };

export default function TechLogsPage() {
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<TechLogPage | null>(null);
  const [filters, setFilters] = useState<TechFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterError, setFilterError] = useState('');
  const [reload, setReload] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TechLogDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailReload, setDetailReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setFilterError('');
    getTechFilters(controller.signal).then(value => {
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
    getTechLogs(query, controller.signal).then(value => {
      if (!controller.signal.aborted) setData(value);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Не удалось загрузить технические логи.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [query, reload]);

  useEffect(() => {
    if (selectedId === null) return;
    const controller = new AbortController();
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    getTechLog(selectedId, controller.signal).then(value => {
      if (!controller.signal.aborted) setDetail(value);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setDetailError(cause instanceof Error ? cause.message : 'Не удалось загрузить запись.');
    }).finally(() => {
      if (!controller.signal.aborted) setDetailLoading(false);
    });
    return () => controller.abort();
  }, [selectedId, detailReload]);

  function changeFilter(key: keyof TechQuery, value: string | number) {
    setQuery(current => ({ ...current, [key]: value, page: 1 }));
    setSelectedId(null);
  }

  const columns = [
    { header: 'Уровень', accessor: (row: TechLog) => <Capsule variant={row.level === 'error' ? 'danger' : row.level === 'warning' ? 'warning' : 'info'}>{row.level.toUpperCase()}</Capsule> },
    { header: 'Дата и время', accessor: (row: TechLog) => new Date(row.timestamp).toLocaleString('ru-RU') },
    { header: 'Сервис / Категория', accessor: (row: TechLog) => <div>{row.service}<br />{row.category}</div> },
    { header: 'Сообщение', accessor: (row: TechLog) => row.message },
    { header: 'Trace ID', accessor: (row: TechLog) => row.traceId ?? '—' },
    { header: 'Запрос', accessor: (row: TechLog) => `${row.requestMethod ?? ''} ${row.requestPath ?? '—'}` },
    { header: 'Диагностика', accessor: (row: TechLog) => <Button title={row.hasDetails ? 'Детали события' : 'Карточка события'} color="btn-blue" onClick={() => { setDetail(null); setDetailError(''); setDetailLoading(true); setSelectedId(row.id); }} /> },
  ];

  return (
    <div className="main-container text">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <h1 className="text-bold" style={{ fontSize: 24, margin: 0 }}>Технические логи</h1>
        <Button title="Обновить" color="btn-blue" disabled={loading} onClick={() => setReload(value => value + 1)} />
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 24 }}>
        <div style={{ minWidth: 280, flex: 1 }}><Search hint="Поиск по сообщению или категории…" value={query.search} onChange={value => changeFilter('search', value)} size="large" /></div>
        <Dropdown label="Уровень" options={[{ value: '', label: 'Все уровни' }, ...(filters?.levels ?? [])]} value={query.level} onChange={value => changeFilter('level', value)} />
        <Dropdown label="Сервис" options={[{ value: '', label: 'Все сервисы' }, ...(filters?.services ?? [])]} value={query.service} onChange={value => changeFilter('service', value)} />
        <label>Trace ID<input className="input-field" value={query.traceId} onChange={event => changeFilter('traceId', event.target.value)} /></label>
        <label>Дата с (МСК)<input className="input-field" type="date" value={query.dateFrom} onChange={event => changeFilter('dateFrom', event.target.value)} /></label>
        <label>Дата по (МСК)<input className="input-field" type="date" value={query.dateTo} onChange={event => changeFilter('dateTo', event.target.value)} /></label>
        <Dropdown label="Записей на странице" options={[25, 50, 100, 200].map(value => ({ value: String(value), label: String(value) }))} value={String(query.pageSize)} onChange={value => changeFilter('pageSize', Number(value))} />
      </div>
      {filterError && <p role="alert">Фильтры недоступны: {filterError}</p>}
      {error && <p role="alert" style={{ color: 'var(--accent-red-c)' }}>{error}</p>}
      {loading && <p role="status">Загрузка технических логов…</p>}
      {!loading && data && <>
        <p className="text text-blind">Количество по уровням для выбранного периода, сервиса, Trace ID и поиска (до фильтра по уровню):</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>{data.levelCounts.map(count => <Capsule key={count.value} variant={count.value === 'error' ? 'danger' : count.value === 'warning' ? 'warning' : 'info'}>{count.label}: {count.count}</Capsule>)}</div>
        {data.items.length ? <Table columns={columns} data={data.items} /> : <p>Технические логи не найдены.</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
          <Button title="Назад" color="btn-blue" disabled={data.page <= 1} onClick={() => setQuery(current => ({ ...current, page: data.page - 1 }))} />
          <span>Страница {data.page} из {Math.max(1, Math.ceil(data.total / data.pageSize))}; всего: {data.total}</span>
          <Button title="Вперёд" color="btn-blue" disabled={data.page * data.pageSize >= data.total} onClick={() => setQuery(current => ({ ...current, page: data.page + 1 }))} />
        </div>
      </>}
      {selectedId !== null && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setSelectedId(null)}>
        <section role="dialog" aria-modal="true" aria-labelledby="tech-title" style={{ backgroundColor: 'var(--background-c)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }} onClick={event => event.stopPropagation()}>
          <h2 id="tech-title">Диагностика события #{selectedId}</h2>
          {detailLoading && <p role="status">Загрузка записи…</p>}
          {detailError && <><p role="alert">{detailError}</p><Button title="Повторить" color="btn-blue" disabled={detailLoading} onClick={() => setDetailReload(value => value + 1)} /></>}
          {detail && <>
            <dl>{[
              ['Время', new Date(detail.timestamp).toLocaleString('ru-RU')], ['Уровень', detail.level],
              ['Сервис', detail.service], ['Категория', detail.category], ['Trace ID', detail.traceId],
              ['Метод запроса', detail.requestMethod], ['Путь запроса', detail.requestPath], ['Сообщение', detail.message],
            ].map(([label, value]) => <div key={label} style={{ marginBottom: 12 }}><dt className="text-bold">{label}</dt><dd style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{value ?? '—'}</dd></div>)}</dl>
            <h3>Стек вызовов / Детализация</h3>
            <pre style={{ backgroundColor: 'var(--background-inner-main-element-c)', padding: 16, borderRadius: 10, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detail.details ?? 'Дополнительные сведения отсутствуют.'}</pre>
          </>}
          <Button title="Закрыть" color="btn-blue" onClick={() => setSelectedId(null)} />
        </section>
      </div>}
    </div>
  );
}
