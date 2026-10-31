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
  getTeacherStageDeadlines,
  getTeacherTestings,
  rejectTesting,
  saveTestingDelivery,
  saveTestingTime,
  validateTestingSchedule,
  TeacherStageDeadlines,
  TeacherTesting,
} from "@/services/teacherWorkflow";

type DeliveryDraft = {
  isInPerson: boolean;
  room: string;
  lmsUrl: string;
};

type TimeDraft = {
  date: string;
  pairNumber: string;
};

type StageDeadlineRow = {
  id: string;
  stage: string;
  date: string;
  variant: "danger" | "success";
};

const PAIRS = [
  { number: 1, time: "09:00–10:30" },
  { number: 2, time: "10:40–12:10" },
  { number: 3, time: "12:40–14:10" },
  { number: 4, time: "14:20–15:50" },
  { number: 5, time: "16:00–17:30" },
  { number: 6, time: "17:40–19:10" },
  { number: 7, time: "19:20–20:50" },
];

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
  const [stageDeadlines, setStageDeadlines] = useState<TeacherStageDeadlines | null>(null);
  const [drafts, setDrafts] = useState<Record<number, DeliveryDraft>>({});
  const [timeDrafts, setTimeDrafts] = useState<Record<number, TimeDraft>>({});
  const [loading, setLoading] = useState(true);
  const [deadlinesLoading, setDeadlinesLoading] = useState(true);
  const [error, setError] = useState("");
  const [deadlinesError, setDeadlinesError] = useState("");
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
        setTimeDrafts(Object.fromEntries(rows.map((item) => [item.testingId, {
          date: item.scheduledDate ?? item.selectionPeriodStart ?? "",
          pairNumber: String(item.scheduledPair ?? 1),
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
    getTeacherStageDeadlines(controller.signal)
      .then((rows) => {
        setStageDeadlines(rows);
        setDeadlinesError("");
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setDeadlinesError(reason instanceof Error ? reason.message : "Не удалось загрузить сроки этапов");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDeadlinesLoading(false);
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
    setTimeDrafts((current) => ({
      ...current,
      [updated.testingId]: {
        date: updated.scheduledDate ?? updated.selectionPeriodStart ?? "",
        pairNumber: String(updated.scheduledPair ?? 1),
      },
    }));
  };

  const timeDraftFor = (item: TeacherTesting): TimeDraft =>
    timeDrafts[item.testingId] ?? {
      date: item.scheduledDate ?? item.selectionPeriodStart ?? "",
      pairNumber: String(item.scheduledPair ?? 1),
    };

  const saveDelivery = async (item: TeacherTesting) => {
    const draft = draftFor(item);
    setBusyId(item.testingId);
    setError("");
    setNotice("");
    try {
      const scheduledPair = item.scheduledPair ??
        PAIRS.find((pair) => pair.time.startsWith(item.scheduledTime?.slice(0, 5) ?? ""))?.number;
      if (item.scheduledDate && scheduledPair) {
        await validateTestingSchedule(item.testingId, item.scheduledDate, scheduledPair, {
          isInPerson: draft.isInPerson,
          room: draft.isInPerson ? draft.room : null,
          lmsUrl: draft.isInPerson ? null : draft.lmsUrl,
        });
      }
      const updated = await saveTestingDelivery(item.testingId, {
        isInPerson: draft.isInPerson,
        room: draft.isInPerson ? draft.room : null,
        lmsUrl: draft.isInPerson ? null : draft.lmsUrl,
      });
      updateItem(updated);
      setNotice(item.approvalStatus === "approved" && updated.approvalStatus === "pending"
        ? "Формат проведения изменён. Теперь согласуйте назначение."
        : "Формат проведения сохранён.");
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
      const scheduledPair = item.scheduledPair ??
        PAIRS.find((pair) => pair.time.startsWith(item.scheduledTime?.slice(0, 5) ?? ""))?.number;
      if (!item.scheduledDate || !scheduledPair) {
        setError("Сначала выберите дату и пару.");
        return;
      }
      await validateTestingSchedule(item.testingId, item.scheduledDate, scheduledPair, {
        isInPerson: item.isInPerson === true,
        room: item.isInPerson === true ? item.room : null,
        lmsUrl: item.isInPerson === false ? item.lmsUrl : null,
      });
      updateItem(await approveTesting(item.testingId));
      setNotice("Назначение согласовано.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось согласовать назначение");
    } finally {
      setBusyId(null);
    }
  };

  const saveTime = async (item: TeacherTesting) => {
    const draft = timeDraftFor(item);
    if (!draft.date || !draft.pairNumber) {
      setError("Выберите дату и номер пары.");
      return;
    }
    setBusyId(item.testingId);
    setError("");
    setNotice("");
    try {
      await validateTestingSchedule(item.testingId, draft.date, Number(draft.pairNumber), {
        isInPerson: item.isInPerson === true,
        room: item.isInPerson === true ? item.room : null,
        lmsUrl: item.isInPerson === false ? item.lmsUrl : null,
      });
      const updated = await saveTestingTime(item, draft.date, Number(draft.pairNumber));
      updateItem(updated);
      setNotice(item.approvalStatus === "approved" && updated.approvalStatus === "pending"
        ? "Дата и время изменены. Теперь согласуйте назначение."
        : "Дата и время тестирования сохранены.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить дату и время");
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
      accessor: (item) => {
        const draft = timeDraftFor(item);
        const canChooseTime = Boolean(item.selectionPeriodStart && item.selectionPeriodEnd) &&
          (item.approvalStatus === "approved" || item.approvalStatus === "pending");
        return (
          <div style={{ minWidth: 170 }}>
            {canChooseTime ? (
              <>
                <input
                  className="input-field"
                  type="date"
                  aria-label={`Дата проверки для ${item.groupName}`}
                  min={item.selectionPeriodStart ?? undefined}
                  max={item.selectionPeriodEnd ?? undefined}
                  value={draft.date}
                  onChange={(event) => setTimeDrafts((current) => ({
                    ...current,
                    [item.testingId]: { ...draft, date: event.target.value },
                  }))}
                />
                <select
                  className="input-field"
                  aria-label={`Пара для ${item.groupName}`}
                  value={draft.pairNumber}
                  onChange={(event) => setTimeDrafts((current) => ({
                    ...current,
                    [item.testingId]: { ...draft, pairNumber: event.target.value },
                  }))}
                  style={{ marginTop: 6 }}
                >
                  {PAIRS.map((pair) => (
                    <option key={pair.number} value={pair.number}>
                      {pair.number}-я пара ({pair.time})
                    </option>
                  ))}
                </select>
                <Button
                  color="btn-blue"
                  onClick={() => void saveTime(item)}
                  disabled={busyId === item.testingId}
                  style={{ width: "100%", boxSizing: "border-box", marginTop: 6 }}
                >
                  {item.approvalStatus === "approved"
                    ? "Изменить"
                    : item.scheduledDate ? "Сохранить" : "Выбрать"}
                </Button>
              </>
            ) : (
              <>
                <div>{formatDate(item.scheduledDate)}</div>
                <div className="text-blind">
                  {item.scheduledTime?.slice(0, 5) ?? "Время не назначено"}
                </div>
              </>
            )}
            {item.selectionPeriodStart && item.selectionPeriodEnd && (
              <div className="text-blind" style={{ marginTop: 4 }}>
                Период: {formatDate(item.selectionPeriodStart)} – {formatDate(item.selectionPeriodEnd)}
              </div>
            )}
          </div>
        );
      },
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
      accessor: (item) => {
        const delivery = draftFor(item);
        const locationSaved = item.isInPerson !== null &&
          delivery.isInPerson === item.isInPerson &&
          (item.isInPerson
            ? Boolean(item.room?.trim()) && delivery.room.trim() === item.room?.trim()
            : Boolean(item.lmsUrl?.trim()) && delivery.lmsUrl.trim() === item.lmsUrl?.trim());

        if (item.approvalStatus !== "pending") return "—";
        if (!item.scheduledDate || !item.scheduledTime) return "Сначала выберите дату и пару.";

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 112, marginInline: "auto" }}>
            {locationSaved ? (
              <Button
                color="btn-blue"
                onClick={() => void handleApprove(item)}
                disabled={busyId === item.testingId}
                style={{ width: "100%", boxSizing: "border-box", textAlign: "center" }}
              >
                Согласовать
              </Button>
            ) : (
              <div className="text-blind">Сохраните аудиторию или ссылку для согласования.</div>
            )}
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
        );
      },
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
  const formatPeriod = (start: string, end: string) =>
    `${formatDate(start)} – ${formatDate(end)}`;
  const stageRows: StageDeadlineRow[] = stageDeadlines ? [
    {
      id: `testing-${stageDeadlines.orderId}`,
      stage: "Контроль знаний",
      date: formatPeriod(stageDeadlines.testingStartDate, stageDeadlines.testingEndDate),
      variant: "danger",
    },
    {
      id: `electronic-${stageDeadlines.orderId}`,
      stage: "Сдача электронных отчетов",
      date: `до ${formatDate(stageDeadlines.electronicReportDeadline)}`,
      variant: "success",
    },
    {
      id: `paper-${stageDeadlines.orderId}`,
      stage: "Сдача бумажных отчетов",
      date: `до ${formatDate(stageDeadlines.paperReportDeadline)}`,
      variant: "success",
    },
  ] : [];
  const stageColumns: Column<StageDeadlineRow>[] = [
    { header: "Этап", accessor: "stage", style: { width: "60%" } },
    {
      header: "Дата",
      accessor: (row) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Capsule variant={row.variant}>{row.date}</Capsule>
        </div>
      ),
      style: { width: "40%" },
    },
  ];

  return (
    <div className="main-container">
      <p className="title text-bold">Сроки проведения тестирования</p>
      {deadlinesLoading ? (
        <p className="text text-blind">Загружаем сроки этапов…</p>
      ) : deadlinesError ? (
        <p role="alert" className="modal-error">{deadlinesError}</p>
      ) : !stageDeadlines ? (
        <p className="text text-blind">Сроки этапов ещё не опубликованы.</p>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <Table
            style={{ width: "100%" }}
            columns={stageColumns}
            data={stageRows}
          />
        </div>
      )}
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
