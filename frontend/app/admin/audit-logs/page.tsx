"use client";

import React, { useState, useMemo } from 'react';
import Table from '@/components/table/Table';
import Button from '@/components/button/Button';
import Dropdown from '@/components/dropdown/Dropdown';
import Search from '@/components/search/Search';
import Capsule from '@/components/capsule/Capsule';
import { initialAuditLogs, AuditLog } from '@/components/admin/mockData';
import { FileText, ArrowRight } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);

  const roleOptions = [
    { value: 'all', label: 'Все роли' },
    { value: 'Администратор', label: 'Администратор' },
    { value: 'ЛПР', label: 'ЛПР' },
    { value: 'Заведующий кафедрой', label: 'Заведующий кафедрой' },
    { value: 'Заместитель заведующего кафедрой', label: 'Заместитель зав. кафедрой' },
    { value: 'Преподаватель', label: 'Преподаватель' }
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (roleFilter !== 'all' && log.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesUser = log.user.toLowerCase().includes(query);
        const matchesAction = log.action.toLowerCase().includes(query);
        const matchesEntity = log.entity.toLowerCase().includes(query);
        const matchesReason = (log.reason || '').toLowerCase().includes(query);
        if (!matchesUser && !matchesAction && !matchesEntity && !matchesReason) return false;
      }
      return true;
    });
  }, [logs, roleFilter, searchQuery]);

  const columns = [
    {
      header: 'Дата и время',
      accessor: (row: AuditLog) => (
        <span className="text text-bold" style={{ fontSize: '13px' }}>
          {row.timestamp}
        </span>
      ),
      sortFn: (a: AuditLog, b: AuditLog) => a.timestamp.localeCompare(b.timestamp)
    },
    {
      header: 'Пользователь / Роль',
      accessor: (row: AuditLog) => {
        let variant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
        if (row.role === 'Администратор') variant = 'info';
        else if (row.role === 'ЛПР') variant = 'success';
        else if (row.role.includes('Заведующий')) variant = 'warning';

        return (
          <div style={{ textAlign: 'left' }}>
            <div className="text-bold">{row.user}</div>
            <div style={{ marginTop: '2px' }}>
              <Capsule variant={variant}>
                {row.role}
              </Capsule>
            </div>
          </div>
        );
      },
      sortFn: (a: AuditLog, b: AuditLog) => a.user.localeCompare(b.user)
    },
    {
      header: 'Операция / Действие',
      accessor: (row: AuditLog) => (
        <span className="text">{row.action}</span>
      ),
      sortFn: (a: AuditLog, b: AuditLog) => a.action.localeCompare(b.action)
    },
    {
      header: 'Сущность',
      accessor: (row: AuditLog) => (
        <span className="text-bold">{row.entity}</span>
      ),
      sortFn: (a: AuditLog, b: AuditLog) => a.entity.localeCompare(b.entity)
    },
    {
      header: 'Состояние (ДО → ПОСЛЕ)',
      accessor: (row: AuditLog) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <Capsule variant="default">
            {row.previousState}
          </Capsule>
          <ArrowRight size={14} className="text-blind" />
          <Capsule variant="info">
            {row.newState}
          </Capsule>
        </div>
      )
    },
    {
      header: 'Обоснование / Причина',
      accessor: (row: AuditLog) => (
        <span className="text text-blind" style={{ fontSize: '12px', maxWidth: '240px', display: 'inline-block' }}>
          {row.reason || '—'}
        </span>
      )
    },
    {
      header: 'Детализация',
      accessor: (row: AuditLog) => (
        <Button
          title="Подробнее"
          color="btn-blue"
          onClick={() => setSelectedAudit(row)}
        />
      )
    }
  ];

  return (
    <div className="main-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-bold" style={{ fontSize: '24px', margin: 0 }}>
          Журнал аудита
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <Search
            hint="Поиск по пользователю, действию, сущности, причине..."
            value={searchQuery}
            onChange={setSearchQuery}
            size="large"
          />
        </div>
        <div style={{ width: '220px' }}>
          <Dropdown
            label="Роль инициатора"
            options={roleOptions}
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="Все роли"
          />
        </div>
      </div>

      <div className="table-wrapper">
        <Table columns={columns} data={filteredLogs} />
      </div>

      {selectedAudit && (
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
          onClick={() => setSelectedAudit(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--background-c)',
              borderRadius: '16px',
              border: '1px solid var(--secondary-border-c)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
              padding: '28px',
              maxWidth: '560px',
              width: '100%'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <FileText size={20} color="var(--accent-blue-c)" />
              <h2 className="title text-bold" style={{ fontSize: '18px', margin: 0 }}>
                Карточка аудита #{selectedAudit.id}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--secondary-border-c)', paddingBottom: '8px' }}>
                <span className="text text-blind">Время фиксации:</span>
                <span className="text text-bold">{selectedAudit.timestamp}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--secondary-border-c)', paddingBottom: '8px' }}>
                <span className="text text-blind">Инициатор:</span>
                <span className="text text-bold">{selectedAudit.user} ({selectedAudit.role})</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--secondary-border-c)', paddingBottom: '8px' }}>
                <span className="text text-blind">Операция:</span>
                <span className="text">{selectedAudit.action}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--secondary-border-c)', paddingBottom: '8px' }}>
                <span className="text text-blind">Целевая сущность:</span>
                <span className="text text-bold">{selectedAudit.entity}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--secondary-border-c)', paddingBottom: '8px' }}>
                <span className="text text-blind">Изменение состояния:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Capsule variant="default">{selectedAudit.previousState}</Capsule>
                  <ArrowRight size={12} className="text-blind" />
                  <Capsule variant="info">{selectedAudit.newState}</Capsule>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--secondary-border-c)', paddingBottom: '8px' }}>
                <span className="text text-blind" style={{ display: 'block', marginBottom: '4px' }}>Обоснование (причина):</span>
                <span className="text" style={{ fontStyle: 'italic' }}>{selectedAudit.reason || 'Обоснование не требовалось по регламенту операции'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                title="Закрыть"
                color="btn-blue"
                onClick={() => setSelectedAudit(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
