"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock, Download, AlertCircle } from "lucide-react";
import Button from "@/components/button/Button";
import Capsule from "@/components/capsule/Capsule";
import Dropdown from "@/components/dropdown/Dropdown";
import Dropzone from "@/components/dropzone/Dropzone";
import Pagination from "@/components/pagination/Pagination";
import {
    ALL_SEMESTERS_ID,
    downloadSchedulePdf,
    formatSemesterPeriod,
    getSchedule,
    getSemesters,
    Semester,
    ScheduleRow,
} from "@/services/schedule";
import {
    DocumentApiError,
    DocumentStatus,
    getCurrentScheduleDocument,
    MAX_PDF_SIZE_MB,
    ScheduleDocument,
    uploadSchedulePdf,
    validatePdfFile,
} from "@/services/documents";

// TODO: авторизация ещё интегрируется. Пока факультет подставлен вручную —
// после интеграции брать из данных пользователя (services/getUserData).
const TEST_FACULTY_ID = 1;

// Страницы режем по группам, а не по строкам: номер, группа и профиль — общая
// ячейка на все тестирования группы, и разрывать её между страницами нельзя.
const GROUPS_PER_PAGE = 5;

/** Тестирования одной группы: они делят общие ячейки номера, группы и профиля. */
type GroupBlock = {
    group: string;
    studyProgram: string;
    rows: ScheduleRow[];
};

const STATUS_VIEW: Record<DocumentStatus, { variant: "success" | "warning" | "danger"; icon: React.ReactNode }> = {
    pending: { variant: "warning", icon: <Clock size={16} /> },
    signed: { variant: "success", icon: <Check size={16} /> },
    rejected: { variant: "danger", icon: <AlertCircle size={16} /> },
};

/** Аудитория, а если её нет — LMS, по возможности ссылкой. */
function renderRoom(row: ScheduleRow) {
    if (row.room) return row.room;

    if (row.lmsUrl) {
        return (
            <a
                className="link-lms"
                href={row.lmsUrl}
                target="_blank"
                rel="noopener noreferrer"
            >
                LMS
            </a>
        );
    }

    return "LMS";
}

