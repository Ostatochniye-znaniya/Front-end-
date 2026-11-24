"use client";

import Button from "@/components/button/Button";
import MiniAlert from "@/components/alert/MiniAlert";
import Modal from "@/components/modal/Modal";
import {
  formatOrderAcademicYear, formatOrderDate, formatOrderSemester, formatOrderStatus,
  getOrderDetails, getOrderDownloadName, getOrderFile, signOrder, type OrderDetails, type OrderEssentials,
} from "@/services/orders";
import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./OrderDetailsModal.module.css";

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt>{label}</dt><dd>{children ?? "—"}</dd></div>;
}

function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return bytes + " Б";
  const megabytes = bytes >= 1024 * 1024;
  return (bytes / (megabytes ? 1024 * 1024 : 1024)).toLocaleString("ru-RU", { maximumFractionDigits: 1 })
    + (megabytes ? " МБ" : " КБ");
}

export default function OrderDetailsModal({ order, onClose, onSigned }: {
  order: OrderEssentials;
  onClose: () => void;
  onSigned?: (order: OrderDetails) => void;
}) {
  const content = useRef<HTMLDivElement>(null);
  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsAttempt, setDetailsAttempt] = useState(0);
  const [file, setFile] = useState<Blob | null>(null);
  const [fileLoading, setFileLoading] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileAttempt, setFileAttempt] = useState(0);
  const signing = useRef(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getOrderDetails(order.id, controller.signal).then((result) => {
      if (!controller.signal.aborted) setDetails(result);
    }).catch((caught: unknown) => {
      if (!controller.signal.aborted) setDetailsError(caught instanceof Error ? caught.message : "Не удалось загрузить реквизиты");
    }).finally(() => {
      if (!controller.signal.aborted) setDetailsLoading(false);
    });
    return () => controller.abort();
  }, [order.id, detailsAttempt]);

  useEffect(() => {
    if (isSigning) return;
    const controller = new AbortController();
    void getOrderFile(order.id, controller.signal).then((result) => {
      if (!controller.signal.aborted) setFile(result);
    }).catch((caught: unknown) => {
      if (!controller.signal.aborted) setFileError(caught instanceof Error ? caught.message : "Не удалось загрузить PDF");
    }).finally(() => {
      if (!controller.signal.aborted) setFileLoading(false);
    });
    return () => controller.abort();
  }, [order.id, fileAttempt, isSigning]);

  useEffect(() => {
    const containFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.defaultPrevented) return;
      const modal = content.current?.closest(".modal");
      if (!modal) return;
      const controls = [...modal.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.getClientRects().length > 0);
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

  const download = () => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = getOrderDownloadName((details ?? order).number, file.type);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  };

  const info = details ?? order;
  const statusLabel = formatOrderStatus(info.status);
  const handleClose = () => { if (!signing.current) onClose(); };
  const sign = async () => {
    if (signing.current) return;
    signing.current = true; setIsSigning(true); setSignError(null);
    // Прерываем старый GET файла: после подписания нужен PDF с присвоенным номером.
    setFile(null); setFileLoading(true); setFileError(null);
    try {
      const issued = await signOrder(order.id);
      setDetails(issued); setDetailsError(null); setDetailsLoading(false);
      setDetailsAttempt((attempt) => attempt + 1);
      setFile(null); setFileLoading(true); setFileError(null); setFileAttempt((attempt) => attempt + 1);
      onSigned?.(issued);
    } catch (caught) {
      setSignError(caught instanceof Error ? caught.message : "Не удалось подписать приказ");
      setDetailsLoading(true); setDetailsAttempt((attempt) => attempt + 1);
      setFileAttempt((attempt) => attempt + 1);
    } finally {
      signing.current = false; setIsSigning(false);
    }
  };
  return (
    <Modal open onClose={handleClose} title={info.number ? statusLabel + " № " + info.number : "Черновик без номера"}
      footer={
        <div className={styles.footerActions}>
          <button type="button" className="modal-cancel" disabled={isSigning} onClick={handleClose}>Закрыть</button>
          {info.status === "draft" && <Button title={isSigning ? "Подписание..." : "Подписать"}
            color="btn-blue" disabled={isSigning || detailsLoading || !details} onClick={() => void sign()} />}
          {fileError && <Button title="Повторить загрузку PDF" color="btn-blue" disabled={isSigning} onClick={() => {
            setFileError(null); setFileLoading(true); setFileAttempt((attempt) => attempt + 1);
          }} />}
          <Button title={fileLoading ? "Загрузка PDF..." : "Скачать " + (info.status === "draft" ? "черновик" : "приказ")}
            color="btn-green" disabled={isSigning || fileLoading || !file} onClick={download} />
        </div>
      }>
      <div ref={content} className={styles.content} aria-busy={detailsLoading || fileLoading}>
        <section className={styles.section}>
          <h3>Реквизиты документа</h3>
          <dl className={styles.summary}>
            <InfoRow label="Название">{info.name}</InfoRow>
            <InfoRow label="Статус">{statusLabel}</InfoRow>
            <InfoRow label="Дата приказа">{formatOrderDate(info.orderDate)}</InfoRow>
            <InfoRow label="Учебный год">{formatOrderAcademicYear(info.semester)}</InfoRow>
            <InfoRow label="Семестр">{formatOrderSemester(info.semester)}</InfoRow>
            <InfoRow label="Начало общего периода мероприятий">{formatOrderDate(info.testingStartDate)}</InfoRow>
            <InfoRow label="Окончание общего периода мероприятий">{formatOrderDate(info.testingEndDate)}</InfoRow>
          </dl>
        </section>
        {detailsLoading && <p role="status">Загрузка остальных реквизитов...</p>}
        {detailsError && <div role="alert">
          <MiniAlert type="error" text={detailsError} />
          <Button title="Повторить загрузку реквизитов" color="btn-blue" onClick={() => {
            setDetailsError(null); setDetailsLoading(true); setDetailsAttempt((attempt) => attempt + 1);
          }} />
        </div>}
        {details && <>
          <section className={styles.section}>
            <h3>Ответственные и сроки отчётов</h3>
            <dl className={styles.summary}>
              <InfoRow label="Начальник отдела контроля образовательного процесса">{details.educationControlDepartmentHead}</InfoRow>
              <InfoRow label="Начальник центра по учебно-методической работе">{details.educationalMethodicalCenterHead}</InfoRow>
              <InfoRow label="Сводный отчёт по проверке до">{formatOrderDate(details.inspectionSummaryDeadline)}</InfoRow>
              <InfoRow label="Сводный отчёт по анкетированию до">{formatOrderDate(details.surveySummaryDeadline)}</InfoRow>
              <InfoRow label="Сдавать бумажные отчёты">{details.requiresPaperReports ? "Да" : "Нет"}</InfoRow>
              {details.requiresPaperReports && <InfoRow label="Бумажные отчёты до">{formatOrderDate(details.paperReportDeadline)}</InfoRow>}
              <InfoRow label="Электронные отчёты до">{formatOrderDate(details.electronicReportDeadline)}</InfoRow>
            </dl>
          </section>
          <section className={styles.section}>
            <h3>Этапы и мероприятия</h3>
            <dl className={styles.summary}>
              <InfoRow label="1 этап — подготовка">{formatOrderDate(details.preparationStartDate)} — {formatOrderDate(details.preparationEndDate)}</InfoRow>
              <InfoRow label="2 этап — тестирование">{formatOrderDate(details.testingStageStartDate)} — {formatOrderDate(details.testingStageEndDate)}</InfoRow>
              <InfoRow label="3 этап — обработка результатов">{formatOrderDate(details.resultsProcessingStartDate)} — {formatOrderDate(details.inspectionSummaryDeadline)}</InfoRow>
              <InfoRow label="Обучающий онлайн-семинар">{formatOrderDate(details.onlineSeminarDate)}</InfoRow>
              <InfoRow label="Анкетирование">{formatOrderDate(details.surveyStartDate)} — {formatOrderDate(details.surveyEndDate)}</InfoRow>
            </dl>
          </section>
          <section className={styles.section}>
            <h3>Файл и создание</h3>
            <dl className={styles.summary}>
              <InfoRow label="ID документа">{details.id}</InfoRow>
              <InfoRow label="Размер PDF">{fileSizeLabel(details.fileSize)}</InfoRow>
              <InfoRow label="Создан">{new Date(details.createdAt).toLocaleString("ru-RU")}</InfoRow>
              <InfoRow label="Автор">{details.createdByName
                ?? (details.createdByUserId ? "Пользователь № " + details.createdByUserId : "Не указан")}</InfoRow>
            </dl>
          </section>
        </>}
        {signError && <div role="alert"><MiniAlert type="error" text={signError} /></div>}
        {fileError && <div role="alert"><MiniAlert type="error" text={fileError} /></div>}
      </div>
    </Modal>
  );
}
