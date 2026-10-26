"use client";

import MiniAlert from "@/components/alert/MiniAlert";
import Modal from "@/components/modal/Modal";
import {
  formatOrderAcademicYear, formatOrderSemester, getOrderSemesters,
  type CreateOrderRequest, type OrderSemester, type OrderStatus,
} from "@/services/orders";
import {
  emptyOrderForm, nextOrderFieldIndex, ORDER_FORM_DATE_RANGES, ORDER_FORM_FIELDS, ORDER_TEXT_LIMITS,
  validateOrderForm, type OrderDateField, type OrderFormField,
} from "@/services/orderForm";
import {
  useEffect, useId, useRef, useState, type ChangeEvent, type SubmitEvent, type KeyboardEvent,
} from "react";
import styles from "./CreateOrderModal.module.css";

type InputField = Exclude<(typeof ORDER_FORM_FIELDS)[number], { type: "checkbox" }>;
const rangeEnds = new Set<OrderFormField>(ORDER_FORM_DATE_RANGES.map((range) => range.end));
const rangesByStart = new Map<OrderFormField, (typeof ORDER_FORM_DATE_RANGES)[number]>(
  ORDER_FORM_DATE_RANGES.map((range) => [range.start, range]),
);

export default function CreateOrderModal({ onClose, onSubmit, onCreated }: {
  onClose: () => void;
  onSubmit: (request: CreateOrderRequest) => Promise<void>;
  onCreated?: (status: OrderStatus) => void;
}) {
  const formId = useId();
  const hintId = useId();
  const form = useRef<HTMLFormElement>(null);
  const table = useRef<HTMLTableElement>(null);
  const submitting = useRef(false);
  const [values, setValues] = useState(emptyOrderForm);
  const [submittingStatus, setSubmittingStatus] = useState<OrderStatus | null>(null);
  const isSubmitting = submittingStatus !== null;
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<OrderFormField | null>(null);
  const [semesters, setSemesters] = useState<OrderSemester[]>([]);
  const [loadingSemesters, setLoadingSemesters] = useState(true);
  const [semestersError, setSemestersError] = useState<string | null>(null);
  const [semestersAttempt, setSemestersAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getOrderSemesters(controller.signal).then((result) => {
      if (!controller.signal.aborted) setSemesters(result);
    }).catch((caught: unknown) => {
      if (!controller.signal.aborted) setSemestersError(caught instanceof Error ? caught.message : "Не удалось загрузить семестры");
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingSemesters(false);
    });
    return () => controller.abort();
  }, [semestersAttempt]);

  const retrySemesters = () => {
    setLoadingSemesters(true);
    setSemestersError(null);
    setSemestersAttempt((attempt) => attempt + 1);
  };

  const canSubmit = !loadingSemesters && !semestersError && semesters.length > 0;

  const focusField = (key: OrderFormField) => {
    table.current?.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${key}"]`)?.focus();
  };

  useEffect(() => {
    table.current?.querySelector<HTMLInputElement>("input")?.focus();

    // Tab в таблице обрабатывается отдельно; на кнопках окна фокус тоже не уходит на фон.
    const containFocus = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Tab" || event.defaultPrevented) return;
      const modal = form.current?.closest(".modal");
      if (!modal) return;
      const controls = [...modal.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) return;
      if (!modal.contains(document.activeElement)
        || (event.shiftKey && document.activeElement === first)
        || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", containFocus);
    return () => document.removeEventListener("keydown", containFocus);
  }, []);

  const handleClose = () => {
    if (!submitting.current) onClose();
  };

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

  const submitOrder = async (status: OrderStatus) => {
    if (submitting.current || !canSubmit) return;
    const result = validateOrderForm(values, semesters);
    if (!result.ok) {
      setError(result.message);
      setInvalidField(result.field);
      focusField(result.field);
      return;
    }
    submitting.current = true;
    setSubmittingStatus(status);
    setError(null);
    setInvalidField(null);
    try {
      await onSubmit({ ...result.request, status });
      onCreated?.(status);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сформировать документ");
    } finally {
      submitting.current = false;
      setSubmittingStatus(null);
    }
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitOrder("issued");
  };

  const renderField = (field: InputField, accessibleLabel?: string) => {
    const common = {
      id: `order-field-${field.key}`,
      name: field.key,
      value: values[field.key],
      required: true,
      disabled: isSubmitting,
      "aria-label": accessibleLabel,
      "aria-invalid": invalidField === field.key,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = event.target.value;
        setValues((previous) => ({ ...previous, [field.key]: value }));
        setError(null);
        setInvalidField(null);
      },
    };
    if (field.type === "semester") return (
      <select {...common} disabled={isSubmitting || loadingSemesters || !canSubmit}>
        <option value="">Выберите семестр</option>
        {semesters.map((semester) =>
          <option key={semester.id} value={semester.id}>
            {formatOrderSemester(semester)} · {formatOrderAcademicYear(semester)} уч. год
          </option>)}
      </select>
    );
    return (
      <input {...common} type={field.type} maxLength={ORDER_TEXT_LIMITS[field.key]} autoComplete="off"
        min={field.type === "date" && !["orderDate", "testingStartDate", "testingEndDate"].includes(field.key)
          ? values.testingStartDate || undefined : undefined}
        max={field.type === "date" && !["orderDate", "testingStartDate", "testingEndDate"].includes(field.key)
          ? values.testingEndDate || undefined : undefined} />
    );
  };

  return (
    <Modal open onClose={handleClose} title="Формирование приказа"
      footer={
        <div className={styles.footerActions}>
          <button type="button" className="modal-cancel" disabled={isSubmitting} onClick={handleClose}>Отмена</button>
          <button type="button" className="btn btn-blue" disabled={isSubmitting || !canSubmit}
            onClick={() => void submitOrder("draft")}>
            {submittingStatus === "draft" ? "Формирование..." : "Сформировать черновик"}
          </button>
          <button type="submit" form={formId} className="btn btn-green" disabled={isSubmitting || !canSubmit}>
            {submittingStatus === "issued" ? "Формирование..." : "Сформировать приказ"}
          </button>
        </div>
      }>
      <form ref={form} id={formId} className={styles.form} noValidate
        aria-describedby={hintId} aria-busy={isSubmitting}
        onSubmit={(event) => void handleSubmit(event)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            if (!submitting.current && canSubmit) form.current?.requestSubmit();
          }
        }}>
        <p className={styles.hint} id={hintId}>
          Номер будет присвоен автоматически при выпуске приказа. Черновик сохраняется без номера.
          <br />Tab / Shift+Tab — по полям по кругу · Ctrl+Enter — сформировать · Esc — закрыть
        </p>
        {error && <div role="alert"><MiniAlert type="error" text={error} /></div>}
        {loadingSemesters && <p className={styles.hint} role="status">Загрузка справочника семестров...</p>}
        {semestersError && <div role="alert">
          <MiniAlert type="error" text={semestersError} />
          <button type="button" className="btn btn-blue" onClick={retrySemesters}>Повторить загрузку семестров</button>
        </div>}
        {!loadingSemesters && !semestersError && semesters.length === 0 && <div role="alert">
          <MiniAlert type="info" text="Справочник семестров пуст. Для создания приказа сначала нужно добавить семестр на беке." />
          <button type="button" className="btn btn-blue" onClick={retrySemesters}>Обновить семестры</button>
        </div>}
        <div className={styles.tableScroll}>
          <table ref={table} className={styles.table} onKeyDownCapture={handleTableKeyDown}>
            <caption className={styles.caption}>Реквизиты приказа</caption>
            <colgroup><col className={styles.labelColumn} /><col span={2} /></colgroup>
            <thead><tr><th scope="col">Параметр</th><th scope="colgroup" colSpan={2}>Значение</th></tr></thead>
            <tbody>
              {ORDER_FORM_FIELDS.map((field) => {
                const id = `order-field-${field.key}`;
                if (rangeEnds.has(field.key)) return null;
                const range = rangesByStart.get(field.key);
                if (range) return (
                  <tr key={range.start}>
                    <th scope="row">{range.label}</th>
                    {[range.start, range.end].map((key, index) => {
                      const dateField = ORDER_FORM_FIELDS.find((candidate): candidate is OrderDateField =>
                        candidate.type === "date" && candidate.key === key)!;
                      const label = index === 0 ? "Начало" : "Конец";
                      return (
                        <td key={key}>
                          <div className={styles.dateField}>
                            <label htmlFor={`order-field-${key}`} className={styles.borderLabel}>{label}</label>
                            {renderField(dateField, `${range.label}: ${label}`)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
                if (field.key === "paperReportDeadline" && !values.requiresPaperReports) return null;
                if (field.type === "checkbox") return (
                  <tr key={field.key}>
                    <th scope="row"><label htmlFor={id}>{field.label}</label></th>
                    <td colSpan={2}><input id={id} name={field.key} type="checkbox" className={styles.paperCheckbox}
                      checked={values.requiresPaperReports} disabled={isSubmitting}
                      onChange={(event) => {
                        setValues((previous) => ({ ...previous, requiresPaperReports: event.target.checked }));
                        setError(null); setInvalidField(null);
                      }} /></td>
                  </tr>
                );
                return (
                  <tr key={field.key}>
                    <th scope="row"><label htmlFor={id}>{field.label}</label></th>
                    <td colSpan={2}>{renderField(field)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </form>
    </Modal>
  );
}
