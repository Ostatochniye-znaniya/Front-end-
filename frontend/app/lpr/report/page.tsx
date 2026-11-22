"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Clock, Download } from "lucide-react";
import Button from "@/components/button/Button";
import Capsule from "@/components/capsule/Capsule";
import Dropdown from "@/components/dropdown/Dropdown";
import Modal from "@/components/modal/Modal";
import { DocumentApiError, type FilterOption } from "@/services/documents";
import {
  downloadLprReport, getLprReportFile, getLprReportFilters, getLprReports, reviewLprReport,
  type LprReport, type LprReportFilterOptions,
} from "@/services/lprReports";
import styles from "./page.module.css";

const STATUS_VIEW = {
  pending: { variant: "warning", icon: <Clock size={16} /> },
  signed: { variant: "success", icon: <Check size={16} /> },
  rejected: { variant: "danger", icon: <AlertCircle size={16} /> },
} as const;

const withAny = (options: FilterOption[] | undefined, label: string) => [
  { value: "", label }, ...(options ?? []),
];

function Status({ report, inCell = false }: { report: LprReport; inCell?: boolean }) {
  const view = STATUS_VIEW[report.status] ?? STATUS_VIEW.pending;
  if (inCell) return <span className={styles.statusLabel}>{view.icon}{report.statusLabel}</span>;
  return <Capsule variant={view.variant} icon={view.icon} className={styles.capsule}>{report.statusLabel}</Capsule>;
}

