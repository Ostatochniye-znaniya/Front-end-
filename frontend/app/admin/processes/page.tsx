"use client";

import React, { useState, useMemo } from 'react';
import Table from '@/components/table/Table';
import Button from '@/components/button/Button';
import Input from '@/components/input/Input';
import Dropdown from '@/components/dropdown/Dropdown';
import Search from '@/components/search/Search';
import Capsule from '@/components/capsule/Capsule';
import Alert from '@/components/alert/Alert';
import { initialProcesses, ProcessItem } from '@/components/admin/mockData';
import { Lock, Calendar, RotateCcw } from 'lucide-react';

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<ProcessItem[]>(initialProcesses);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [rescheduleModal, setRescheduleModal] = useState<ProcessItem | null>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');

  const [rollbackModal, setRollbackModal] = useState<ProcessItem | null>(null);
  const [rollbackReason, setRollbackReason] = useState<string>('');

  const [alertInfo, setAlertInfo] = useState<{ title: string; text: string; type: 'success' | 'warning' } | null>(null);

  const statusOptions = [
    { value: 'all', label: 'Все статусы' },
    { value: 'Согласовано', label: 'Согласовано' },
    { value: 'На согласовании', label: 'На согласовании' },
    { value: 'Отклонено', label: 'Отклонено' },
    { value: 'Срок истёк', label: 'Срок истёк' }
  ];

  const filteredProcesses = useMemo(() => {
    return processes.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesGroup = p.group.toLowerCase().includes(q);
        const matchesSubject = p.subject.toLowerCase().includes(q);
        const matchesTeacher = p.teacher.toLowerCase().includes(q);
        const matchesDept = p.department.toLowerCase().includes(q);
        if (!matchesGroup && !matchesSubject && !matchesTeacher && !matchesDept) return false;
      }
      return true;
    });
  }, [processes, statusFilter, searchQuery]);

  const handleApplyReschedule = () => {
    if (!rescheduleModal) return;
    if (!newDate.trim() || !rescheduleReason.trim()) {
      alert("Для изменения согласованного процесса обязательно укажите новую дату и причину изменения!");
      return;
    }

    setProcesses(prev => prev.map(item => {
      if (item.id === rescheduleModal.id) {
        return {
          ...item,
          scheduledDate: newDate,
          scheduledTime: newTime || item.scheduledTime
        };
      }
      return item;
    }));

    setAlertInfo({
      type: 'success',
      title: 'Дата успешно изменена',
      text: `Для группы ${rescheduleModal.group} (${rescheduleModal.subject}) назначена дата ${newDate}.`
    });

    setRescheduleModal(null);
    setNewDate('');
    setNewTime('');
    setRescheduleReason('');
  };

  const handleApplyRollback = () => {
    if (!rollbackModal) return;
    if (!rollbackReason.trim()) {
      alert("Для возврата процесса на доработку обязательно укажите причину!");
      return;
    }

    setProcesses(prev => prev.map(item => {
      if (item.id === rollbackModal.id) {
        return {
          ...item,
          status: 'На согласовании',
          isLocked: false
        };
      }
      return item;
    }));

    setAlertInfo({
      type: 'warning',
      title: 'Процесс возвращен на этап согласования',
      text: `Процесс группы ${rollbackModal.group} возвращен на согласование кафедрой.`
    });

    setRollbackModal(null);
    setRollbackReason('');
  };

  const columns = [
    {
      header: 'Группа',
      accessor: (row: ProcessItem) => (
        <span className="text-bold" style={{ fontSize: '14px' }}>
          {row.group}
        </span>
      ),
      sortFn: (a: ProcessItem, b: ProcessItem) => a.group.localeCompare(b.group)
    },
    {
      header: 'Дисциплина / Кафедра',
      accessor: (row: ProcessItem) => (
        <div style={{ textAlign: 'left' }}>
          <div className="text-bold">{row.subject}</div>
          <div className="text text-blind" style={{ fontSize: '12px', marginTop: '2px' }}>
            {row.department}
          </div>
        </div>
      ),
      sortFn: (a: ProcessItem, b: ProcessItem) => a.subject.localeCompare(b.subject)
    },
    {
      header: 'Преподаватель',
      accessor: (row: ProcessItem) => (
        <span className="text">{row.teacher}</span>
      ),
      sortFn: (a: ProcessItem, b: ProcessItem) => a.teacher.localeCompare(b.teacher)
    },
    {
      header: 'Дата и время',
      accessor: (row: ProcessItem) => (
        <div>
          <span className="text text-bold">{row.scheduledDate}</span>
          <span className="text text-blind" style={{ marginLeft: '6px', fontSize: '12px' }}>{row.scheduledTime}</span>
        </div>
      )
    },
    {
      header: 'Статус этапа',
      accessor: (row: ProcessItem) => {
        const variant =
          row.status === 'Согласовано' ? 'success' :
          row.status === 'На согласовании' ? 'info' : 'danger';
        return (
          <Capsule
            variant={variant}
            icon={row.isLocked ? <Lock size={12} /> : undefined}
          >
            {row.status}
          </Capsule>
        );
      }
    },
    {
      header: 'Отчет кафедры',
      accessor: (row: ProcessItem) => {
        const isDone = row.reportStatus.includes('сдан') || row.reportStatus.includes('Подписан');
        return (
          <Capsule variant={isDone ? 'success' : 'default'}>
            {row.reportStatus}
          </Capsule>
        );
      }
    },
    {
      header: 'Безопасные сценарии',
      accessor: (row: ProcessItem) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            title="Перенос даты"
            color="btn-blue"
            onClick={() => {
              setRescheduleModal(row);
              setNewDate(row.scheduledDate);
              setNewTime(row.scheduledTime);
            }}
          />
          {row.status === 'Согласовано' && (
            <Button
              title="Откат этапа"
              color="btn-orange"
              onClick={() => {
                setRollbackModal(row);
              }}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div className="main-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-bold" style={{ fontSize: '24px', margin: 0 }}>
          Бизнес-процессы
        </h1>
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

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <Search
            hint="Поиск по группе, дисциплине, преподавателю..."
            value={searchQuery}
            onChange={setSearchQuery}
            size="large"
          />
        </div>
        <div style={{ width: '220px' }}>
          <Dropdown
            label="Статус этапа"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Все статусы"
          />
        </div>
      </div>

      <div className="table-wrapper">
        <Table columns={columns} data={filteredProcesses} />
      </div>

      {rescheduleModal && (
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
          onClick={() => setRescheduleModal(null)}
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
              <Calendar size={20} color="var(--accent-blue-c)" />
              <h2 className="title text-bold" style={{ fontSize: '18px', margin: 0 }}>
                Перенос даты
              </h2>
            </div>
            
            <p className="text text-blind" style={{ fontSize: '13px', margin: '0 0 18px 0' }}>
              Группа: <strong>{rescheduleModal.group}</strong> ({rescheduleModal.subject})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label className="text text-bold" style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>
                  Новая дата проведения (ДД.ММ.ГГГГ):
                </label>
                <Input
                  hint="Например, 20.06.2026"
                  value={newDate}
                  onChange={setNewDate}
                />
              </div>

              <div>
                <label className="text text-bold" style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>
                  Время проведения:
                </label>
                <Input
                  hint="Например, 12:00 - 13:30"
                  value={newTime}
                  onChange={setNewTime}
                />
              </div>

              <div>
                <label className="text text-bold" style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>
                  Официальная причина переноса (обязательно для аудита):
                </label>
                <Input
                  hint="Служебная записка деканата / совпадение с аудиторным фондом"
                  value={rescheduleReason}
                  onChange={setRescheduleReason}
                  multiline
                  rows={3}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                title="Отмена"
                color="btn-red"
                onClick={() => setRescheduleModal(null)}
              />
              <Button
                title="Применить с записью в аудит"
                color="btn-blue"
                onClick={handleApplyReschedule}
              />
            </div>
          </div>
        </div>
      )}

      {rollbackModal && (
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
          onClick={() => setRollbackModal(null)}
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
              <RotateCcw size={20} color="var(--accent-orange-c)" />
              <h2 className="title text-bold" style={{ fontSize: '18px', margin: 0 }}>
                Возврат процесса на согласование
              </h2>
            </div>

            <p className="text text-blind" style={{ fontSize: '13px', margin: '0 0 18px 0' }}>
              Группа: <strong>{rollbackModal.group}</strong> ({rollbackModal.subject})
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label className="text text-bold" style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>
                Причина возврата на этап согласования:
              </label>
              <Input
                hint="Например: Необходима замена ответственного преподавателя по заявлению кафедры"
                value={rollbackReason}
                onChange={setRollbackReason}
                multiline
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                title="Отмена"
                color="btn-red"
                onClick={() => setRollbackModal(null)}
              />
              <Button
                title="Подтвердить откат статуса"
                color="btn-orange"
                onClick={handleApplyRollback}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
