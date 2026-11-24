"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pen, X, Plus, ShieldCheck, AlertCircle } from 'lucide-react';
import { RoleItem, UserAccessItem, saveUserRoles } from '@/services/accessRights';

interface RoleEditModalProps {
  user: UserAccessItem;
  allRoles: RoleItem[];
  onRolesUpdated: (userId: number, updatedRoleIds: number[]) => void;
  onNotification?: (msg: string, type: 'success' | 'error') => void;
}

export const RoleEditModal: React.FC<RoleEditModalProps> = ({
  user,
  allRoles,
  onRolesUpdated,
  onNotification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [localRoleIds, setLocalRoleIds] = useState<number[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLocalRoleIds(user.roles.map((r) => r.roleId));
      setShowAddForm(false);
      setSelectedRoleToAdd('');
      setErrorText(null);
    }
  }, [isOpen, user]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isSaving) return;
    setIsOpen(false);
  };

  const getRoleName = (roleId: number): string => {
    const found = allRoles.find((r) => r.id === roleId);
    return found?.roleName || `Роль #${roleId}`;
  };

  const availableRolesToAdd = allRoles.filter((r) => !localRoleIds.includes(r.id));

  const handleRemoveRole = (roleIdToRemove: number) => {
    setLocalRoleIds((prev) => prev.filter((id) => id !== roleIdToRemove));
  };

  const handleAddRoleConfirm = () => {
    if (!selectedRoleToAdd) return;
    const roleIdNum = Number(selectedRoleToAdd);
    if (!localRoleIds.includes(roleIdNum)) {
      setLocalRoleIds((prev) => [...prev, roleIdNum]);
    }
    setSelectedRoleToAdd('');
    setShowAddForm(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorText(null);
    try {
      await saveUserRoles(user.id, localRoleIds);
      onRolesUpdated(user.id, localRoleIds);
      if (onNotification) {
        onNotification(`Роли для сотрудника ${user.name} успешно обновлены`, 'success');
      }
      setIsOpen(false);
    } catch (err: any) {
      const msg = err?.message || 'Не удалось сохранить роли на сервере';
      setErrorText(msg);
      if (onNotification) {
        onNotification(msg, 'error');
      }
    } finally {
      setIsSaving(false);
    }
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
      onClick={handleClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
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
            <ShieldCheck size={22} color="var(--accent-blue-c)" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              Назначение ролей сотрудника
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
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

        {/* User Target Banner */}
        <div
          style={{
            backgroundColor: 'var(--background-inner-main-element-c)',
            border: '1px solid var(--secondary-border-c)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span style={{ fontSize: '11px', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>
            Сотрудник:
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--secondary-font-c)' }}>
            {user.name}
          </span>
          <span style={{ fontSize: '13px', opacity: 0.75 }}>
            {user.email || 'Email не указан'}
          </span>
        </div>

        {/* Error Banner */}
        {errorText && (
          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(236, 95, 107, 0.15)',
              border: '1px solid var(--accent-red-c)',
              color: 'var(--accent-red-font-c)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorText}</span>
          </div>
        )}

        {/* Assigned Roles List */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.7 }}>
              Текущие роли в системе ({localRoleIds.length})
            </label>
            {!showAddForm && availableRolesToAdd.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--secondary-link-c)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={15} /> Добавить роль
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              minHeight: '52px',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid var(--secondary-border-c)',
              backgroundColor: 'var(--background-main-element-c)',
              alignItems: 'center',
            }}
          >
            {localRoleIds.length > 0 ? (
              localRoleIds.map((rId) => (
                <span
                  key={rId}
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
                    gap: '8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{getRoleName(rId)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(rId)}
                    disabled={isSaving}
                    title="Удалить роль"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--accent-red-c)',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={15} />
                  </button>
                </span>
              ))
            ) : (
              <span style={{ fontSize: '13px', opacity: 0.6, fontStyle: 'italic' }}>
                У сотрудника нет назначенных ролей. Нажмите «+ Добавить роль»
              </span>
            )}
          </div>
        </div>

        {/* Add Role Section */}
        {showAddForm && (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--secondary-border-c)',
              backgroundColor: 'var(--background-inner-main-element-c)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>
                Выберите новую роль:
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  opacity: 0.7,
                  cursor: 'pointer',
                  color: 'var(--secondary-font-c)',
                }}
              >
                Отмена
              </button>
            </div>

            <select
              value={selectedRoleToAdd}
              onChange={(e) => setSelectedRoleToAdd(e.target.value ? Number(e.target.value) : '')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--secondary-border-c)',
                backgroundColor: 'var(--background-c)',
                color: 'var(--secondary-font-c)',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            >
              <option value="">-- Выберите роль из списка --</option>
              {availableRolesToAdd.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.roleName}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-red"
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddRoleConfirm}
                disabled={!selectedRoleToAdd}
                className="btn btn-blue"
                style={{ padding: '6px 14px', fontSize: '13px', opacity: selectedRoleToAdd ? 1 : 0.5 }}
              >
                Применить
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid var(--secondary-border-c)',
            paddingTop: '16px',
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="btn btn-red"
            style={{ padding: '8px 18px', fontSize: '14px' }}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-blue"
            style={{ padding: '8px 22px', fontSize: '14px' }}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Редактировать роли сотрудника"
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
        <Pen size={18} />
      </button>

      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
};