function keepOrder(previous: LprReport[], next: LprReport[]): LprReport[] {
  const positions = new Map(previous.map((row, index) => [row.id, index]));
  return [...next].sort((a, b) => (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER)
    - (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}

export default function LprReportPage() {
  const [items, setItems] = useState<LprReport[]>([]);
  const [options, setOptions] = useState<LprReportFilterOptions | null>(null);
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [filterError, setFilterError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<LprReport | null>(null);
  const [comment, setComment] = useState("");
  const [modalError, setModalError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [preview, setPreview] = useState("");
  const [previewError, setPreviewError] = useState("");
  const lastQuery = useRef<string | null>(null);
  const rejectionField = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getLprReportFilters(faculty ? Number(faculty) : undefined, controller.signal).then(result => {
      if (!controller.signal.aborted) { setOptions(result); setFilterError(""); }
    }).catch(reason => {
      if (!controller.signal.aborted) setFilterError(reason instanceof Error ? reason.message : "Не удалось загрузить фильтры");
    });
    return () => controller.abort();
  }, [faculty, reload]);

  useEffect(() => {
    const controller = new AbortController();
    const key = JSON.stringify([faculty, department, year, status]);
    const changedFilter = lastQuery.current !== key;
    lastQuery.current = key;
    if (changedFilter) { setItems([]); setLoading(true); }
    void getLprReports({
      facultyId: faculty ? Number(faculty) : undefined,
      departmentId: department ? Number(department) : undefined,
      academicYear: year || undefined, status: status || undefined,
    }, controller.signal).then(result => {
      if (!controller.signal.aborted) {
        setItems(previous => changedFilter ? result : keepOrder(previous, result));
        setError("");
      }
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Не удалось загрузить отчёты");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [faculty, department, year, status, reload]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && !busyRef.current) setReload(value => value + 1);
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  // DOCX скачивается исходным файлом; PDF можно просмотреть прямо в окне.
  useEffect(() => {
    if (!selected?.fileName?.toLowerCase().endsWith(".pdf")) return;
    const controller = new AbortController();
    let url: string | undefined;
    void getLprReportFile(selected, controller.signal).then(file => {
      if (!controller.signal.aborted) { url = URL.createObjectURL(file); setPreview(url); }
    }).catch(reason => {
      if (!controller.signal.aborted) setPreviewError(reason instanceof Error ? reason.message : "Не удалось открыть файл");
    });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [selected]);

  const open = (report: LprReport, reject = false) => {
    if (busyRef.current) return;
    setPreview(""); setPreviewError("");
    setSelected(report); setComment(report.status === "rejected" ? report.reviewComment ?? "" : "");
    setModalError("");
    if (reject) requestAnimationFrame(() => rejectionField.current?.focus());
  };
  const close = () => { if (!busyRef.current) setSelected(null); };

  const download = async (report: LprReport) => {
    setDownloading(report.id);
    setActionError("");
    try { await downloadLprReport(report); }
    catch (reason) {
      const message = reason instanceof Error ? reason.message : "Не удалось скачать отчёт";
      if (selected) setModalError(message); else setActionError(message);
      if (reason instanceof DocumentApiError && reason.status === 409) setReload(value => value + 1);
    } finally { setDownloading(null); }
  };

  const review = async (approved: boolean, report = selected) => {
    if (!report || report.status !== "pending" || busyRef.current) return;
    if (!approved && !comment.trim()) {
      setModalError("Опишите замечания проверки электронного отчёта.");
      rejectionField.current?.focus(); return;
    }
    busyRef.current = true; setBusy(true); setActionError(""); setModalError(""); setNotice("");
    try {
      const updated = await reviewLprReport(report, approved, comment.trim());
      setItems(previous => previous.map(row => row.id === updated.id ? updated : row));
      setSelected(null);
      setNotice(approved ? "Электронный отчёт принят." : "Отчёт отправлен на доработку. Преподаватель увидит замечания в своём списке.");
      setReload(value => value + 1);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Не удалось сохранить решение";
      if (reason instanceof DocumentApiError && reason.status === 409) {
        setSelected(null); setActionError(message); setReload(value => value + 1);
      } else if (selected) setModalError(message); else setActionError(message);
    } finally { busyRef.current = false; setBusy(false); }
  };

  return (
    <div className="main-container">
      <p className="title text-bold">Отчёты преподавателей</p>
      <div className={styles.filters}>
        <Dropdown label="Факультет / институт" placeholder="Все факультеты" options={withAny(options?.faculties, "Все факультеты")}
          value={faculty} onChange={value => { setFaculty(value); setDepartment(""); setYear(""); }} />
        <Dropdown label="Кафедра" placeholder="Все кафедры" options={withAny(options?.departments, "Все кафедры")}
          value={department} onChange={setDepartment} />
        <Dropdown label="Учебный год" placeholder="Все годы" options={withAny(options?.academicYears, "Все годы")}
          value={year} onChange={setYear} />
        <Dropdown label="Статус" placeholder="Любой статус" options={withAny(options?.statuses, "Любой статус")}
          value={status} onChange={setStatus} />
      </div>
      {filterError && <p className={styles.error} role="alert">{filterError}</p>}
      {actionError && <p className={styles.error} role="alert">{actionError}</p>}
      {error && <p className={styles.error} role="alert">{error} <button className="modal-cancel" onClick={() => setReload(value => value + 1)}>Обновить список</button></p>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {loading ? <p className={styles.empty}>Загрузка…</p> : items.length === 0 ? (
        <p className={styles.empty}>{error ? "Список отчётов недоступен" : "Нет документов для отображения"}</p>
      ) : (
        <div className="table-wrapper">
          <table className="table-container" style={{ width: "100%" }}>
            <thead><tr><th>Учебный год</th><th>Код направления</th><th>Номер группы</th><th>Дисциплина</th>
              <th>ФИО преподавателя</th><th>Электронный отчёт</th><th>Бумажный отчёт</th><th>Скачать</th><th>Действия</th></tr></thead>
            <tbody>{items.map(report => (
              <tr key={report.id} className={styles.reportRow} tabIndex={busy ? -1 : 0}
                aria-label={`Открыть отчёт: ${report.groupNumber ?? "группа не указана"}, ${report.disciplineName ?? "дисциплина не указана"}`}
                aria-disabled={busy}
                onClick={event => {
                  if (event.target instanceof Element && event.target.closest("button, a, input, select, textarea")) return;
                  open(report);
                }}
                onKeyDown={event => {
                  if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    open(report);
                  }
                }}>
                <td>{report.academicYear ?? "—"}</td><td>{report.studyProgramCode ?? "—"}</td><td>{report.groupNumber ?? "—"}</td>
                <td>{report.disciplineName ?? "—"}</td>
                <td>{report.teacherName ?? "—"}</td>
                <td className={`${styles.statusCell} ${styles[STATUS_VIEW[report.status].variant]}`}><Status report={report} inCell /></td>
                <td className={`${styles.statusCell} ${report.paperStatus === "submitted" ? styles.success : report.paperStatus === "pending" ? styles.warning : styles.neutral}`}>
                  <span className={styles.statusLabel}>{report.paperStatusLabel}</span>
                </td>
                <td><Button color={`btn-blue ${styles.button}`} onClick={() => void download(report)} disabled={downloading !== null} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "none" }}>
                  <Download size={18} />{downloading === report.id ? "Загрузка…" : "Скачать"}
                </Button></td>
                <td><div className={styles.actions}>
                  <Button title="Одобрить" color={`btn-green ${styles.button}`} disabled={busy || report.status !== "pending"} onClick={() => void review(true, report)} style={{ padding: "8px 12px", border: "none" }} />
                  <Button title="На доработку" color={`btn-red ${styles.button}`} disabled={busy || report.status !== "pending"} onClick={() => open(report, true)} style={{ padding: "8px 12px", border: "none" }} />
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <Modal open={selected !== null} onClose={close}
        title={<>{selected?.groupNumber ? `Отчёт · группа ${selected.groupNumber}` : "Электронный отчёт"}<span className="modal-subtitle">{selected?.disciplineName}</span></>}
        footer={selected && <>
          <button className="modal-cancel" onClick={close} disabled={busy}>Закрыть</button>
          <Button color={`btn-blue ${styles.button}`} onClick={() => void download(selected)} disabled={downloading !== null}><Download size={16} /> Скачать</Button>
          {selected.status === "pending" && <>
            <Button title={busy ? "Сохранение…" : "На доработку"} color={`btn-red ${styles.button}`} disabled={busy} onClick={() => void review(false)} />
            <Button title="Одобрить" color={`btn-green ${styles.button}`} disabled={busy} onClick={() => void review(true)} />
          </>}
        </>}>
        {selected && <>
          <dl className={styles.details}>
            <div><dt>Преподаватель</dt><dd>{selected.teacherName ?? "—"}</dd></div>
            <div><dt>Кафедра</dt><dd>{selected.departmentName ?? "—"}</dd></div>
            <div><dt>Учебный год</dt><dd>{selected.academicYear ?? "—"}</dd></div>
            <div><dt>Статус</dt><dd><Status report={selected} /></dd></div>
            <div><dt>Сдано в электронном виде</dt><dd>{selected.doneInElectronicForm === true ? "Да" : "Нет"}</dd></div>
            <div><dt>Файл</dt><dd>{selected.fileName ?? "—"}</dd></div>
          </dl>
          {selected.fileName?.toLowerCase().endsWith(".pdf") ? preview ? (
            <iframe src={preview} title="Электронный отчёт" className={styles.preview} />
          ) : <p>{previewError || "Загрузка документа…"}</p> : <p className={styles["file-hint"]}>Документ DOCX доступен по кнопке «Скачать».</p>}
          {selected.status === "pending" ? <div className={styles.comment}>
            <label htmlFor="report-review-comment">Замечания проверки электронного вида</label>
            <textarea id="report-review-comment" ref={rejectionField} value={comment} onChange={event => setComment(event.target.value)}
              maxLength={1000} disabled={busy} placeholder="Опишите нарушения для отправки отчёта на доработку" aria-invalid={Boolean(modalError)} aria-describedby={modalError ? "report-review-error" : undefined} />
          </div> : <div className={styles.comment}><strong>Замечания проверки электронного вида</strong><p className={styles["comment-text"]}>{selected.reviewComment ?? "Нет"}</p></div>}
          {modalError && <p className="modal-error" id="report-review-error" role="alert">{modalError}</p>}
        </>}
      </Modal>
    </div>
  );
}