export default function RodSchedule() {
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [selectedSemester, setSelectedSemester] = useState(String(ALL_SEMESTERS_ID));

    const [rows, setRows] = useState<ScheduleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pdfLoading, setPdfLoading] = useState(false);

    const [uploadedDocument, setUploadedDocument] = useState<ScheduleDocument | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const semesterId = Number(selectedSemester);
    const isSemesterSelected = semesterId !== ALL_SEMESTERS_ID;

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
                const data = await getSchedule(TEST_FACULTY_ID, semesterId);
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
    }, [semesterId]);

    // Ранее отправленный на подпись график — показываем его статус под зоной загрузки
    useEffect(() => {
        let cancelled = false;

        if (!isSemesterSelected) return;

        (async () => {
            try {
                const document = await getCurrentScheduleDocument(semesterId);
                if (!cancelled) setUploadedDocument(document);
            } catch (err) {
                // Ручки может ещё не быть — молчим, чтобы не пугать пустой страницей
                if (!cancelled && !(err instanceof DocumentApiError && err.status === 404)) {
                    setUploadError(err instanceof Error ? err.message : null);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [semesterId, isSemesterSelected]);

    // Статус загрузки относится к конкретному семестру — при смене сбрасываем его
    const handleSemesterChange = (value: string) => {
        setSelectedSemester(value);
        setUploadedDocument(null);
        setUploadError(null);
        setUploadProgress(null);
    };

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

    // Период выбранного семестра — тем же текстом, что уходит в PDF
    const selectedPeriod = useMemo(() => {
        const semester = semesters.find((item) => item.id === semesterId);
        return semester ? formatSemesterPeriod(semester.year, semester.part) : null;
    }, [semesters, semesterId]);

    // Строки уже отсортированы сервисом: по группе, затем по дате и времени
    const groups = useMemo<GroupBlock[]>(() => {
        const result: GroupBlock[] = [];

        for (const row of rows) {
            const last = result[result.length - 1];
            if (last && last.group === row.group) {
                last.rows.push(row);
                continue;
            }
            result.push({ group: row.group, studyProgram: row.studyProgram, rows: [row] });
        }

        return result;
    }, [rows]);

    const totalPages = Math.max(1, Math.ceil(groups.length / GROUPS_PER_PAGE));

    const pageGroups = useMemo(() => {
        const offset = (currentPage - 1) * GROUPS_PER_PAGE;
        return groups
            .slice(offset, offset + GROUPS_PER_PAGE)
            .map((block, index) => ({ ...block, position: offset + index + 1 }));
    }, [groups, currentPage]);

    const handleDownloadPdf = async () => {
        setPdfLoading(true);
        setError(null);
        try {
            await downloadSchedulePdf(TEST_FACULTY_ID, semesterId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Не удалось скачать PDF");
        } finally {
            setPdfLoading(false);
        }
    };

    const handleUpload = useCallback(
        async (file: File) => {
            setUploadError(null);

            const validationError = validatePdfFile(file);
            if (validationError) {
                setUploadError(validationError);
                return;
            }

            setUploadProgress(0);
            try {
                const document = await uploadSchedulePdf(semesterId, file, setUploadProgress);
                setUploadedDocument(document);
            } catch (err) {
                setUploadError(err instanceof Error ? err.message : "Не удалось отправить файл");
            } finally {
                setUploadProgress(null);
            }
        },
        [semesterId]
    );

    const isUploading = uploadProgress !== null;
    // Подписанный график бэкенд заменить не даст — не предлагаем и отправку
    const isSigned = uploadedDocument?.status === "signed";

    return (
        <div className="main-container">
            <p className="title text-bold">Составление графика</p>
            {selectedPeriod && (
                <p className="text" style={{ marginTop: "4px" }}>
                    График проверки остаточных знаний {selectedPeriod}
                </p>
            )}

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
                    onChange={handleSemesterChange}
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
            ) : pageGroups.length === 0 ? (
                <p className="text" style={{ textAlign: "center" }}>
                    Нет данных для отображения
                </p>
            ) : (
                <div className="table-wrapper">
                    <table className="table-container" style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th>№</th>
                                <th>Группа</th>
                                <th>Наименование профиля подготовки</th>
                                <th>Наименование дисциплины</th>
                                <th>Институт / школа</th>
                                <th>Кафедра</th>
                                <th>ФИО ППС</th>
                                <th>Дата и время</th>
                                <th>Аудитория</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageGroups.map((block) =>
                                block.rows.map((row, rowIndex) => (
                                    <tr key={row.id}>
                                        {rowIndex === 0 && (
                                            <>
                                                <td rowSpan={block.rows.length}>{block.position}</td>
                                                <td rowSpan={block.rows.length}>{block.group}</td>
                                                <td rowSpan={block.rows.length}>
                                                    {block.studyProgram}
                                                </td>
                                            </>
                                        )}
                                        <td>{row.discipline}</td>
                                        <td>{row.faculty}</td>
                                        <td>{row.department}</td>
                                        <td>{row.teacher}</td>
                                        <td>{row.dateTime}</td>
                                        <td>{renderRoom(row)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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

            <div style={{ marginTop: "20px" }}>
                <Dropzone
                    accept=".pdf"
                    disabled={!isSemesterSelected || isUploading || isSigned}
                    onFile={handleUpload}
                    title={
                        isUploading
                            ? "Отправляем файл…"
                            : "Перетащите сюда PDF графика для подписания деканом"
                    }
                    hint={
                        !isSemesterSelected
                            ? "Выберите конкретный семестр, чтобы отправить график"
                            : isSigned
                              ? "График на этот семестр уже подписан деканом"
                              : `или нажмите, чтобы выбрать файл — PDF до ${MAX_PDF_SIZE_MB} МБ`
                    }
                />

                {isUploading && (
                    <div className="upload-progress">
                        <div
                            className="upload-progress-bar"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                )}

                {uploadError && (
                    <p
                        className="text"
                        style={{ marginTop: "12px", color: "var(--accent-red-c)" }}
                    >
                        {uploadError}
                    </p>
                )}

                {uploadedDocument && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginTop: "12px",
                        }}
                    >
                        <span className="text">{uploadedDocument.fileName}</span>
                        <Capsule
                            variant={STATUS_VIEW[uploadedDocument.status].variant}
                            icon={STATUS_VIEW[uploadedDocument.status].icon}
                        >
                            {uploadedDocument.statusLabel}
                        </Capsule>
                    </div>
                )}

                {uploadedDocument?.reviewComment && (
                    <p className="text" style={{ marginTop: "8px" }}>
                        Комментарий декана: {uploadedDocument.reviewComment}
                    </p>
                )}
            </div>
        </div>
    );
}
