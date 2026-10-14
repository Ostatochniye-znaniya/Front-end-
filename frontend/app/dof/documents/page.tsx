"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, Clock, Download } from "lucide-react";
import Button from "@/components/button/Button";
import Capsule from "@/components/capsule/Capsule";
import Dropdown from "@/components/dropdown/Dropdown";
import SegmentedToggle from "@/components/toggle/SegmentedToggle";
import {
    approveReport,
    approveSchedule,
    DocumentStatus,
    downloadDeanReport,
    downloadDeanSchedule,
    FilterOption,
    getDeanReportFilters,
    getDeanReports,
    getDeanScheduleFilters,
    getDeanSchedules,
    rejectReport,
    rejectSchedule,
    ReportDocument,
    ReportFilterOptions,
    ScheduleDocument,
    ScheduleFilterOptions,
} from "@/services/documents";

// TODO: авторизация ещё интегрируется. Декан работает только со своим факультетом —
// после интеграции брать facultyId из данных пользователя (services/getUserData).
const TEST_FACULTY_ID = 1;

type Tab = "reports" | "schedules";

const TABS = [
    { value: "reports", label: "Отчёты преподавателей" },
    { value: "schedules", label: "Графики ПОЗ" },
];

const ANY_VALUE = "";

const STATUS_VIEW: Record<
    DocumentStatus,
    { variant: "success" | "warning" | "danger"; icon: React.ReactNode }
> = {
    pending: { variant: "warning", icon: <Clock size={16} /> },
    signed: { variant: "success", icon: <Check size={16} /> },
    rejected: { variant: "danger", icon: <AlertCircle size={16} /> },
};

/**
 * Перечитанный после решения декана список приходит в порядке бэкенда, где
 * рассмотренные уходят вниз. Если оставить так, строки съезжают под курсором
 * и следующий клик попадает в чужой документ, поэтому сохраняем прежний порядок:
 * знакомые документы стоят на своих местах, новые — в конце.
 */
function keepOrder<T extends { id: number }>(previous: T[], next: T[]): T[] {
    const position = new Map(previous.map((doc, index) => [doc.id, index]));
    return [...next].sort(
        (a, b) =>
            (position.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
            (position.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    );
}

const withAnyOption = (options: FilterOption[], label: string) => [
    { value: ANY_VALUE, label },
    ...options,
];

const toStatus = (value: string): DocumentStatus | null =>
    value === ANY_VALUE ? null : (value as DocumentStatus);

function StatusCell({ status, label }: { status: DocumentStatus; label: string }) {
    const view = STATUS_VIEW[status] ?? STATUS_VIEW.pending;
    return (
        <Capsule variant={view.variant} icon={view.icon}>
            {label}
        </Capsule>
    );
}

function DownloadButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
    return (
        <Button
            color="btn-blue"
            onClick={onClick}
            disabled={busy}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                color: "white",
                border: "none",
            }}
        >
            <Download size={18} color="white" />
            <span>Скачать</span>
        </Button>
    );
}

function ReviewButtons({
    status,
    busy,
    onApprove,
    onReject,
}: {
    status: DocumentStatus;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
}) {
    // Решение принимают один раз: у рассмотренного документа кнопки неактивны
    const disabled = busy || status !== "pending";

    return (
        <div style={{ display: "flex", gap: "8px" }}>
            <Button
                title="Одобрить"
                color="btn-green"
                onClick={onApprove}
                disabled={disabled}
                style={{ padding: "8px 12px", color: "white", border: "none" }}
            />
            <Button
                title="Отклонить"
                color="btn-red"
                onClick={onReject}
                disabled={disabled}
                style={{ padding: "8px 12px", color: "white", border: "none" }}
            />
        </div>
    );
}

