"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import Button from "@/components/button/Button";
import Capsule from "@/components/capsule/Capsule";
import Dropdown from "@/components/dropdown/Dropdown";
import AssignTeachersModal from "./AssignTeachersModal";
import { getDepartment } from "@/services/disciplines";
import {
    getDepartmentTestings,
    getPairSlots,
    sendExternalRequest,
    type DepartmentTesting,
    type PairSlot,
} from "@/services/teacherAssignments";

type Status = {
    label: string;
    variant: "default" | "success" | "warning" | "danger" | "info";
    icon?: React.ReactNode;
};

const formatDate = (iso: string) => {
    const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("ru-RU");
};

const formatDateTime = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
        ? iso
        : date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

/** Сводный статус проверки для столбца «Статус». */
function statusOf(row: DepartmentTesting): Status {
    if (row.kind === "outgoing" && !row.externalRequestSentAt) {
        return { label: "Нужна заявка", variant: "warning" };
    }
    if (row.teachers.length === 0) {
        return row.kind === "outgoing"
            ? { label: `Ждём назначения кафедрой ${row.disciplineDepartmentName ?? ""}`.trim(), variant: "info", icon: <Clock size={16} /> }
            : { label: "Не назначено", variant: "default" };
    }
    if (row.teachers.some(t => t.status === "rejected")) {
        return { label: "Отклонено", variant: "danger", icon: <X size={16} /> };
    }
    if (!row.scheduledDate) {
        return { label: "Ждём выбор времени", variant: "warning", icon: <Clock size={16} /> };
    }
    if (row.teachers.every(t => t.status === "approved")) {
        return { label: "Согласовано", variant: "success", icon: <Check size={16} /> };
    }
    return { label: "Ждём подтверждения", variant: "info", icon: <Clock size={16} /> };
}

const toOptions = (entries: Map<number, string>) => [
    { value: "", label: "Все" },
    ...[...entries.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "ru"))
        .map(([id, label]) => ({ value: String(id), label })),
];

