"use client";

import MiniAlert from "@/components/alert/MiniAlert";
import type { CreateOrderRequest } from "@/services/orders";
import {
  emptyOrderForm, nextOrderFieldIndex, ORDER_FORM_FIELDS,
  validateOrderForm, type OrderFormField,
} from "@/services/orderForm";
import {
  useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent,
} from "react";
import styles from "./CreateOrderModal.module.css";

export default function CreateOrderModal({ onClose, onSubmit, onCreated }: {
  onClose: () => void;
  onSubmit?: (request: CreateOrderRequest) => Promise<void>;
  onCreated?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const table = useRef<HTMLTableElement>(null);
  const submitting = useRef(false);
  const [values, setValues] = useState(emptyOrderForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<OrderFormField | null>(null);

  const focusField = (key: OrderFormField) => {
    table.current?.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${key}"]`)?.focus();
  };

  useEffect(() => {
    const previousFocus = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    table.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => {
      element?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  const handleTableKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (event.key !== "Tab") return;
    const fields = [...(table.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      "input:not(:disabled), select:not(:disabled)",
    ) ?? [])];
    if (fields.length === 0) return;
    event.preventDefault();
    const index = fields.indexOf(event.target as HTMLInputElement | HTMLSelectElement);
    const next = fields[nextOrderFieldIndex(index, fields.length, event.shiftKey)];
    next.focus();
    next.scrollIntoView({ block: "nearest" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current || !onSubmit) return;
    const result = validateOrderForm(values);
    if (!result.ok) {
      setError(result.message);
      setInvalidField(result.field);
      focusField(result.field);
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    setError(null);
    setInvalidField(null);
    try {
      await onSubmit(result.request);
      onCreated?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сформировать приказ");
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);

  return (
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="create-order-title"
      aria-describedby="order-keyboard-hint" aria-busy={isSubmitting}
      onCancel={(event) => { event.preventDefault(); if (!submitting.current) onClose(); }}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          if (!submitting.current && onSubmit) form.current?.requestSubmit();
        }
      }}>
      <header className={styles.header}>
        <h2 id="create-order-title">Формирование приказа</h2>
        <button type="button" className="btn btn-blue" disabled={isSubmitting} onClick={onClose}>Закрыть</button>
      </header>
      <p className={styles.hint} id="order-keyboard-hint">
        Tab / Shift+Tab — по строкам по кругу
        {onSubmit && " · Ctrl+Enter — сформировать"} · Esc — закрыть
      </p>
      {error && <div role="alert"><MiniAlert type="error" text={error} /></div>}
      <form ref={form} className={styles.form} noValidate onSubmit={(event) => void handleSubmit(event)}>
        <div className={styles.tableScroll}>
          <table ref={table} className={styles.table} onKeyDownCapture={handleTableKeyDown}>
            <caption className={styles.caption}>Реквизиты приказа</caption>
            <thead><tr><th scope="col">Параметр</th><th scope="col">Значение</th></tr></thead>
            <tbody>
              {ORDER_FORM_FIELDS.map((field) => {
                const id = `order-field-${field.key}`;
                const common = {
                  id,
                  name: field.key,
                  value: values[field.key],
                  required: true,
                  disabled: isSubmitting,
                  "aria-invalid": invalidField === field.key,
                  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                    const value = event.target.value;
                    setValues((previous) => ({ ...previous, [field.key]: value }));
                    setError(null);
                    setInvalidField(null);
                  },
                };
                return (
                  <tr key={field.key}>
                    <th scope="row"><label htmlFor={id}>{field.label}</label></th>
                    <td>{field.type === "year" ? (
                      <select {...common}>
                        <option value="">Выберите учебный год</option>
                        {years.map((year) => <option key={year} value={year}>{year}/{year + 1}</option>)}
                      </select>
                    ) : field.type === "semester" ? (
                      <select {...common}>
                        <option value="">Выберите семестр</option>
                        {Array.from({ length: 8 }, (_, index) => index + 1).map((semester) =>
                          <option key={semester} value={semester}>{semester} семестр</option>)}
                      </select>
                    ) : (
                      <input {...common} type={field.type} autoComplete="off" />
                    )}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className={styles.actions}>
          <button type="button" className="btn btn-orange" disabled={isSubmitting} onClick={onClose}>Отмена</button>
          <button type="submit" className="btn btn-green" disabled={isSubmitting || !onSubmit}
            title={!onSubmit ? "Формирование будет доступно после подключения API" : undefined}>
            {isSubmitting ? "Формирование..." : "Сформировать приказ"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