export default function DeanDocuments() {
    const [tab, setTab] = useState<Tab>("reports");

    const [reports, setReports] = useState<ReportDocument[]>([]);
    const [reportFilters, setReportFilters] = useState<ReportFilterOptions | null>(null);
    const [department, setDepartment] = useState(ANY_VALUE);
    const [academicYear, setAcademicYear] = useState(ANY_VALUE);
    const [reportStatus, setReportStatus] = useState(ANY_VALUE);

    const [schedules, setSchedules] = useState<ScheduleDocument[]>([]);
    const [scheduleFilters, setScheduleFilters] = useState<ScheduleFilterOptions | null>(null);
    const [semester, setSemester] = useState(ANY_VALUE);
    const [scheduleStatus, setScheduleStatus] = useState(ANY_VALUE);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // id документа, по которому сейчас идёт действие — блокирует кнопки строки
    const [busyId, setBusyId] = useState<number | null>(null);
    // Увеличивается после решения декана, чтобы перечитать список с теми же фильтрами
    const [reloadToken, setReloadToken] = useState(0);
    // Токен, с которым список грузился в прошлый раз: отличает перечитывание
    // после решения от смены вкладки или фильтра
    const lastReloadToken = useRef(reloadToken);

    // Списки значений для фильтров приходят с бэкенда отдельно от самих документов
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const options =
                    tab === "reports"
                        ? await getDeanReportFilters()
                        : await getDeanScheduleFilters();
                if (cancelled) return;

                if (tab === "reports") setReportFilters(options as ReportFilterOptions);
                else setScheduleFilters(options as ScheduleFilterOptions);
            } catch {
                // Фильтры не критичны: без них просто покажем «Все»
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [tab]);

    // Список перечитывается на каждое изменение вкладки или фильтра;
    // ответ на устаревший фильтр отбрасывается через cancelled
    useEffect(() => {
        let cancelled = false;

        const isReload = lastReloadToken.current !== reloadToken;
        lastReloadToken.current = reloadToken;

        (async () => {
            // При перечитывании не прячем таблицу за «Загрузка…» — строки остаются на месте
            if (!isReload) setLoading(true);
            setError(null);

            try {
                if (tab === "reports") {
                    const data = await getDeanReports({
                        facultyId: TEST_FACULTY_ID,
                        departmentId: department === ANY_VALUE ? null : Number(department),
                        academicYear: academicYear === ANY_VALUE ? null : academicYear,
                        status: toStatus(reportStatus),
                    });
                    if (!cancelled) setReports((prev) => (isReload ? keepOrder(prev, data) : data));
                } else {
                    const data = await getDeanSchedules({
                        facultyId: TEST_FACULTY_ID,
                        semesterId: semester === ANY_VALUE ? null : Number(semester),
                        status: toStatus(scheduleStatus),
                    });
                    if (!cancelled) setSchedules((prev) => (isReload ? keepOrder(prev, data) : data));
                }
            } catch (err) {
                if (cancelled) return;
                setReports([]);
                setSchedules([]);
                setError(err instanceof Error ? err.message : "Не удалось загрузить документы");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [tab, department, academicYear, reportStatus, semester, scheduleStatus, reloadToken]);

    const reportFilterOptions = useMemo(
        () => ({
            departments: withAnyOption(reportFilters?.departments ?? [], "Все кафедры"),
            academicYears: withAnyOption(reportFilters?.academicYears ?? [], "Все годы"),
            statuses: withAnyOption(reportFilters?.statuses ?? [], "Любой статус"),
        }),
        [reportFilters]
    );

    const scheduleFilterOptions = useMemo(
        () => ({
            semesters: withAnyOption(scheduleFilters?.semesters ?? [], "Все семестры"),
            statuses: withAnyOption(scheduleFilters?.statuses ?? [], "Любой статус"),
        }),
        [scheduleFilters]
    );

    /**
     * Выполняет действие над документом. Решение декана меняет статус, поэтому
     * список после него перечитывается; скачивание ничего не меняет.
     */
    const runAction = async (
        id: number,
        action: () => Promise<unknown>,
        { reload = true }: { reload?: boolean } = {}
    ) => {
        setBusyId(id);
        setError(null);
        try {
            const updated = await action();
            if (reload) {
                // Сразу подставляем документ из ответа, чтобы кнопки строки погасли
                // ещё до перечитывания списка и решение нельзя было отправить дважды
                if (updated && typeof updated === "object" && "status" in updated) {
                    if (tab === "reports") {
                        setReports((list) =>
                            list.map((doc) => (doc.id === id ? (updated as ReportDocument) : doc))
                        );
                    } else {
                        setSchedules((list) =>
                            list.map((doc) => (doc.id === id ? (updated as ScheduleDocument) : doc))
                        );
                    }
                }
                setReloadToken((token) => token + 1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Не удалось выполнить действие");
        } finally {
            setBusyId(null);
        }
    };

    const isEmpty = tab === "reports" ? reports.length === 0 : schedules.length === 0;

    return (
        <div className="main-container">
            <p className="title text-bold">Рассмотрение документов</p>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "20px",
                    marginBottom: "20px",
                }}
            >
                <SegmentedToggle
                    options={TABS}
                    value={tab}
                    onChange={(value) => setTab(value as Tab)}
                />
            </div>

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: "16px",
                    marginBottom: "20px",
                }}
            >
                {tab === "reports" ? (
                    <>
                        <Dropdown
                            options={reportFilterOptions.departments}
                            value={department}
                            onChange={setDepartment}
                            placeholder="Все кафедры"
                            label="Кафедра"
                        />
                        <Dropdown
                            options={reportFilterOptions.academicYears}
                            value={academicYear}
                            onChange={setAcademicYear}
                            placeholder="Все годы"
                            label="Учебный год"
                        />
                        <Dropdown
                            options={reportFilterOptions.statuses}
                            value={reportStatus}
                            onChange={setReportStatus}
                            placeholder="Любой статус"
                            label="Статус"
                        />
                    </>
                ) : (
                    <>
                        <Dropdown
                            options={scheduleFilterOptions.semesters}
                            value={semester}
                            onChange={setSemester}
                            placeholder="Все семестры"
                            label="Семестр"
                        />
                        <Dropdown
                            options={scheduleFilterOptions.statuses}
                            value={scheduleStatus}
                            onChange={setScheduleStatus}
                            placeholder="Любой статус"
                            label="Статус"
                        />
                    </>
                )}
            </div>

            {error && (
                <p
                    className="text"
                    style={{ marginBottom: "12px", color: "var(--accent-red-c)" }}
                >
                    {error}
                </p>
            )}

            {loading ? (
                <p className="text" style={{ textAlign: "center" }}>
                    Загрузка…
                </p>
            ) : isEmpty ? (
                <p className="text" style={{ textAlign: "center" }}>
                    Нет документов для отображения
                </p>
            ) : tab === "reports" ? (
                <div className="table-wrapper">
                    <table className="table-container" style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Учебный год</th>
                                <th>Код направления</th>
                                <th>Номер группы</th>
                                <th>Дисциплина</th>
                                <th>ФИО преподавателя</th>
                                <th>Скачать</th>
                                <th>Действия</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr key={report.id}>
                                    <td>{report.academicYear ?? "—"}</td>
                                    <td>{report.studyProgramCode ?? "—"}</td>
                                    <td>{report.groupNumber ?? "—"}</td>
                                    <td>{report.disciplineName ?? "—"}</td>
                                    <td>{report.teacherName ?? "—"}</td>
                                    <td>
                                        <DownloadButton
                                            busy={busyId === report.id}
                                            onClick={() =>
                                                runAction(
                                                    report.id,
                                                    () => downloadDeanReport(report.id),
                                                    { reload: false }
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <ReviewButtons
                                            status={report.status}
                                            busy={busyId === report.id}
                                            onApprove={() =>
                                                runAction(report.id, () => approveReport(report.id))
                                            }
                                            onReject={() =>
                                                runAction(report.id, () => rejectReport(report.id))
                                            }
                                        />
                                    </td>
                                    <td>
                                        <StatusCell
                                            status={report.status}
                                            label={report.statusLabel}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="table-container" style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Период</th>
                                <th>Скачать</th>
                                <th>Действия</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.map((document) => (
                                <tr key={document.id}>
                                    <td>{document.period}</td>
                                    <td>
                                        <DownloadButton
                                            busy={busyId === document.id}
                                            onClick={() =>
                                                runAction(
                                                    document.id,
                                                    () => downloadDeanSchedule(document.id),
                                                    { reload: false }
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <ReviewButtons
                                            status={document.status}
                                            busy={busyId === document.id}
                                            onApprove={() =>
                                                runAction(document.id, () =>
                                                    approveSchedule(document.id)
                                                )
                                            }
                                            onReject={() =>
                                                runAction(document.id, () =>
                                                    rejectSchedule(document.id)
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <StatusCell
                                            status={document.status}
                                            label={document.statusLabel}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
