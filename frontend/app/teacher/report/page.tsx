"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Check, Clock, Download, Upload } from "lucide-react";
import Table, { Column } from "@/components/table/Table";
import Pagination from "@/components/pagination/Pagination";
import Capsule from "@/components/capsule/Capsule";
import Button from "@/components/button/Button";
import Modal from "@/components/modal/Modal";
import Dropzone from "@/components/dropzone/Dropzone";
import {
  downloadTeacherReportTemplate,
  downloadBlankTeacherReportTemplate,
  getTeacherReports,
  MAX_DOCX_SIZE_MB,
  TeacherReportTask,
  uploadTeacherReport,
  validateDocxFile,
} from "@/services/teacherWorkflow";

const PAGE_SIZE = 10;

function statusVariant(status: string): "default" | "success" | "warning" | "danger" {
  if (status === "signed") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected") return "danger";
  return "default";
}

function paperStatus(status: TeacherReportTask["paperStatus"]): {
  label: string;
  variant: "default" | "success" | "warning";
} {
  if (status === "submitted") return { label: "Сдан", variant: "success" };
  if (status === "pending") return { label: "Ожидает сдачи", variant: "warning" };
  return { label: "Пока не требуется", variant: "default" };
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ru-RU");
}

export default function TeacherReport() {
  const [items, setItems] = useState<TeacherReportTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<TeacherReportTask | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingBlank, setDownloadingBlank] = useState(false);
  const [fileTooltip, setFileTooltip] = useState<{
    id: string;
    text: string;
    left: number;
    top: number;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getTeacherReports(controller.signal)
      .then((rows) => {
        setItems(rows);
        setError("");
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Не удалось загрузить отчёты");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const handleDownload = async (task: TeacherReportTask) => {
    setDownloadingId(task.groupId);
    setError("");
    try {
      await downloadTeacherReportTemplate(task);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось скачать шаблон отчёта");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadBlank = async () => {
    setDownloadingBlank(true);
    setError("");
    try {
      await downloadBlankTeacherReportTemplate();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось скачать пустой шаблон отчёта");
    } finally {
      setDownloadingBlank(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!selected?.reportId) {
      setError("Для этого тестирования отчёт ещё не создан.");
      return;
    }
    const validationError = validateDocxFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");
    setNotice("");
    try {
      await uploadTeacherReport(selected.reportId, file, setUploadProgress);
      setNotice("DOCX отправлен на проверку.");
      setSelected(null);
      try {
        setItems(await getTeacherReports());
      } catch (reason) {
        setError(
          `DOCX загружен, но список отчётов не обновился: ${
            reason instanceof Error ? reason.message : "ошибка загрузки списка"
          }`
        );
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить DOCX");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const columns: Column<TeacherReportTask>[] = [
    {
      header: "Группа",
      accessor: "groupName",
      rowSpan: (item, index, rows) => {
        if (index > 0 && rows[index - 1].groupName === item.groupName) return 0;
        let span = 1;
        while (index + span < rows.length && rows[index + span].groupName === item.groupName) span++;
        return span;
      },
    },
    { header: "Дисциплина", accessor: "disciplineName" },
    {
      header: "Скачать шаблон отчёта",
      accessor: (item) => (
        <Button
          color="btn-blue"
          onClick={() => void handleDownload(item)}
          disabled={downloadingId === item.groupId}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Download size={18} />
          Скачать
        </Button>
      ),
    },
    {
      header: "Загрузить готовый отчёт",
      accessor: (item) => (
        <Button
          color="btn-blue"
          onClick={() => {
            setSelected(item);
            setError("");
          }}
          disabled={!item.reportId}
          title={item.reportId ? "Загрузить DOCX" : "Отчёт ещё не создан"}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Upload size={18} />
          Загрузить
        </Button>
      ),
    },
    {
      header: "Электронный отчёт",
      accessor: (item) => {
        const tooltipId = `report-file-${item.reportId ?? `${item.groupId}-${item.disciplineId}`}`;
        const showFileTooltip = (element: HTMLElement) => {
          if (!item.fileName) return;
          const rect = element.getBoundingClientRect();
          setFileTooltip({
            id: tooltipId,
            text: item.fileName,
            left: Math.max(8, Math.min(rect.left, window.innerWidth - 368)),
            top: Math.min(rect.bottom + 8, window.innerHeight - 120),
          });
        };

        return (
          <div>
            <span
              role="group"
              aria-label={item.fileName ? `${item.statusLabel}; имя файла` : item.statusLabel}
              aria-describedby={item.fileName ? tooltipId : undefined}
              tabIndex={item.fileName ? 0 : undefined}
              onMouseEnter={(event) => showFileTooltip(event.currentTarget)}
              onMouseLeave={() => setFileTooltip(null)}
              onFocus={(event) => showFileTooltip(event.currentTarget)}
              onBlur={() => setFileTooltip(null)}
            >
              <Capsule
                variant={statusVariant(item.status)}
                icon={item.status === "signed"
                  ? <Check size={16} />
                  : item.status === "pending"
                    ? <Clock size={16} />
                    : item.status === "rejected"
                      ? <AlertCircle size={16} />
                      : <Upload size={16} />}
              >
                {item.statusLabel || "Не загружен"}
              </Capsule>
            </span>
            {item.uploadedAt && (
              <div className="text-blind" style={{ marginTop: 6 }}>
                {formatDate(item.uploadedAt)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Бумажный отчёт",
      accessor: (item) => {
        const status = paperStatus(item.paperStatus);
        return (
          <Capsule variant={status.variant}>
            {item.paperStatusLabel || status.label}
          </Capsule>
        );
      },
    },
    {
      header: "Замечание ЛПР",
      accessor: (item) => item.reviewComment || "—",
    },
  ];

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const groupedItems = [...items].sort((a, b) =>
    a.groupName.localeCompare(b.groupName, "ru") ||
    a.disciplineName.localeCompare(b.disciplineName, "ru")
  );
  const pageItems = groupedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="main-container">
      <p className="title text-bold">Отчеты о проверке остаточных знаний</p>
      {error && <p role="alert" className="modal-error">{error}</p>}
      {notice && <p role="status" className="text">{notice}</p>}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button
          color="btn-blue"
          onClick={() => void handleDownloadBlank()}
          disabled={downloadingBlank}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Download size={18} />
          {downloadingBlank ? "Скачиваем шаблон…" : "Скачать пустой шаблон отчёта"}
        </Button>
      </div>
      {loading ? (
        <p className="text text-blind">Загружаем отчёты…</p>
      ) : items.length === 0 ? (
        <p className="text text-blind">Назначенных отчётов нет.</p>
      ) : (
        <>
          <Table style={{ width: "100%" }} columns={columns} data={pageItems} />
          <div style={{ display: "flex", justifyContent: "right", marginTop: 20 }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              siblingCount={1}
              showFirstLast
            />
          </div>
        </>
      )}
      <p className="text text-blind">
        Отметку о сдаче бумажного экземпляра вносит ответственное подразделение.
      </p>
      <Modal
        open={selected !== null}
        onClose={() => {
          if (!uploading) setSelected(null);
        }}
        title="Загрузка готового отчёта"
      >
        {selected && (
          <>
            <p className="text text-bold">
              {selected.groupName} — {selected.disciplineName}
            </p>
            <Dropzone
              title="Выберите заполненный DOCX или перетащите его сюда"
              hint={`Только DOCX, размер не более ${MAX_DOCX_SIZE_MB} МБ`}
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onFile={(file) => void handleUpload(file)}
              disabled={uploading}
            />
            {uploading && (
              <div
                className="upload-progress"
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
            {error && <p role="alert" className="modal-error">{error}</p>}
          </>
        )}
      </Modal>
      {fileTooltip && typeof document !== "undefined" && createPortal(
        <div
          id={fileTooltip.id}
          role="tooltip"
          style={{
            position: "fixed",
            zIndex: 10000,
            left: fileTooltip.left,
            top: fileTooltip.top,
            maxWidth: "min(360px, calc(100vw - 16px))",
            maxHeight: "40vh",
            overflowWrap: "anywhere",
            overflowY: "auto",
            padding: "8px 12px",
            border: "1px solid var(--secondary-border-c)",
            borderRadius: 6,
            background: "var(--background-inner-main-element-c)",
            color: "var(--secondary-font-c)",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
            fontSize: 13,
            lineHeight: 1.4,
            pointerEvents: "none",
          }}
        >
          {fileTooltip.text}
        </div>,
        document.body,
      )}
    </div>
  );
}
