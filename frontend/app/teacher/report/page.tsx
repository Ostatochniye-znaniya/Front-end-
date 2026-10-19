"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Clock, Download, Upload } from "lucide-react";
import Table, { Column } from "@/components/table/Table";
import Pagination from "@/components/pagination/Pagination";
import Capsule from "@/components/capsule/Capsule";
import Button from "@/components/button/Button";
import Modal from "@/components/modal/Modal";
import Dropzone from "@/components/dropzone/Dropzone";
import {
  downloadTeacherReportTemplate,
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

function paperStatus(value: boolean | null): {
  label: string;
  variant: "default" | "success" | "danger";
} {
  if (value === true) return { label: "Сдан", variant: "success" };
  if (value === false) return { label: "Не сдано", variant: "danger" };
  return { label: "Не отмечено", variant: "default" };
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
      header: "Группа / дисциплина",
      accessor: (item) => (
        <div>
          <div className="text-bold">{item.groupName}</div>
          <div className="text-blind">{item.disciplineName}</div>
        </div>
      ),
    },
    {
      header: "Электронный отчёт",
      accessor: (item) => (
        <div>
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
          {item.uploadedAt && (
            <div className="text-blind" style={{ marginTop: 6 }}>
              {formatDate(item.uploadedAt)}
            </div>
          )}
          {item.fileName && (
            <div
              className="text-blind"
              title={item.fileName}
              style={{ marginTop: 4, maxWidth: 220, overflowWrap: "anywhere" }}
            >
              {item.fileName}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Бумажный отчёт",
      accessor: (item) => {
        const status = paperStatus(item.doneInPaperForm);
        return <Capsule variant={status.variant}>{status.label}</Capsule>;
      },
    },
    {
      header: "Шаблон отчёта",
      accessor: (item) => (
        <Button
          color="btn-blue"
          onClick={() => void handleDownload(item)}
          disabled={downloadingId === item.groupId}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Download size={18} />
          Скачать шаблон
        </Button>
      ),
    },
    {
      header: "Замечание ЛПР",
      accessor: (item) => item.reviewComment || "—",
    },
    {
      header: "Действия",
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
          Загрузить DOCX
        </Button>
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="main-container">
      <p className="title text-bold">Отчеты о проверке остаточных знаний</p>
      {error && <p role="alert" className="modal-error">{error}</p>}
      {notice && <p role="status" className="text">{notice}</p>}
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
        title="Загрузка заполненного отчёта"
        footer={
          <button
            type="button"
            className="modal-cancel"
            onClick={() => setSelected(null)}
            disabled={uploading}
          >
            Закрыть
          </button>
        }
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
    </div>
  );
}
