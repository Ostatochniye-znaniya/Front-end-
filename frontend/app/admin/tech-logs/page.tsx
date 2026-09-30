"use client";

import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Table from '@/components/table/Table';
import Button from '@/components/button/Button';
import Input from '@/components/input/Input';
import Dropdown from '@/components/dropdown/Dropdown';
import { initialTechLogs, TechLog } from '@/components/admin/mockData';

export default function TechLogsPage() {
  const [logs, setLogs] = useState<TechLog[]>(initialTechLogs);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<TechLog | null>(null);

  const levelOptions = [
    { value: 'all', label: 'Все уровни' },
    { value: 'error', label: 'Ошибка (Error)' },
    { value: 'warning', label: 'Предупреждение (Warning)' },
    { value: 'info', label: 'Информация (Info)' }
  ];

  const serviceOptions = [
    { value: 'all', label: 'Все сервисы' },
    { value: 'Backend API', label: 'Backend API' },
    { value: 'Auth Service', label: 'Auth Service' },
    { value: 'Schedule Worker', label: 'Schedule Worker' },
    { value: 'Report Generator', label: 'Report Generator' },
    { value: '1C Integration', label: '1C Integration' },
    { value: 'Notification Bus', label: 'Notification Bus' }
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (serviceFilter !== 'all' && log.service !== serviceFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesMsg = log.message.toLowerCase().includes(query);
        const matchesTrace = log.traceId.toLowerCase().includes(query);
        const matchesService = log.service.toLowerCase().includes(query);
        if (!matchesMsg && !matchesTrace && !matchesService) return false;
      }
      return true;
    });
  }, [logs, levelFilter, serviceFilter, searchQuery]);

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warningCount = logs.filter(l => l.level === 'warning').length;
  const infoCount = logs.filter(l => l.level === 'info').length;

  const renderLevelBadge = (level: TechLog['level']) => {
    let bg = 'var(--accent-blue-bg-c, rgba(95, 109, 236, 0.15))';
    let color = 'var(--accent-blue-c, #5f6dec)';
    let text = 'INFO';

    if (level === 'error') {
      bg = 'var(--accent-red-bg-c, rgba(236, 95, 107, 0.15))';
      color = 'var(--accent-red-c, #ec5f6b)';
      text = 'ERROR';
    } else if (level === 'warning') {
      bg = 'var(--accent-orange-bg-c, rgba(238, 158, 68, 0.15))';
      color = 'var(--accent-orange-c, #ee9e44)';
      text = 'WARN';
    }

    return (
      <span style={{
        padding: '3px 8px',
        borderRadius: '6px',
        backgroundColor: bg,
        color: color,
        fontWeight: 700,
        fontSize: '11px',
        letterSpacing: '0.5px'
      }}>
        {text}
      </span>
    );
  };

  const columns = [
    {
      header: 'Время',
      accessor: (row: TechLog) => (
        <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '13px', whiteSpace: 'nowrap' }}>
          {row.timestamp}
        </span>
      ),
      sortFn: (a: TechLog, b: TechLog) => a.timestamp.localeCompare(b.timestamp)
    },
    {
      header: 'Уровень',
      accessor: (row: TechLog) => renderLevelBadge(row.level)
    },
    {
      header: 'Сервис',
      accessor: (row: TechLog) => (
        <span style={{ fontWeight: 600, color: 'var(--secondary-font-c)' }}>
          {row.service}
        </span>
      ),
      sortFn: (a: TechLog, b: TechLog) => a.service.localeCompare(b.service)
    },
    {
      header: 'Сообщение события / исключения',
      accessor: (row: TechLog) => (
        <div style={{ maxWidth: '440px', wordBreak: 'break-word', fontSize: '13px' }}>
          <div style={{ color: 'var(--secondary-font-c)', fontWeight: 500 }}>{row.message}</div>
          <div style={{ fontSize: '11px', color: 'var(--secondary-lock-font-c)', marginTop: '2px', fontFamily: 'monospace' }}>
            Trace: {row.traceId}
          </div>
        </div>
      )
    },
    {
      header: 'Действия',
      accessor: (row: TechLog) => (
        <button
          onClick={() => setSelectedLog(row)}
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
          Диагностика
        </button>
      )
    }
  ];

  return (
    <AdminLayout
      title="Технические логи системы"
      subtitle="Централизованный аудит системных событий, интеграций и ошибок backend-сервисов (Grafana-совместимый журнал без персональных данных)."
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            title="Очистить фильтры"
            color="btn-orange"
            onClick={() => {
              setLevelFilter('all');
              setServiceFilter('all');
              setSearchQuery('');
            }}
          />
        </div>
      }
    >
      {/* Метрики состояния */}
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
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Критические ошибки (Error)</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-red-c)', marginTop: '4px' }}>
            {errorCount}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Предупреждения (Warning)</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-orange-c)', marginTop: '4px' }}>
            {warningCount}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Информационные (Info)</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-green-c)', marginTop: '4px' }}>
            {infoCount}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>Статус интеграций</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-green-c)', marginTop: '8px' }}>
            ● Все шлюзы онлайн
          </div>
        </div>
      </div>

      {/* Панель фильтров */}
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
        <div style={{ flex: '1 1 240px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--secondary-lock-font-c)' }}>
            Поиск по сообщению или Trace ID
          </label>
          <Input
            hint="Например: PDFGeneration, 1C, deadlock..."
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
          />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--secondary-lock-font-c)' }}>
            Уровень важности
          </label>
          <Dropdown
            options={levelOptions}
            value={levelFilter}
            onChange={(val) => setLevelFilter(val)}
            placeholder="Все уровни"
          />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--secondary-lock-font-c)' }}>
            Подсистема / Сервис
          </label>
          <Dropdown
            options={serviceOptions}
            value={serviceFilter}
            onChange={(val) => setServiceFilter(val)}
            placeholder="Все сервисы"
          />
        </div>

        <div style={{ paddingBottom: '4px', fontSize: '13px', color: 'var(--secondary-lock-font-c)' }}>
          Найдено записей: <strong style={{ color: 'var(--secondary-font-c)' }}>{filteredLogs.length}</strong>
        </div>
      </div>

      {/* Таблица логов */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <Table columns={columns} data={filteredLogs} />
      </div>

      {/* Модальное окно диагностики */}
      {selectedLog && (
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
            maxWidth: '650px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {renderLevelBadge(selectedLog.level)}
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--secondary-font-c)' }}>
                  Детализация события #{selectedLog.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
              <span style={{ color: 'var(--secondary-lock-font-c)' }}>Сервис:</span>
              <strong style={{ color: 'var(--secondary-font-c)' }}>{selectedLog.service}</strong>

              <span style={{ color: 'var(--secondary-lock-font-c)' }}>Время:</span>
              <span style={{ fontFamily: 'monospace' }}>{selectedLog.timestamp}</span>

              <span style={{ color: 'var(--secondary-lock-font-c)' }}>Trace ID:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent-blue-c)' }}>{selectedLog.traceId}</span>

              <span style={{ color: 'var(--secondary-lock-font-c)' }}>Сообщение:</span>
              <span style={{ color: 'var(--secondary-font-c)' }}>{selectedLog.message}</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '6px' }}>
                Диагностический контекст / Стек вызовов
              </label>
              <pre style={{
                margin: 0,
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--background-inner-main-element-c)',
                color: 'var(--secondary-font-c)',
                fontSize: '12px',
                fontFamily: 'var(--font-geist-mono, monospace)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                border: '1px solid var(--secondary-border-c)'
              }}>
                {selectedLog.details || "Дополнительные сведения отсутствуют"}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                title="Закрыть"
                color="btn-blue"
                onClick={() => setSelectedLog(null)}
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
