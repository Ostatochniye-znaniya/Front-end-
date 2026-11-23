"use client";

import { useEffect, useRef, useState } from 'react';
import Table from '@/components/table/Table';
import Button from '@/components/button/Button';
import Dropdown from '@/components/dropdown/Dropdown';
import Search from '@/components/search/Search';
import Capsule from '@/components/capsule/Capsule';
import { adminRequest } from '@/services/adminRequest';
import { ProcessFilters, ProcessItem, ProcessPage } from '@/services/adminProcesses';

const initialQuery = { search: '', approvalStatus: '', stage: '', reportStatus: '', semesterId: '', facultyId: '', departmentId: '', page: 1, pageSize: 25 };
type ProcessAction = { kind: 'reschedule' | 'rollback'; process: ProcessItem };

export default function ProcessesPage() {
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<ProcessPage | null>(null);
  const [filters, setFilters] = useState<ProcessFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterError, setFilterError] = useState('');
  const [reload, setReload] = useState(0);
  const [action, setAction] = useState<ProcessAction | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const [success, setSuccess] = useState('');
  const pending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setFilterError('');
    adminRequest<ProcessFilters>('/processes/filters', { signal: controller.signal }).then(value => {
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
    adminRequest<ProcessPage>(`/processes?${params}`, { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setData(value);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Не удалось загрузить процессы.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [query, reload]);

  function openAction(kind: ProcessAction['kind'], process: ProcessItem) {
    setAction({ kind, process });
    setDate(process.scheduledDate ?? '');
    setTime(process.scheduledTime?.slice(0, 5) ?? '');
    setReason('');
    setMutationError('');
    setSuccess('');
  }

  async function submitAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action || pending.current) return;
    if (!reason.trim()) { setMutationError('Укажите причину изменения.'); return; }
    pending.current = true;
    setSaving(true);
    setMutationError('');
    try {
      const result = await adminRequest<ProcessItem>(`/processes/${action.process.id}/${action.kind}`, {
        method: 'POST',
        body: JSON.stringify(action.kind === 'reschedule' ? { date, time, reason: reason.trim() } : { comment: reason.trim() }),
      });
      setSuccess(action.kind === 'reschedule'
        ? `Сервер сохранил перенос: ${result.groupName ?? result.id}, ${result.scheduledDate} ${result.scheduledTime?.slice(0, 5)}.`
        : `Сервер подтвердил откат: ${result.groupName ?? result.id}, этап «${result.stageLabel}».`);
      setAction(null);
      setReload(value => value + 1);
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : 'Не удалось изменить процесс.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  const columns = [
    { header: 'Группа', accessor: (row: ProcessItem) => row.groupName ?? '—' },
    { header: 'Дисциплина / Кафедра', accessor: (row: ProcessItem) => <div>{row.disciplineName ?? '—'}<br /><span className="text-blind">{row.departmentName ?? '—'}</span></div> },
    { header: 'Преподаватель', accessor: (row: ProcessItem) => row.teacherNames || 'Не назначен' },
    { header: 'Дата и время', accessor: (row: ProcessItem) => <div>{row.scheduledDate ?? 'Не назначена'}<br />{row.scheduledTime?.slice(0, 5)}</div> },
    { header: 'Согласование / Этап', accessor: (row: ProcessItem) => <div><Capsule variant={row.approvalStatus === 'approved' ? 'success' : 'warning'}>{row.approvalStatusLabel}</Capsule><br />{row.stageLabel}{row.isLocked && <span> · Заблокирован</span>}</div> },
    { header: 'Отчёт кафедры', accessor: (row: ProcessItem) => row.reportStatusLabel },
    { header: 'Действия', accessor: (row: ProcessItem) => <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button title="Перенос даты" color="btn-blue" disabled={saving || row.approvalStatus !== 'approved'} onClick={() => openAction('reschedule', row)} />
      <Button title="Откат этапа" color="btn-orange" disabled={saving || ['not_assigned', 'time_selection'].includes(row.stage)} onClick={() => openAction('rollback', row)} />
    </div> },
  ];

  return (
    <div className="main-container text">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <h1 className="text-bold" style={{ fontSize: 24, margin: 0 }}>Бизнес-процессы</h1>
        <Button title="Обновить" color="btn-blue" disabled={loading || saving} onClick={() => setReload(value => value + 1)} />
      </div>
      <p className="text text-blind">Данные загружаются из API. Перенос доступен только для согласованных процессов; причина передаётся в аудит.</p>
      {success && <p role="status">{success}</p>}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 24 }}>
        <Search hint="Поиск по группе, дисциплине, преподавателю..." value={query.search} onChange={value => setQuery(current => ({ ...current, search: value, page: 1 }))} size="large" />
        {([
          ['approvalStatus', 'Согласование', filters?.approvalStatuses],
          ['stage', 'Этап', filters?.stages],
          ['reportStatus', 'Отчёт', filters?.reportStatuses],
          ['semesterId', 'Семестр', filters?.semesters],
          ['facultyId', 'Факультет', filters?.faculties],
          ['departmentId', 'Кафедра', filters?.departments],
        ] as const).map(([key, label, options]) => <Dropdown key={key} label={label} options={[{ value: '', label: 'Все' }, ...(options ?? [])]} value={query[key]} onChange={value => setQuery(current => ({ ...current, [key]: value, page: 1 }))} />)}
      </div>
      {filterError && <p role="alert">Фильтры недоступны: {filterError}</p>}
      {error && <p role="alert" style={{ color: 'var(--accent-red-c)' }}>{error}</p>}
      {loading && <p role="status">Загрузка процессов…</p>}
      {!loading && data && <>
        {data.items.length ? <div className="table-wrapper"><Table columns={columns} data={data.items} /></div> : <p>Процессы не найдены.</p>}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 20 }}>
          <Button title="Назад" color="btn-blue" disabled={data.page <= 1} onClick={() => setQuery(current => ({ ...current, page: data.page - 1 }))} />
          <span>Страница {data.page} из {Math.max(1, Math.ceil(data.total / data.pageSize))}; всего: {data.total}</span>
          <Button title="Вперёд" color="btn-blue" disabled={data.page * data.pageSize >= data.total} onClick={() => setQuery(current => ({ ...current, page: data.page + 1 }))} />
        </div>
      </>}
      {action && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
        <form role="dialog" aria-modal="true" aria-labelledby="process-action-title" onSubmit={submitAction} style={{ backgroundColor: 'var(--background-c)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
          <h2 id="process-action-title">{action.kind === 'reschedule' ? 'Перенос даты' : 'Откат на предыдущий этап'}</h2>
          <p>{action.process.groupName} — {action.process.disciplineName}</p>
          <p>Текущий этап: {action.process.stageLabel}</p>
          {mutationError && <p role="alert" style={{ color: 'var(--accent-red-c)' }}>{mutationError}</p>}
          <fieldset disabled={saving} style={{ border: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {action.kind === 'reschedule' && <>
              <label>Новая дата<input className="input-field" type="date" required value={date} onChange={event => setDate(event.target.value)} /></label>
              <label>Новое время<input className="input-field" type="time" required value={time} onChange={event => setTime(event.target.value)} /></label>
            </>}
            <label>Причина изменения<textarea className="input-field" required value={reason} onChange={event => setReason(event.target.value)} rows={3} /></label>
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
