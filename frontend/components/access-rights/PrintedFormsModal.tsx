"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileSpreadsheet, Printer, X, FileText } from 'lucide-react';
import { UserAccessItem } from '@/services/accessRights';

interface PrintedFormsModalProps {
  users: UserAccessItem[];
  onNotification?: (msg: string, type: 'success' | 'error') => void;
}

export const PrintedFormsModal: React.FC<PrintedFormsModalProps> = ({
  users,
  onNotification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExportCsv = () => {
    try {
      const headers = ['ID', 'ФИО', 'Email', 'Подразделение', 'Роли в системе'];
      const rows = users.map((u) => [
        u.id,
        `"${u.name.replace(/"/g, '""')}"`,
        `"${u.email}"`,
        `"${(u.facultyName || u.position || '').replace(/"/g, '""')}"`,
        `"${u.roles.map((r) => r.roleName).join(', ').replace(/"/g, '""')}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Справочник_прав_доступа_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (onNotification) {
        onNotification('Файл реестра прав доступа успешно экспортирован (CSV)', 'success');
      }
      setIsOpen(false);
    } catch (err: any) {
      if (onNotification) {
        onNotification('Ошибка при экспорте файла: ' + err.message, 'error');
      }
    }
  };

  const handlePrint = () => {
    window.print();
    setIsOpen(false);
  };

  const modalContent = isOpen && mounted ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        padding: '16px',
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--background-c)',
          color: 'var(--secondary-font-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '20px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--secondary-border-c)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={22} color="var(--accent-blue-c)" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              Печатные формы и экспорт
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--secondary-any-icons-c)',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '13px', opacity: 0.75 }}>
          Выберите формат выгрузки реестра прав доступа пользователей ({users.length} записей):
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={handleExportCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--secondary-border-c)',
              backgroundColor: 'var(--background-inner-main-element-c)',
              color: 'var(--secondary-font-c)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: 'rgba(60, 210, 136, 0.15)',
                color: 'var(--accent-green-c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>
                Выгрузить реестр в Excel / CSV
              </div>
              <div style={{ fontSize: '12px', opacity: 0.65 }}>
                Таблица со всеми сотрудниками, ролями и email
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--secondary-border-c)',
              backgroundColor: 'var(--background-inner-main-element-c)',
              color: 'var(--secondary-font-c)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: 'rgba(95, 109, 236, 0.15)',
                color: 'var(--accent-blue-c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Printer size={22} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>
                Печатная версия реестра
              </div>
              <div style={{ fontSize: '12px', opacity: 0.65 }}>
                Печать или сохранение в PDF через браузер
              </div>
            </div>
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: '1px solid var(--secondary-border-c)',
            paddingTop: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn btn-red"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-blue"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        <Download size={16} />
        <span>Экспорт</span>
      </button>

      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
};
