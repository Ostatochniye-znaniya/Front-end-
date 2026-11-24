"use client";

import React, { useEffect, useRef, useState } from 'react';
import Button from '@/components/button/Button';
import Input from '@/components/input/Input';
import Alert from '@/components/alert/Alert';
import { getAdminSettings, updateAdminSettings, SystemSettings, SettingsValues } from '@/services/adminSettings';

const fields: { key: keyof SettingsValues; label: string; multiline?: boolean; hint: string }[] = [
  { key: 'supportEmail', label: 'Почта техподдержки (обязательно, до 255 символов)', hint: 'support@example.ru' },
  { key: 'supportPhone', label: 'Телефон техподдержки (до 32 символов)', hint: 'Телефон' },
  { key: 'welcomeText', label: 'Текст для новых пользователей (до 4000 символов)', hint: 'Приветствие', multiline: true },
  { key: 'accessRequestInstructions', label: 'Инструкция по запросу доступа (до 4000 символов)', hint: 'Инструкция', multiline: true },
  { key: 'notificationTemplate', label: 'Шаблон уведомления (до 4000 символов)', hint: 'Шаблон уведомления', multiline: true },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [reload, setReload] = useState(0);
  const pending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setSaved(false);
    getAdminSettings(controller.signal).then(value => {
      if (!controller.signal.aborted) setSettings(value);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Не удалось загрузить настройки.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [reload]);

  async function save() {
    if (!settings || loading || pending.current) return;
    pending.current = true;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const result = await updateAdminSettings(settings);
      setSettings(result);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить настройки.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="main-container text">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <h1 className="text-bold" style={{ fontSize: 24, margin: 0 }}>Настройки системы</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button title="Загрузить значения с сервера" color="btn-orange" disabled={loading || saving} onClick={() => setReload(value => value + 1)} />
          <Button title={saving ? 'Сохранение…' : 'Сохранить изменения'} color="btn-blue" disabled={!settings || loading || saving} onClick={save} />
        </div>
      </div>
      {loading && <p role="status">Загрузка настроек…</p>}
      {error && <p role="alert" style={{ color: 'var(--accent-red-c)' }}>{error}</p>}
      {saved && <Alert type="success" title="Настройки сохранены" text="Сервер подтвердил сохранение изменений." />}
      {!loading && !settings && <p>Настройки недоступны. Повторите загрузку с сервера.</p>}
      {settings && <>
        <p className="text text-blind">Последнее изменение: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString('ru-RU') : '—'}; автор: {settings.updatedBy ?? '—'}</p>
        <fieldset disabled={loading || saving} style={{ border: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960 }}>
          {fields.map(field => <label key={field.key} style={{ display: 'block', backgroundColor: 'var(--background-main-element-c)', border: '1px solid var(--secondary-border-c)', borderRadius: 16, padding: 24 }}>
            <span className="text text-bold" style={{ display: 'block', marginBottom: 12 }}>{field.label}</span>
            <Input hint={field.hint} value={settings[field.key] ?? ''} multiline={field.multiline} rows={4}
              onChange={value => { setSettings({ ...settings, [field.key]: value }); setSaved(false); }} />
          </label>)}
        </fieldset>
      </>}
    </div>
  );
}