export default function TeacherSelection() {
    const [departmentName, setDepartmentName] = useState<string | null>(null);
    const [rows, setRows] = useState<DepartmentTesting[] | null>(null);
    const [pairs, setPairs] = useState<PairSlot[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [sendingId, setSendingId] = useState<number | null>(null);
    const [editing, setEditing] = useState<DepartmentTesting | null>(null);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [selectedDiscipline, setSelectedDiscipline] = useState("");

    const loadRows = useCallback(() => {
        return getDepartmentTestings()
            .then(data => {
                setRows(data);
                setLoadError(null);
            })
            .catch((e: unknown) =>
                setLoadError(e instanceof Error ? e.message : "Не удалось загрузить список проверок")
            );
    }, []);

    useEffect(() => {
        let cancelled = false;
        // подпись к заголовку и сетка пар; без них страница работает
        getDepartment()
            .then(d => {
                if (!cancelled) setDepartmentName(d.name);
            })
            .catch(() => {});
        getPairSlots()
            .then(p => {
                if (!cancelled) setPairs(p);
            })
            .catch(() => {});
        getDepartmentTestings()
            .then(data => {
                if (!cancelled) setRows(data);
            })
            .catch((e: unknown) => {
                if (!cancelled) {
                    setLoadError(e instanceof Error ? e.message : "Не удалось загрузить список проверок");
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const groupOptions = useMemo(
        () => toOptions(new Map((rows ?? []).map(r => [r.groupId, r.groupName]))),
        [rows]
    );
    const disciplineOptions = useMemo(
        () => toOptions(new Map((rows ?? []).map(r => [r.disciplineId, r.disciplineName]))),
        [rows]
    );

    const displayedRows = useMemo(
        () =>
            (rows ?? []).filter(
                r =>
                    (!selectedGroup || String(r.groupId) === selectedGroup) &&
                    (!selectedDiscipline || String(r.disciplineId) === selectedDiscipline)
            ),
        [rows, selectedGroup, selectedDiscipline]
    );

    const hasIncoming = (rows ?? []).some(r => r.kind === "incoming");

    const formatPair = (row: DepartmentTesting) => {
        const pair = pairs.find(p => p.pairNumber === row.scheduledPair);
        if (pair) return `${pair.pairNumber} пара, ${pair.startsAt.slice(0, 5)}–${pair.endsAt.slice(0, 5)}`;
        return row.scheduledTime ? row.scheduledTime.slice(0, 5) : "";
    };

    const handleSendRequest = async (row: DepartmentTesting) => {
        setActionError(null);
        setSendingId(row.testingId);
        try {
            await sendExternalRequest(row.testingId);
            await loadRows();
        } catch (e) {
            setActionError(e instanceof Error ? e.message : "Не удалось отправить заявку");
        } finally {
            setSendingId(null);
        }
    };

    const handleSaved = () => {
        setEditing(null);
        loadRows();
    };

    return (
        <div className="main-container">
            <h1 className="text-bold" style={{ marginBottom: "16px" }}>
                Выбор преподавателей
                {departmentName && (
                    <span style={{ color: "var(--secondary-lock-font-c)", fontWeight: 400, marginLeft: "16px", fontSize: "16px" }}>
                        Кафедра {departmentName}
                    </span>
                )}
            </h1>

            <div className="teacher-filters">
                <Dropdown
                    options={groupOptions}
                    value={selectedGroup}
                    onChange={setSelectedGroup}
                    placeholder="Все"
                    label="Группа"
                />
                <Dropdown
                    options={disciplineOptions}
                    value={selectedDiscipline}
                    onChange={setSelectedDiscipline}
                    placeholder="Все"
                    label="Дисциплина"
                />
            </div>

            {hasIncoming && (
                <p className="teacher-legend">
                    <span className="teacher-legend-swatch" aria-hidden="true" />
                    — заявки от кафедр других факультетов
                </p>
            )}

            {loadError && <p className="modal-error">{loadError}</p>}
            {actionError && <p className="modal-error">{actionError}</p>}
            {!loadError && !rows && <p className="teacher-hint">Загрузка...</p>}
            {rows && rows.length === 0 && (
                <p className="teacher-hint">
                    В текущем семестре нет проверок с выбранными дисциплинами.
                </p>
            )}

            {rows && rows.length > 0 && (
                <div className="table-wrapper">
                    <table className="table-container teacher-table">
                        <thead>
                            <tr>
                                <th>Группа</th>
                                <th>Дисциплина</th>
                                <th>Преподаватели</th>
                                <th>Период</th>
                                <th>Дата и время</th>
                                <th>Статус</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedRows.map(row => {
                                const status = statusOf(row);
                                return (
                                    <tr
                                        key={row.testingId}
                                        className={row.kind === "incoming" ? "teacher-row-incoming" : undefined}
                                    >
                                        <td>
                                            {row.groupName}
                                            {row.kind === "incoming" && (
                                                <span
                                                    className="teacher-cell-note"
                                                    title={row.groupFacultyName ?? undefined}
                                                >
                                                    заявка от {row.groupDepartmentName}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {row.disciplineName}
                                            {row.kind === "outgoing" && row.disciplineDepartmentName && (
                                                <span className="teacher-cell-note">
                                                    кафедра {row.disciplineDepartmentName}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {row.teachers.length === 0
                                                ? "—"
                                                : row.teachers.map(t => (
                                                      <span key={t.teacherId} className="teacher-name">
                                                          {t.teacherName ?? `#${t.teacherId}`}
                                                          {t.status === "rejected" && (
                                                              <span className="teacher-rejected">
                                                                  отклонил{t.comment ? `: ${t.comment}` : ""}
                                                              </span>
                                                          )}
                                                      </span>
                                                  ))}
                                        </td>
                                        <td>
                                            {row.periodStart && row.periodEnd
                                                ? `${formatDate(row.periodStart)} – ${formatDate(row.periodEnd)}`
                                                : "—"}
                                        </td>
                                        <td>
                                            {row.scheduledDate ? (
                                                <>
                                                    {formatDate(row.scheduledDate)}
                                                    <span className="teacher-cell-note">{formatPair(row)}</span>
                                                </>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td>
                                            <Capsule variant={status.variant} icon={status.icon}>
                                                {status.label}
                                            </Capsule>
                                        </td>
                                        <td>
                                            {row.canManage && (
                                                <Button
                                                    title={row.teachers.length === 0 ? "Назначить" : "Изменить"}
                                                    color="btn-blue"
                                                    onClick={() => setEditing(row)}
                                                />
                                            )}
                                            {row.kind === "outgoing" && !row.externalRequestSentAt && (
                                                <Button
                                                    title={sendingId === row.testingId ? "Отправка..." : "Отправить заявку"}
                                                    color="btn-blue"
                                                    disabled={sendingId === row.testingId}
                                                    onClick={() => handleSendRequest(row)}
                                                />
                                            )}
                                            {row.kind === "outgoing" && row.externalRequestSentAt && (
                                                <span className="teacher-cell-note">
                                                    заявка отправлена {formatDateTime(row.externalRequestSentAt)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {displayedRows.length === 0 && (
                                <tr>
                                    <td colSpan={7}>Нет проверок по выбранным фильтрам</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {editing && (
                <AssignTeachersModal
                    key={editing.testingId}
                    testing={editing}
                    onClose={() => setEditing(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
