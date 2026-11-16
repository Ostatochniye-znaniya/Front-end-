"use client";

import { useId, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "@/components/modal/Modal";
import type { StudentListFormationPeriod } from "@/services/groupsTesting";
import styles from "./StudentListPeriodPicker.module.css";

function dateKey(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date: string): string {
  return date.split("-").reverse().join(".");
}

export default function StudentListPeriodPicker({ value, disabled, onChange }: {
  value: StudentListFormationPeriod | null;
  disabled: boolean;
  onChange: (period: StudentListFormationPeriod) => void;
}) {
  const triggerId = useId();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [month, setMonth] = useState(() => new Date());
  const today = dateKey(new Date());
  const firstDay = new Date(month);
  firstDay.setDate(1);
  const offset = (firstDay.getDay() + 6) % 7;
  const lastDay = new Date(firstDay);
  lastDay.setMonth(lastDay.getMonth() + 1);
  lastDay.setDate(0);
  const daysInMonth = lastDay.getDate();
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7;
  const monthTitle = new Intl.DateTimeFormat("ru", { month: "long", year: "numeric" }).format(month);

  const show = () => {
    setStart(value?.startDate ?? "");
    setEnd(value?.endDate ?? "");
    const visible = value ? new Date(`${value.startDate}T12:00:00`) : new Date();
    visible.setDate(1);
    setMonth(visible);
    setOpen(true);
  };

  const moveMonth = (delta: number) => {
    const next = new Date(firstDay);
    next.setMonth(next.getMonth() + delta);
    setMonth(next);
  };

  const choose = (date: string) => {
    if (!start || end) {
      setStart(date);
      setEnd("");
    } else if (date < start) {
      setStart(date);
      setEnd(start);
    } else setEnd(date);
  };

  return (
    <div className="dropdown-container">
      <label htmlFor={triggerId} className="dropdown-label">Формирование списка студентов</label>
      <button id={triggerId} type="button" className={`dropdown-header ${styles.trigger}`} disabled={disabled}
        onClick={show} aria-haspopup="dialog" aria-expanded={open}>
        <span className="dropdown-selected">{value ? `${formatDate(value.startDate)} — ${formatDate(value.endDate)}` : "Выбрать период"}</span>
        <CalendarDays size={18} aria-hidden="true" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Период формирования списка студентов"
        footer={<>
          <button type="button" className="modal-cancel" onClick={() => setOpen(false)}>Отмена</button>
          <button type="button" className="btn btn-blue" disabled={!start || !end || disabled}
            onClick={() => { onChange({ startDate: start, endDate: end }); setOpen(false); }}>Выбрать период</button>
        </>}>
        <div className={styles.calendar}>
          <div className={styles.navigation}>
            <button type="button" aria-label="Предыдущий месяц" onClick={() => moveMonth(-1)}
              disabled={firstDay.getFullYear() === 1 && firstDay.getMonth() === 0}><ChevronLeft size={18} /></button>
            <strong aria-live="polite">{monthTitle}</strong>
            <button type="button" aria-label="Следующий месяц" onClick={() => moveMonth(1)}
              disabled={firstDay.getFullYear() === 9999 && firstDay.getMonth() === 11}><ChevronRight size={18} /></button>
          </div>
          <div className={styles.days}>
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => <span key={day} className={styles.weekday}>{day}</span>)}
            {Array.from({ length: cells }, (_, index) => {
              const day = index - offset + 1;
              if (day < 1 || day > daysInMonth) return <span key={index} aria-hidden="true" />;
              const date = new Date(firstDay);
              date.setDate(day);
              const key = dateKey(date);
              const selected = key === start || key === end;
              const inRange = Boolean(start && end && key > start && key < end);
              return <button key={index} type="button" onClick={() => choose(key)}
                className={`${styles.day} ${selected ? styles.selected : ""} ${inRange ? styles.inRange : ""}`}
                aria-label={new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", year: "numeric" }).format(date)}
                aria-pressed={selected || inRange} aria-current={key === today ? "date" : undefined}>{day}</button>;
            })}
          </div>
          <p className={styles.selection} aria-live="polite">{!start ? "Выберите начало и конец периода"
            : !end ? `Начало ${formatDate(start)}. Выберите конец периода`
              : `${formatDate(start)} — ${formatDate(end)}`}</p>
        </div>
      </Modal>
    </div>
  );
}
