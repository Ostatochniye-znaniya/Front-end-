"use client";

import Button from "@/components/button/Button";
import { getOrderDownloadName, type OrderEssentials } from "@/services/orders";
import { useEffect, useRef } from "react";
import styles from "./OrderDetailsModal.module.css";

export default function OrderDetailsModal({ order, file = null, loading = false, error = null, onRetry, onClose }: {
  order: OrderEssentials;
  file?: Blob | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialog.current?.showModal();
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  const download = () => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = getOrderDownloadName(order.number, file.type);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  };

  return (
    <dialog ref={dialog} className={styles.dialog} aria-busy={loading}
      aria-labelledby="order-details-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <header className={styles.header}>
        <h2 id="order-details-title">Приказ № {order.number}</h2>
        <Button title="Закрыть" color="btn-blue" onClick={onClose} />
      </header>
      <dl className={styles.summary}>
        <div><dt>Название</dt><dd>{order.name}</dd></div>
        <div><dt>Учебный год</dt><dd>{order.academicYear}/{order.academicYear + 1}</dd></div>
        <div><dt>Семестр</dt><dd>{order.semester}</dd></div>
      </dl>
      <div className={styles.actions}>
        <Button title={loading ? "Загрузка файла..." : "Скачать приказ"} color="btn-green"
          disabled={loading || !file} onClick={download} />
        {error && onRetry && <Button title="Повторить загрузку" color="btn-blue" onClick={onRetry} />}
      </div>
      {error && <p role="alert">{error}</p>}
    </dialog>
  );
}
