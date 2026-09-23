"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import Button from "@/components/button/Button";
import Dropdown from "@/components/dropdown/Dropdown";
import Pagination from "@/components/pagination/Pagination";
import Table, { Column } from "@/components/table/Table";
import {
    ALL_SEMESTERS_ID,
    downloadSchedulePdf,
    getSchedule,
    getSemesters,
    Semester,
    ScheduleRow,
} from "@/services/schedule";

// TODO: авторизация ещё интегрируется. Пока факультет подставлен вручную —
// после интеграции брать из данных пользователя (services/getUserData).
const TEST_FACULTY_ID = 1;

const ROWS_PER_PAGE = 10;

type NumberedRow = ScheduleRow & { position: number };

const columns: Column<NumberedRow>[] = [
    { header: "№ п/п",                  accessor: "position" },
    { header: "Группа",                 accessor: "group" },
    { header: "Профиль подготовки",     accessor: "studyProgram" },
    { header: "Наименование дисциплины", accessor: "discipline" },
    { header: "Кафедра",                accessor: "department" },
    { header: "ФИО ППС",                accessor: "teacher" },
    { header: "Дата проведения",        accessor: "date" },
    { header: "Время проведения",       accessor: "time" },
];

export default function RodSchedule() {
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [selectedSemester, setSelectedSemester] = useState(String(ALL_SEMESTERS_ID));

    const [rows, setRows] = useState<ScheduleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pdfLoading, setPdfLoading] = useState(false);

    // Список семестров грузим один раз
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const data = await getSemesters();
                if (!cancelled) setSemesters(data);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Не удалось загрузить семестры");
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // Таблица перезапрашивается на каждое изменение фильтра
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getSchedule(TEST_FACULTY_ID, Number(selectedSemester));
                if (cancelled) return;
                setRows(data);
                setCurrentPage(1);
            } catch (err) {
                if (cancelled) return;
                setRows([]);
                setError(err instanceof Error ? err.message : "Не удалось загрузить график");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [selectedSemester]);

    const semesterOptions = useMemo(
        () => [
            { value: String(ALL_SEMESTERS_ID), label: "Все семестры" },
            ...semesters.map((semester) => ({
                value: String(semester.id),
                label: semester.label,
            })),
        ],
        [semesters]
    );

    // Пагинация на бэкенде не предусмотрена — режем выборку на клиенте
    const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));

    const pageRows = useMemo<NumberedRow[]>(() => {
        const offset = (currentPage - 1) * ROWS_PER_PAGE;
        return rows.slice(offset, offset + ROWS_PER_PAGE).map((row, index) => ({
            ...row,
            position: offset + index + 1,
        }));
    }, [rows, currentPage]);

    const handleDownloadPdf = async () => {
        setPdfLoading(true);
        setError(null);
        try {
            await downloadSchedulePdf(TEST_FACULTY_ID, Number(selectedSemester));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Не удалось скачать PDF");
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <div className="main-container">
            <p className="title text-bold">Составление графика</p>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "20px",
                    marginBottom: "20px",
                }}
            >
                <Dropdown
                    options={semesterOptions}
                    value={selectedSemester}
                    onChange={setSelectedSemester}
                    placeholder="Все семестры"
                    label="Семестр"
                />
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
            ) : pageRows.length === 0 ? (
                <p className="text" style={{ textAlign: "center" }}>
                    Нет данных для отображения
                </p>
            ) : (
                <Table style={{ width: "100%" }} columns={columns} data={pageRows} />
            )}

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "20px",
                }}
            >
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    siblingCount={1}
                    showFirstLast={true}
                />
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "20px",
                }}
            >
                <Button
                    color="btn-blue"
                    onClick={handleDownloadPdf}
                    disabled={pdfLoading}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        width: "fit-content",
                        padding: "10px 16px",
                        color: "white",
                        border: "none",
                        cursor: pdfLoading ? "default" : "pointer",
                    }}
                >
                    <Download size={24} color="white" />
                    <span>{pdfLoading ? "Формируется…" : "Скачать PDF"}</span>
                </Button>
            </div>
        </div>
    );
}
