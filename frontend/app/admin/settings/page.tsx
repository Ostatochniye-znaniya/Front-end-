"use client";

import React, { useState } from 'react';
import Button from '@/components/button/Button';
import Input from '@/components/input/Input';
import Alert from '@/components/alert/Alert';
import CheckBox from '@/components/checkbox/CheckBox';
import { initialSettings, SystemSettings } from '@/components/admin/mockData';
import { Mail, HelpCircle, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [alertInfo, setAlertInfo] = useState<{ title: string; text: string; type: 'success' | 'info' } | null>(null);

  const handleSave = () => {
    setAlertInfo({
      type: 'success',
      title: 'Настройки успешно сохранены',
      text: 'Изменения параметров применены без необходимости перезапуска сервисов.'
    });
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setAlertInfo({
      type: 'info',
      title: 'Параметры сброшены к исходным значениям',
      text: 'Восстановлены стандартные регламентные интервалы и шаблоны сообщений.'
    });
  };

  return (
    <div className="main-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-bold" style={{ fontSize: '24px', margin: 0 }}>
            Настройки системы
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            title="Сбросить к исходным"
            color="btn-orange"
            onClick={handleReset}
          />
          <Button
            title="Сохранить изменения"
            color="btn-blue"
            onClick={handleSave}
          />
        </div>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
        <div
          style={{
            backgroundColor: 'var(--background-main-element-c)',
            border: '1px solid var(--secondary-border-c)',
            borderRadius: '16px',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Mail size={18} color="var(--accent-blue-c)" />
            <h2 className="title text-bold" style={{ fontSize: '18px', margin: 0 }}>
              Поддержка и контакты
            </h2>
          </div>
          <p className="text text-blind" style={{ fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.4' }}>
            Адрес электронной почты для связи пользователей с технической поддержкой и методическим отделом. Отображается в интерфейсе гостя и в уведомлениях.
          </p>

          <div>
            <label className="text text-bold" style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>
              Email для обращений преподавателей и кафедр:
            </label>
            <Input
              hint="support@mospolytech.ru"
              value={settings.supportEmail}
              onChange={(val) => setSettings({ ...settings, supportEmail: val })}
            />
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--background-main-element-c)',
            border: '1px solid var(--secondary-border-c)',
            borderRadius: '16px',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <HelpCircle size={18} color="var(--accent-blue-c)" />
            <h2 className="title text-bold" style={{ fontSize: '18px', margin: 0 }}>
              Сообщение для новых пользователей
            </h2>
          </div>
          <p className="text text-blind" style={{ fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.4' }}>
            Сообщение, которое видит авторизованный сотрудник, которому ещё не назначена роль (страница /guest).
          </p>

          <div>
            <label className="text text-bold" style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>
              Текст сообщения на экране ожидания роли:
            </label>
            <Input
              hint="Введите текст приветствия..."
              value={settings.welcomeGuestText}
              onChange={(val) => setSettings({ ...settings, welcomeGuestText: val })}
              multiline
              rows={4}
            />
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--background-main-element-c)',
            border: '1px solid var(--secondary-border-c)',
            borderRadius: '16px',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <HelpCircle size={18} color="var(--accent-blue-c)" />
            <h2 className="title text-bold" style={{ fontSize: '18px', margin: 0 }}>
              Инструкция по получению доступа
            </h2>
          </div>
          <p className="text text-blind" style={{ fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.4' }}>
            Пошаговые действия для заведующих кафедрами и преподавателей для получения корректных прав доступа.
          </p>

          <div>
            <label className="text text-bold" style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>
              Текст регламента запроса доступа:
            </label>
            <Input
              hint="Введите регламент..."
              value={settings.accessRequestInstructions}
              onChange={(val) => setSettings({ ...settings, accessRequestInstructions: val })}
              multiline
              rows={4}
            />
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--background-main-element-c)',
            border: '1px solid var(--secondary-border-c)',
            borderRadius: '16px',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={18} color="var(--accent-blue-c)" />
            <h2 className="title text-bold" style={{ fontSize: '18px', margin: 0 }}>
              Параметры безопасности
            </h2>
          </div>
          <p className="text text-blind" style={{ fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.4' }}>
            Глобальные правила изменения данных в соответствии с концепцией безопасного аудита.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="text text-bold" style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>
                Срок автоматической фиксации (блокировки) процесса после сдачи тестирования (в днях):
              </label>
              <Input
                hint="3"
                value={String(settings.autoLockDaysAfterExam)}
                onChange={(val) => setSettings({ ...settings, autoLockDaysAfterExam: Number(val) || 0 })}
              />
            </div>

            <div>
              <CheckBox
                text="Требовать обязательное обоснование при переносе дат и отмене согласований"
                state={settings.requireReasonForOverrides}
                type="blue"
                onChange={(val) => setSettings({ ...settings, requireReasonForOverrides: val })}
              />
            </div>

            <div>
              <CheckBox
                text="Включить режим регламентного обслуживания (вход только для Администраторов)"
                state={settings.maintenanceMode}
                type="red"
                onChange={(val) => setSettings({ ...settings, maintenanceMode: val })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
