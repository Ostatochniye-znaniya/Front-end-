"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, Mail, Shield, Building, User } from 'lucide-react';
import { UserAccessItem } from '@/services/accessRights';

interface EmployeeCardModalProps {
  user: UserAccessItem;
}

export const EmployeeCardModal: React.FC<EmployeeCardModalProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (fullName: string): string => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
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
          maxWidth: '520px',
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
            <User size={22} color="var(--accent-blue-c)" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              Карточка сотрудника
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

        {/* User Main Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '22px',
              backgroundColor: 'var(--accent-blue-c)',
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            {getInitials(user.name)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                margin: '0 0 4px 0',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--secondary-font-c)',
                lineHeight: 1.25,
              }}
            >
              {user.name}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.65 }}>
              ID сотрудника: #{user.id}
            </p>
          </div>
        </div>

        {/* Department / Position */}
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: 'var(--background-inner-main-element-c)',
            border: '1px solid var(--secondary-border-c)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Building size={18} color="var(--accent-blue-c)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <span style={{ display: 'block', fontSize: '11px', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>
                Подразделение / Факультет:
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                {user.facultyName || user.position || 'Московский Политех'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Mail size={18} color="var(--accent-blue-c)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <span style={{ display: 'block', fontSize: '11px', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>
                Корпоративный Email:
              </span>
              <a
                href={`mailto:${user.email}`}
                style={{ fontSize: '14px', color: 'var(--secondary-link-c)', textDecoration: 'none', wordBreak: 'break-all' }}
              >
                {user.email || 'Не указан'}
              </a>
            </div>
          </div>
        </div>

        {/* Roles Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Shield size={18} color="var(--accent-blue-c)" />
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.7 }}>
              Роли сотрудника в системе
            </h4>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {user.roles && user.roles.length > 0 ? (
              user.roles.map((r) => (
                <span
                  key={r.roleId}
                  style={{
                    backgroundColor: 'var(--tag-bg-default-c)',
                    color: 'var(--secondary-font-c)',
                    border: '1px solid var(--accent-blue-c)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-blue-c)',
                    }}
                  />
                  {r.roleName}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '13px', opacity: 0.6, fontStyle: 'italic' }}>
                Роли не назначены
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
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
            className="btn btn-blue"
            style={{ padding: '8px 22px', fontSize: '14px' }}
          >
            Закрыть
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
        title="Просмотр карточки сотрудника"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '8px',
          color: 'var(--secondary-any-icons-c)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s ease',
        }}
      >
        <Eye size={18} />
      </button>

      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
};
