"use client";

import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Table from '@/components/table/Table';
import Button from '@/components/button/Button';
import Input from '@/components/input/Input';
import Dropdown from '@/components/dropdown/Dropdown';
import { initialAuditLogs, AuditLog } from '@/components/admin/mockData';

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

  const renderRoleBadge = (role: string) => {
    let color = 'var(--accent-blue-c, #5f6dec)';
    let bg = 'var(--accent-blue-bg-c, rgba(95, 109, 236, 0.15))';

    if (role === 'Администратор') {
      color = 'var(--accent-purple-c, #a85fec)';
      bg = 'var(--accent-purple-bg-c, rgba(168, 95, 236, 0.15))';
    } else if (role === 'ЛПР') {
      color = 'var(--accent-green-c, #3cd288)';
      bg = 'var(--accent-green-bg-c, rgba(60, 210, 136, 0.15))';
    } else if (role.includes('Заведующий')) {
      color = 'var(--accent-orange-c, #ee9e44)';
      bg = 'var(--accent-orange-bg-c, rgba(238, 158, 68, 0.15))';
    }

    return (
      <span style={{
        padding: '3px 8px',
        borderRadius: '6px',
        backgroundColor: bg,
        color: color,
        fontWeight: 600,
        fontSize: '12px',
        whiteSpace: 'nowrap'
      }}>
        {role}
      </span>
    );
  };

  const columns = [
    {
      header: 'Дата и время',
      accessor: (row: AuditLog) => (
        <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '13px', whiteSpace: 'nowrap' }}>
          {row.timestamp}
        </span>
      ),
      sortFn: (a: AuditLog, b: AuditLog) => a.timestamp.localeCompare(b.timestamp)
    },
    {
      header: 'Пользователь / Роль',
      accessor: (row: AuditLog) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--secondary-font-c)', fontSize: '13px' }}>
            {row.user}
          </div>
          <div style={{ marginTop: '4px' }}>
            {renderRoleBadge(row.role)}
          </div>
        </div>
      ),
      sortFn: (a: AuditLog, b: AuditLog) => a.user.localeCompare(b.user)
    },
    {
      header: 'Действие',
      accessor: (row: AuditLog) => (
        <span style={{
          fontWeight: 600,
          color: row.action.includes('Административн') ? 'var(--accent-purple-c)' : 'var(--secondary-font-c)',
          fontSize: '13px'
        }}>
          {row.action}
        </span>
      )
    },
    {
      header: 'Сущность',
      accessor: (row: AuditLog) => (
        <span style={{ color: 'var(--secondary-font-c)', fontSize: '13px' }}>
          {row.entity}
        </span>
      )
    },
    {
      header: 'Обоснование / Причина',
      accessor: (row: AuditLog) => (
        <div style={{
          maxWidth: '280px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '12px',
          color: row.reason ? 'var(--secondary-font-c)' : 'var(--secondary-lock-font-c)',
          fontStyle: row.reason ? 'normal' : 'italic'
        }}>
          {row.reason || "Не требовалось"}
        </div>
      )
    },
    {
      header: 'Аудит',
      accessor: (row: AuditLog) => (
        <button
          onClick={() => setSelectedAudit(row)}
          style={{
            background: 'none',
            border: '1px solid var(--secondary-border-c)',
            color: 'var(--secondary-link-c, #6d86e4)',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          Было / Стало
        </button>
      )
    }
  ];

  return (
    <AdminLayout
      title="Журнал аудита действий пользователей"
      subtitle="Непрерывный учёт критических операций: кто, когда, над какой сущностью совершил действие, состояние до и после, обязательное обоснование."
      actions={
        <Button
          title="Сбросить фильтры"
          color="btn-orange"
          onClick={() => {
            setRoleFilter('all');
            setSearchQuery('');
          }}
        />
      }
    >
      {/* Информационные плашки */}
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
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Всего событий аудита</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-blue-c)', marginTop: '4px' }}>
            {logs.length}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Административных вмешательств</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-purple-c)', marginTop: '4px' }}>
            {logs.filter(l => l.role === 'Администратор').length}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>События согласования ЛПР</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-green-c)', marginTop: '4px' }}>
            {logs.filter(l => l.role === 'ЛПР').length}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Инвариант целостности</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-green-c)', marginTop: '8px' }}>
            ✔ Журнал защищён от удаления
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
            Поиск по пользователю, действию, сущности или причине
          </label>
          <Input
            hint="Например: Иванов, перенос даты, 221-111, служебная записка..."
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
          />
        </div>

        <div style={{ flex: '1 1 220px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--secondary-lock-font-c)' }}>
            Роль исполнителя
          </label>
          <Dropdown
            options={roleOptions}
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            placeholder="Все роли"
          />
        </div>

        <div style={{ paddingBottom: '4px', fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>
          Отобрано записей: <strong style={{ color: 'var(--secondary-font-c)' }}>{filteredLogs.length}</strong>
        </div>
      </div>

      {/* Таблица */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <Table columns={columns} data={filteredLogs} />
      </div>

      {/* Модальное окно "Было / Стало" с причиной */}
      {selectedAudit && (
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
            maxWidth: '680px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--secondary-font-c)' }}>
                  Протокол аудита #{selectedAudit.id}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>
                  {selectedAudit.action} • {selectedAudit.timestamp}
                </p>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  cursor: 'pointer',
                  color: 'var(--secondary-lock-font-c)'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr',
              gap: '10px',
              fontSize: '13px',
              marginBottom: '20px',
              backgroundColor: 'var(--background-inner-main-element-c)',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--secondary-border-c)'
            }}>
              <span style={{ color: 'var(--secondary-lock-font-c)' }}>Исполнитель:</span>
              <strong style={{ color: 'var(--secondary-font-c)' }}>{selectedAudit.user}</strong>

              <span style={{ color: 'var(--secondary-lock-font-c)' }}>Роль в системе:</span>
              <span>{renderRoleBadge(selectedAudit.role)}</span>

              <span style={{ color: 'var(--secondary-lock-font-c)' }}>Объект изменения:</span>
              <span style={{ color: 'var(--secondary-font-c)', fontWeight: 600 }}>{selectedAudit.entity}</span>

              <span style={{ color: 'var(--secondary-lock-font-c)' }}>Причина операции:</span>
              <span style={{ color: 'var(--accent-purple-font-c, var(--secondary-font-c))', fontWeight: 600 }}>
                {selectedAudit.reason || "Штатная операция пользователя без специального обоснования"}
              </span>
            </div>

            {/* Сравнение Было / Стало */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
              <div style={{
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: 'var(--background-inner-main-element-c)',
                border: '1px solid var(--secondary-border-c)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-red-c)', marginBottom: '6px' }}>
                  СОСТОЯНИЕ ДО (ПРЕДЫДУЩЕЕ)
                </div>
                <div style={{ fontSize: '13px', color: 'var(--secondary-font-c)', lineHeight: '1.4' }}>
                  {selectedAudit.previousState}
                </div>
              </div>

              <div style={{
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: 'var(--background-inner-main-element-c)',
                border: '1px solid var(--accent-green-c, #3cd288)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-green-c)', marginBottom: '6px' }}>
                  СОСТОЯНИЕ ПОСЛЕ (РЕЗУЛЬТАТ)
                </div>
                <div style={{ fontSize: '13px', color: 'var(--secondary-font-c)', lineHeight: '1.4' }}>
                  {selectedAudit.newState}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                title="Закрыть"
                color="btn-blue"
                onClick={() => setSelectedAudit(null)}
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
