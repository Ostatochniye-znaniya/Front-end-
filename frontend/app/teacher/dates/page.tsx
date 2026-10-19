"use client";

import { useEffect, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import Table, { Column } from "@/components/table/Table";
import Pagination from "@/components/pagination/Pagination";
import Capsule from "@/components/capsule/Capsule";
import CheckBox from "@/components/checkbox/CheckBox";
import Button from "@/components/button/Button";
import Modal from "@/components/modal/Modal";
import Input from "@/components/input/Input";
import {
  approveTesting,
  getTeacherTestings,
  rejectTesting,
  saveTestingDelivery,
  TeacherTesting,
} from "@/services/teacherWorkflow";

type DeliveryDraft = {
  isInPerson: boolean;
  room: string;
  lmsUrl: string;
};

const PAGE_SIZE = 10;

function formatDate(date: string | null): string {
  if (!date) return "Дата не назначена";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("ru-RU");
}

function safeLmsUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function getApprovalStatus(status: string): {
  label: string;
  variant: "default" | "success" | "danger";
} {
  if (status === "approved") return { label: "Согласовано", variant: "success" };
  if (status === "rejected") return { label: "Нужно переназначить", variant: "danger" };
  return { label: "Ожидает ответа", variant: "default" };
}

export default function TeacherDates() {
  const [items, setItems] = useState<TeacherTesting[]>([]);
  const [drafts, setDrafts] = useState<Record<number, DeliveryDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rejecting, setRejecting] = useState<TeacherTesting | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getTeacherTestings(controller.signal)
      .then((rows) => {
        setItems(rows);
        setDrafts(Object.fromEntries(rows.map((item) => [item.testingId, {
          isInPerson: item.isInPerson === true,
          room: item.room ?? "",
          lmsUrl: item.lmsUrl ?? "",
        }])));
        setError("");
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Не удалось загрузить назначения");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const draftFor = (item: TeacherTesting): DeliveryDraft =>
    drafts[item.testingId] ?? {
      isInPerson: item.isInPerson === true,
      room: item.room ?? "",
      lmsUrl: item.lmsUrl ?? "",
    };

  const updateItem = (updated: TeacherTesting) => {
    setItems((current) => current.map((item) =>
      item.testingId === updated.testingId ? updated : item
    ));
    setDrafts((current) => ({
      ...current,
      [updated.testingId]: {
        isInPerson: updated.isInPerson === true,
        room: updated.room ?? "",
        lmsUrl: updated.lmsUrl ?? "",
      },
    }));
  };

  const saveDelivery = async (item: TeacherTesting) => {
    const draft = draftFor(item);
    setBusyId(item.testingId);
    setError("");
    setNotice("");
    try {
      const updated = await saveTestingDelivery(item.testingId, {
        isInPerson: draft.isInPerson,
        room: draft.isInPerson ? draft.room : null,
        lmsUrl: draft.isInPerson ? null : draft.lmsUrl,
      });
      updateItem(updated);
      setNotice("Формат проведения сохранён.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить формат проведения");
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = async (item: TeacherTesting) => {
    setBusyId(item.testingId);
    setError("");
    setNotice("");
    try {
      updateItem(await approveTesting(item.testingId));
      setNotice("Назначение согласовано.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось согласовать назначение");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting || !rejectComment.trim()) {
      setError("Укажите причину отказа.");
      return;
    }
    setBusyId(rejecting.testingId);
    setError("");
    setNotice("");
    try {
      updateItem(await rejectTesting(rejecting.testingId, rejectComment.trim()));
      setNotice("Назначение отклонено.");
      setRejecting(null);
      setRejectComment("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось отклонить назначение");
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<TeacherTesting>[] = [
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
      header: "Дата и время",
      accessor: (item) => (
        <div>
          <div>{formatDate(item.scheduledDate)}</div>
          <div className="text-blind">{item.scheduledTime?.slice(0, 5) ?? "Время не назначено"}</div>
        </div>
      ),
    },
    {
      header: "Очный формат",
      accessor: (item) => {
        const draft = draftFor(item);
        return (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <CheckBox
              text=""
              type="blue"
              state={draft.isInPerson}
              onChange={(isInPerson) => setDrafts((current) => ({
                ...current,
                [item.testingId]: { ...draftFor(item), isInPerson },
              }))}
            />
          </div>
        );
      },
    },
    {
      header: "Аудитория / LMS",
      accessor: (item) => {
        const draft = draftFor(item);
        const lmsUrl = safeLmsUrl(item.lmsUrl);
        return (
          <div style={{ minWidth: 170, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
            <input
              className="input-field"
              aria-label={draft.isInPerson ? `Аудитория для ${item.groupName}` : `Ссылка LMS для ${item.groupName}`}
              placeholder={draft.isInPerson ? "Аудитория" : "https://…"}
              type={draft.isInPerson ? "text" : "url"}
              value={draft.isInPerson ? draft.room : draft.lmsUrl}
              onChange={(event) => setDrafts((current) => ({
                ...current,
                [item.testingId]: {
                  ...draftFor(item),
                  [draft.isInPerson ? "room" : "lmsUrl"]: event.target.value,
                },
              }))}
            />
            <Button
              color="btn-blue"
              onClick={() => void saveDelivery(item)}
              disabled={busyId === item.testingId}
              style={{ width: "100%", boxSizing: "border-box", marginTop: 6 }}
            >
              Сохранить
            </Button>
            {!draft.isInPerson && lmsUrl && (
              <a
                className="link-lms"
                href={lmsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", marginTop: 6, overflowWrap: "anywhere" }}
              >
                Открыть ссылку
              </a>
            )}
          </div>
        );
      },
    },
    {
      header: "Стадия согласования",
      accessor: (item) => {
        const status = getApprovalStatus(item.approvalStatus);
        return (
          <div>
            <Capsule
              variant={status.variant}
              icon={item.approvalStatus === "approved"
                ? <Check size={16} />
                : item.approvalStatus === "rejected"
                  ? <X size={16} />
                  : <Clock size={16} />}
            >
              {status.label}
            </Capsule>
            {item.comment && <div className="text-blind" style={{ marginTop: 6 }}>{item.comment}</div>}
          </div>
        );
      },
    },
    {
      header: "Действие",
      accessor: (item) => item.approvalStatus === "pending" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 112, marginInline: "auto" }}>
          <Button
            color="btn-blue"
            onClick={() => void handleApprove(item)}
            disabled={busyId === item.testingId}
            style={{ width: "100%", boxSizing: "border-box", textAlign: "center" }}
          >
            Согласовать
          </Button>
          <Button
            color="btn-red"
            onClick={() => {
              setRejecting(item);
              setRejectComment("");
              setError("");
            }}
            disabled={busyId === item.testingId}
            style={{ width: "100%", boxSizing: "border-box", textAlign: "center" }}
          >
            Отклонить
          </Button>
        </div>
      ) : "—",
    },
  ];

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const groupedItems = [...items].sort((a, b) =>
    a.groupName.localeCompare(b.groupName, "ru") ||
    a.disciplineName.localeCompare(b.disciplineName, "ru") ||
    (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? "") ||
    (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? "")
  );
  const pageItems = groupedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="main-container">
      <p className="title text-bold">Сроки проведения тестирования</p>
      <p className="text text-blind">
        Сроки этапов пока не передаются доступным API.
      </p>
      <p className="title text-bold">
        Согласование дат проведения проверки остаточных знаний
      </p>
      {error && !rejecting && <p role="alert" className="modal-error">{error}</p>}
      {notice && <p role="status" className="text">{notice}</p>}
      {loading ? (
        <p className="text text-blind">Загружаем назначения…</p>
      ) : items.length === 0 ? (
        <p className="text text-blind">Назначений для согласования нет.</p>
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
      <Modal
        open={rejecting !== null}
        onClose={() => {
          setRejecting(null);
          setRejectComment("");
        }}
        title="Отклонить назначенное время"
        footer={
          <>
            <button type="button" className="modal-cancel" onClick={() => setRejecting(null)}>
              Отмена
            </button>
            <Button
              color="btn-red"
              onClick={() => void handleReject()}
              disabled={busyId === rejecting?.testingId}
            >
              Отклонить
            </Button>
          </>
        }
      >
        <p className="text">Укажите причину отказа. Её увидит ответственное подразделение.</p>
        {rejecting && error && <p role="alert" className="modal-error">{error}</p>}
        <Input
          hint="Причина отказа"
          value={rejectComment}
          onChange={setRejectComment}
          multiline
          rows={4}
        />
      </Modal>
    </div>
  );
}
