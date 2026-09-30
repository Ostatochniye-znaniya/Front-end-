"use client";

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/button/Button';
import Input from '@/components/input/Input';
import Alert from '@/components/alert/Alert';
import { initialSettings, SystemSettings } from '@/components/admin/mockData';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [alertInfo, setAlertInfo] = useState<{ title: string; text: string; type: 'success' | 'info' } | null>(null);

  const handleSave = () => {
    setAlertInfo({
      type: 'success',
      title: 'Настройки успешно сохранены',
      text: 'Изменения бизнес-параметров применены ко всей системе без необходимости перезапуска сервисов.'
    });
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setAlertInfo({
      type: 'info',
      title: 'Параметры сброшены к исходным значениям',
      text: 'Восстановлены стандартные шаблоны и регламентные интервалы.'
    });
  };

  return (
    <AdminLayout
      title="Бизнес-настройки системы"
      subtitle="Управление регламентными параметрами, шаблонами сообщений и контактами без изменения исходного кода и деплоя (технические секреты и пароли здесь не отображаются)."
      actions={
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
      }
    >
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
        {/* Блок 1: Контакты и каналы обращений */}
        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--secondary-font-c)' }}>
            1. Каналы обращений и поддержка (п. 8.1 ТЗ)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)', margin: '0 0 18px 0', lineHeight: '1.4' }}>
            Адрес электронной почты для связи пользователей с технической поддержкой и методическим отделом. Отображается в шапке и подвале системы.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '6px' }}>
              Email для обращений преподавателей и кафедр
            </label>
            <Input
              hint="support@mospolytech.ru"
              value={settings.supportEmail}
              onChange={(val) => setSettings({ ...settings, supportEmail: val })}
            />
          </div>
        </div>

        {/* Блок 2: Тексты для пользователей без роли */}
        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--secondary-font-c)' }}>
            2. Информационные тексты для гостей (п. 8.1 ТЗ)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)', margin: '0 0 18px 0', lineHeight: '1.4' }}>
            Тексты, которые видят сотрудники при первом входе в систему до того, как администратор назначит им права преподавателя или заведующего кафедрой.
          </p>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '6px' }}>
              Приветственное сообщение для пользователей без назначенной роли
            </label>
            <Input
              hint="Добро пожаловать в систему..."
              value={settings.welcomeGuestText}
              onChange={(val) => setSettings({ ...settings, welcomeGuestText: val })}
              multiline={true}
              rows={3}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '6px' }}>
              Инструкция: куда обратиться для получения доступа и прав
            </label>
            <Input
              hint="Для получения роли обратитесь в учебно-методический отдел..."
              value={settings.accessRequestInstructions}
              onChange={(val) => setSettings({ ...settings, accessRequestInstructions: val })}
              multiline={true}
              rows={3}
            />
          </div>
        </div>

        {/* Блок 3: Шаблоны системных уведомлений */}
        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--secondary-font-c)' }}>
            3. Шаблоны системных уведомлений (п. 8.1 ТЗ)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)', margin: '0 0 18px 0', lineHeight: '1.4' }}>
            Шаблон почтового письма о согласовании дат и сроках сдачи отчетов. Поддерживает подстановку переменных <code>&#123;userName&#125;</code>, <code>&#123;groupName&#125;</code>, <code>&#123;subject&#125;</code>, <code>&#123;date&#125;</code>, <code>&#123;time&#125;</code>.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-lock-font-c)', marginBottom: '6px' }}>
              Шаблон уведомления о дате тестирования
            </label>
            <Input
              hint="Текст шаблона с переменными..."
              value={settings.notificationTemplate}
              onChange={(val) => setSettings({ ...settings, notificationTemplate: val })}
              multiline={true}
              rows={4}
            />
          </div>
        </div>

        {/* Блок 4: Регламентные параметры процессов */}
        <div style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--secondary-font-c)' }}>
            4. Регламентные бизнес-инварианты (п. 10 ТЗ)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--secondary-lock-font-c)', margin: '0 0 18px 0', lineHeight: '1.4' }}>
            Правила автоматической блокировки редактирования и защиты журнала аудита от несанкционированных изменений.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--background-inner-main-element-c)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--secondary-font-c)' }}>
                  Обязательное обоснование критических действий
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--secondary-lock-font-c)' }}>
                  Запрещает сохранение переноса даты или отката этапа без указания причины для аудита
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.requireReasonForOverrides}
                onChange={(e) => setSettings({ ...settings, requireReasonForOverrides: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--background-inner-main-element-c)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--secondary-font-c)' }}>
                  Автоблокировка редактирования ведомостей
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--secondary-lock-font-c)' }}>
                  Количество дней после даты тестирования, после которых отчёт переходит в статус «Только чтение»
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  value={settings.autoLockDaysAfterExam}
                  onChange={(e) => setSettings({ ...settings, autoLockDaysAfterExam: Number(e.target.value) })}
                  style={{
                    width: '60px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--secondary-border-c)',
                    backgroundColor: 'var(--background-main-element-c)',
                    color: 'var(--secondary-font-c)',
                    textAlign: 'center'
                  }}
                />
                <span style={{ fontSize: '13px', color: 'var(--secondary-font-c)' }}>дней</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--background-inner-main-element-c)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--secondary-font-c)' }}>
                  Режим плановых технических работ (Maintenance Mode)
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--secondary-lock-font-c)' }}>
                  Ограничивает доступ преподавателей на время генерации сводных отчетов
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <Button
            title="Сохранить изменения"
            color="btn-blue"
            onClick={handleSave}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
