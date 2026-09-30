"use client";

import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Table from '@/components/table/Table';
import Button from '@/components/button/Button';
import Input from '@/components/input/Input';
import Dropdown from '@/components/dropdown/Dropdown';
import Alert from '@/components/alert/Alert';
import { initialProcesses, ProcessItem } from '@/components/admin/mockData';

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<ProcessItem[]>(initialProcesses);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Состояния для модальных окон безопасных сценариев
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
      title: 'Дата успешно изменена с фиксацией в аудите',
      text: `Для группы ${rescheduleModal.group} (${rescheduleModal.subject}) назначена дата ${newDate}. Причина: ${rescheduleReason}.`
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
      text: `Процесс группы ${rollbackModal.group} разблокирован для внесения правок кафедрой. Обоснование: ${rollbackReason}.`
    });

    setRollbackModal(null);
    setRollbackReason('');
  };

  const renderStatusBadge = (status: ProcessItem['status'], isLocked: boolean) => {
    let color = 'var(--secondary-font-c)';
    let bg = 'var(--secondary-divider-bg-c)';

    if (status === 'Согласовано') {
      color = 'var(--accent-green-c)';
      bg = 'var(--accent-green-bg-c)';
    } else if (status === 'На согласовании') {
      color = 'var(--accent-blue-c)';
      bg = 'var(--accent-blue-bg-c)';
    } else if (status === 'Отклонено' || status === 'Срок истёк') {
      color = 'var(--accent-red-c)';
      bg = 'var(--accent-red-bg-c)';
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          padding: '3px 8px',
          borderRadius: '6px',
          backgroundColor: bg,
          color: color,
          fontWeight: 600,
          fontSize: '12px'
        }}>
          {status}
        </span>
        {isLocked && (
          <span title="Неизменяемый статус (защищён от произвольного редактирования)" style={{ fontSize: '12px', cursor: 'help' }}>
            🔒
          </span>
        )}
      </div>
    );
  };

  const columns = [
    {
      header: 'Группа',
      accessor: (row: ProcessItem) => (
        <span style={{ fontWeight: 700, color: 'var(--secondary-font-c)', fontSize: '13px' }}>
          {row.group}
        </span>
      ),
      sortFn: (a: ProcessItem, b: ProcessItem) => a.group.localeCompare(b.group)
    },
    {
      header: 'Дисциплина',
      accessor: (row: ProcessItem) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--secondary-font-c)', fontSize: '13px' }}>
            {row.subject}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--secondary-lock-font-c)' }}>
            {row.department}
          </div>
        </div>
      ),
      sortFn: (a: ProcessItem, b: ProcessItem) => a.subject.localeCompare(b.subject)
    },
    {
      header: 'Преподаватель',
      accessor: (row: ProcessItem) => (
        <span style={{ fontSize: '13px', color: 'var(--secondary-font-c)' }}>
          {row.teacher}
        </span>
      ),
      sortFn: (a: ProcessItem, b: ProcessItem) => a.teacher.localeCompare(b.teacher)
    },
    {
      header: 'Дата и время',
      accessor: (row: ProcessItem) => (
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-geist-mono, monospace)' }}>
          <strong style={{ color: 'var(--secondary-font-c)' }}>{row.scheduledDate}</strong>
          <span style={{ color: 'var(--secondary-lock-font-c)', marginLeft: '6px' }}>{row.scheduledTime}</span>
        </div>
      )
    },
    {
      header: 'Статус этапа',
      accessor: (row: ProcessItem) => renderStatusBadge(row.status, row.isLocked)
    },
    {
      header: 'Отчет кафедры',
      accessor: (row: ProcessItem) => {
        let color = 'var(--secondary-lock-font-c)';
        if (row.reportStatus.includes('сдан') || row.reportStatus.includes('Подписан')) {
          color = 'var(--accent-green-c)';
        }
        return (
          <span style={{ fontSize: '12px', fontWeight: 600, color }}>
            {row.reportStatus}
          </span>
        );
      }
    },
    {
      header: 'Безопасные сценарии',
      accessor: (row: ProcessItem) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setRescheduleModal(row);
              setNewDate(row.scheduledDate);
              setNewTime(row.scheduledTime);
            }}
            title="Сценарий безопасного переноса даты после согласования"
            style={{
              background: 'none',
              border: '1px solid var(--accent-blue-c)',
              color: 'var(--accent-blue-c)',
              padding: '5px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            Перенести дату
          </button>
          <button
            onClick={() => setRollbackModal(row)}
            title="Возврат процесса на доработку с указанием причины"
            style={{
              background: 'none',
              border: '1px solid var(--accent-orange-c)',
              color: 'var(--accent-orange-c)',
              padding: '5px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            Откатить этап
          </button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout
      title="Монитор бизнес-процессов"
      subtitle="Центральный раздел контроля состояний. Запрещает произвольное редактирование полей — исправления проводятся строго через регламентированные административные сценарии с фиксацией в аудите."
      actions={
        <Button
          title="Сбросить фильтры"
          color="btn-orange"
          onClick={() => {
            setStatusFilter('all');
            setSearchQuery('');
          }}
        />
      }
    >
      {/* Системное уведомление об успешном действии */}
      {alertInfo && (
        <div style={{ marginBottom: '20px' }}>
          <Alert
            type={alertInfo.type}
            title={alertInfo.title}
            text={alertInfo.text}
          />
        </div>
      )}

      {/* Инфо-карточки регламента */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Принцип безопасного вмешательства</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--secondary-font-c)', marginTop: '6px', lineHeight: '1.4' }}>
            Прямое изменение БД запрещено. Изменение заблокированных данных требует обоснования.
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Контроль инвариантов</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--secondary-font-c)', marginTop: '6px', lineHeight: '1.4' }}>
            Все сданные отчеты сохраняют цифровую подпись кафедры.
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Активных процессов в системе</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-blue-c)', marginTop: '4px' }}>
            {processes.length}
          </div>
        </div>
      </div>

      {/* Фильтры */}
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
        <div style={{ flex: '1 1 280px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--secondary-lock-font-c)' }}>
            Поиск по группе, предмету, преподавателю или кафедре
          </label>
          <Input
            hint="Например: 221-111, Сети, Иванов..."
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
          />
        </div>

        <div style={{ flex: '1 1 220px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--secondary-lock-font-c)' }}>
            Статус согласования
          </label>
          <Dropdown
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            placeholder="Все статусы"
          />
        </div>

        <div style={{ paddingBottom: '4px', fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>
          Отображено процессов: <strong style={{ color: 'var(--secondary-font-c)' }}>{filteredProcesses.length}</strong>
        </div>
      </div>

      {/* Таблица процессов */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <Table columns={columns} data={filteredProcesses} />
      </div>

      {/* Модальное окно: Сценарий переноса даты */}
      {rescheduleModal && (
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
            maxWidth: '560px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: 'var(--secondary-font-c)' }}>
              Административный перенос даты тестирования
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>
              Группа <strong>{rescheduleModal.group}</strong> • {rescheduleModal.subject}
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '4px' }}>
                  Новая дата
                </label>
                <Input
                  hint="ДД.ММ.ГГГГ (например, 22.06.2026)"
                  value={newDate}
                  onChange={(val) => setNewDate(val)}
                />
              </div>
              <div style={{ width: '130px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '4px' }}>
                  Время
                </label>
                <Input
                  hint="12:20"
                  value={newTime}
                  onChange={(val) => setNewTime(val)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '4px' }}>
                Обязательное основание переноса (для аудита) <span style={{ color: 'var(--accent-red-c)' }}>*</span>
              </label>
              <Input
                hint="Номер служебной записки, приказ деканата или причина наложения аудиторий"
                value={rescheduleReason}
                onChange={(val) => setRescheduleReason(val)}
                multiline={true}
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                title="Отмена"
                color="btn-red"
                onClick={() => setRescheduleModal(null)}
              />
              <Button
                title="Применить и зафиксировать"
                color="btn-blue"
                onClick={handleApplyReschedule}
              />
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Сценарий отката этапа */}
      {rollbackModal && (
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
            maxWidth: '560px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: 'var(--secondary-font-c)' }}>
              Возврат процесса на этап согласования
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>
              Группа <strong>{rollbackModal.group}</strong> • {rollbackModal.subject}
            </p>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--accent-orange-c)', lineHeight: '1.4' }}>
              Внимание: Процесс будет переведён в статус «На согласовании», блокировка редактирования снята. Действие будет навсегда внесено в журнал аудита.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '4px' }}>
                Причина возврата на этап кафедры <span style={{ color: 'var(--accent-red-c)' }}>*</span>
              </label>
              <Input
                hint="Опишите, какая ошибка обнаружена после согласования"
                value={rollbackReason}
                onChange={(val) => setRollbackReason(val)}
                multiline={true}
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
                title="Подтвердить возврат"
                color="btn-orange"
                onClick={handleApplyRollback}
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
