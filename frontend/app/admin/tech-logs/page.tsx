"use client";

import React, { useState, useMemo } from 'react';
import Table from '@/components/table/Table';
import Button from '@/components/button/Button';
import Dropdown from '@/components/dropdown/Dropdown';
import Search from '@/components/search/Search';
import Capsule from '@/components/capsule/Capsule';
import { initialTechLogs, TechLog } from '@/components/admin/mockData';
import { Terminal, AlertCircle, AlertTriangle, Info } from 'lucide-react';

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

  const columns = [
    {
      header: 'Уровень',
      accessor: (row: TechLog) => {
        const variant =
          row.level === 'error' ? 'danger' :
          row.level === 'warning' ? 'warning' : 'info';
        return (
          <Capsule variant={variant}>
            {row.level.toUpperCase()}
          </Capsule>
        );
      },
      sortFn: (a: TechLog, b: TechLog) => a.level.localeCompare(b.level)
    },
    {
      header: 'Дата и время',
      accessor: (row: TechLog) => (
        <span className="text text-bold" style={{ fontSize: '13px' }}>
          {row.timestamp}
        </span>
      ),
      sortFn: (a: TechLog, b: TechLog) => a.timestamp.localeCompare(b.timestamp)
    },
    {
      header: 'Сервис-источник',
      accessor: (row: TechLog) => (
        <span className="text-bold">{row.service}</span>
      ),
      sortFn: (a: TechLog, b: TechLog) => a.service.localeCompare(b.service)
    },
    {
      header: 'Сообщение об ошибке / событии',
      accessor: (row: TechLog) => (
        <span className="text" style={{ textAlign: 'left', display: 'block' }}>
          {row.message}
        </span>
      )
    },
    {
      header: 'Trace ID',
      accessor: (row: TechLog) => (
        <span className="text text-blind" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          {row.traceId}
        </span>
      )
    },
    {
      header: 'Диагностика',
      accessor: (row: TechLog) => (
        <Button
          title="Стек ошибки"
          color="btn-blue"
          onClick={() => setSelectedLog(row)}
        />
      )
    }
  ];

  return (
    <div className="main-container">
      {/* Заголовок страницы с краткими счетчиками */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-bold" style={{ fontSize: '24px', margin: 0 }}>
            Технические логи и ошибки
          </h1>
          <p className="text text-blind" style={{ margin: '6px 0 0 0' }}>
            Служебные события серверных компонентов, сбои фоновых воркеров и интеграции с 1С (без бизнес-данных)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Capsule variant="danger" icon={<AlertCircle size={13} />}>
            {errorCount} Ошибок
          </Capsule>
          <Capsule variant="warning" icon={<AlertTriangle size={13} />}>
            {warningCount} Предупреждений
          </Capsule>
          <Capsule variant="info" icon={<Info size={13} />}>
            {infoCount} Инфо
          </Capsule>
        </div>
      </div>

      {/* Панель поиска и фильтрации */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <Search
            hint="Поиск по сообщению, Trace ID, сервису..."
            value={searchQuery}
            onChange={setSearchQuery}
            size="large"
          />
        </div>
        <div style={{ width: '220px' }}>
          <Dropdown
            label="Уровень логирования"
            options={levelOptions}
            value={levelFilter}
            onChange={setLevelFilter}
            placeholder="Все уровни"
          />
        </div>
        <div style={{ width: '220px' }}>
          <Dropdown
            label="Сервис-источник"
            options={serviceOptions}
            value={serviceFilter}
            onChange={setServiceFilter}
            placeholder="Все сервисы"
          />
        </div>
      </div>

      {/* Таблица технических логов */}
      <div className="table-wrapper">
        <Table columns={columns} data={filteredLogs} />
      </div>

      {/* Модальное окно просмотра деталей и трассировки ошибки */}
      {selectedLog && (
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
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--background-c)',
              borderRadius: '16px',
              border: '1px solid var(--secondary-border-c)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
              padding: '28px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Terminal size={20} color="var(--accent-blue-c)" />
              <h2 className="title text-bold" style={{ fontSize: '18px', margin: 0 }}>
                Диагностика события {selectedLog.id}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--secondary-border-c)', paddingBottom: '8px' }}>
                <span className="text text-blind">Время:</span>
                <span className="text text-bold">{selectedLog.timestamp}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--secondary-border-c)', paddingBottom: '8px' }}>
                <span className="text text-blind">Сервис:</span>
                <span className="text text-bold">{selectedLog.service}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--secondary-border-c)', paddingBottom: '8px' }}>
                <span className="text text-blind">Trace ID:</span>
                <span className="text text-bold" style={{ fontFamily: 'monospace' }}>{selectedLog.traceId}</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--secondary-border-c)', paddingBottom: '8px' }}>
                <span className="text text-blind" style={{ display: 'block', marginBottom: '4px' }}>Сообщение:</span>
                <span className="text text-bold" style={{ color: selectedLog.level === 'error' ? 'var(--accent-red-c)' : 'var(--secondary-font-c)' }}>
                  {selectedLog.message}
                </span>
              </div>
            </div>

            <div>
              <p className="text text-bold" style={{ marginBottom: '6px' }}>Стек вызовов / Детализация:</p>
              <pre
                style={{
                  backgroundColor: 'var(--background-inner-main-element-c)',
                  color: 'var(--secondary-font-c)',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  overflowX: 'auto',
                  lineHeight: '1.5',
                  fontFamily: 'monospace',
                  margin: 0
                }}
              >
                {selectedLog.details || 'Дополнительный стек вызова отсутствует для данного уровня логирования.'}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button
                title="Закрыть"
                color="btn-blue"
                onClick={() => setSelectedLog(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
