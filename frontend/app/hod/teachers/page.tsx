"use client";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/navbar/Navbar";
import Button from "@/components/button/Button";
import Dropdown from "@/components/dropdown/Dropdown";

const API_BASE_URL = `${typeof window !== "undefined" ? window.location.origin : ""}/csh/api/`;

const navLinks = [
    { label: "Главная", href: "/csh/hod/main" },
    { label: "Выбор групп", href: "/csh/hod/groups" },
    { label: "Выбор дисциплин", href: "/csh/hod/disciplines" },
    { label: "Выбор преподавателей", href: "/csh/hod/teachers" },
];

type TestingDto = {
    id: number;
    groupId: number;
    disciplineId: number;
    reportId: number;
};

type ReportDto = {
    id: number;
    teacherId: number;
    disciplineId: number | null;
};

type TeacherTableRow = {
    testingId: number;
    groupId: number;
    disciplineId: number;
    groupLabel: string;
    disciplineLabel: string;
    showRequestButton: boolean;
    teacherDisplay: "button" | "name" | "na";
    teacherName?: string;
    report: ReportDto | null;
    requestSent: boolean;
};

async function jsonOrNull(res: Response): Promise<unknown | null> {
    if (!res.ok) return null;
    try {
        return await res.json();
    } catch {
        return null;
    }
}

export default function TeacherSelection() {
    const [rows, setRows] = useState<TeacherTableRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [selectedDiscipline, setSelectedDiscipline] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const userRes = await fetch(
                    `${API_BASE_URL}User/GetCurrentUserDataTest/current`
                );
                if (!userRes.ok) {
                    throw new Error("Не удалось загрузить данные пользователя");
                }
                const userData = (await userRes.json()) as { departmentId: number };
                const deptId = userData.departmentId;

                const testRes = await fetch(
                    `${API_BASE_URL}Testing/GetTestingsByDepartment/department/${deptId}`
                );
                if (!testRes.ok) {
                    throw new Error("Не удалось загрузить список тестирований");
                }
                const testings = (await testRes.json()) as TestingDto[];

                const built = await Promise.all(
                    testings.map(async (testing): Promise<TeacherTableRow> => {
                        try {
                            const groupJson = (await jsonOrNull(
                                await fetch(
                                    `${API_BASE_URL}StudyGroup/GetById/${testing.groupId}`
                                )
                            )) as { groupNumber?: string } | null;
                            const disciplineJson = (await jsonOrNull(
                                await fetch(
                                    `${API_BASE_URL}Discipline/GetDisciplineById/${testing.disciplineId}`
                                )
                            )) as { name?: string; departmentId?: number } | null;

                            const groupLabel =
                                groupJson?.groupNumber ?? `Группа #${testing.groupId}`;
                            const disciplineLabel =
                                disciplineJson?.name ?? `Дисциплина #${testing.disciplineId}`;
                            const disciplineDeptId = disciplineJson?.departmentId ?? deptId;
                            const showRequestButton = deptId !== disciplineDeptId;

                            const reportJson = (await jsonOrNull(
                                await fetch(
                                    `${API_BASE_URL}Report/GetReportById/${testing.reportId}`
                                )
                            )) as ReportDto | null;

                            const requestSentFromReport =
                                !!reportJson &&
                                reportJson.disciplineId != null &&
                                reportJson.disciplineId !== 0;

                            if (showRequestButton) {
                                return {
                                    testingId: testing.id,
                                    groupId: testing.groupId,
                                    disciplineId: testing.disciplineId,
                                    groupLabel,
                                    disciplineLabel,
                                    showRequestButton: true,
                                    teacherDisplay: "button",
                                    report: reportJson,
                                    requestSent: requestSentFromReport,
                                };
                            }

                            if (!reportJson) {
                                return {
                                    testingId: testing.id,
                                    groupId: testing.groupId,
                                    disciplineId: testing.disciplineId,
                                    groupLabel,
                                    disciplineLabel,
                                    showRequestButton: false,
                                    teacherDisplay: "na",
                                    report: null,
                                    requestSent: false,
                                };
                            }

                            const teacherJson = (await jsonOrNull(
                                await fetch(
                                    `${API_BASE_URL}User/GetUserById/${reportJson.teacherId}`
                                )
                            )) as { name?: string } | null;

                            return {
                                testingId: testing.id,
                                groupId: testing.groupId,
                                disciplineId: testing.disciplineId,
                                groupLabel,
                                disciplineLabel,
                                showRequestButton: false,
                                teacherDisplay: "name",
                                teacherName: teacherJson?.name ?? "N/A",
                                report: reportJson,
                                requestSent: false,
                            };
                        } catch {
                            return {
                                testingId: testing.id,
                                groupId: testing.groupId,
                                disciplineId: testing.disciplineId,
                                groupLabel: "—",
                                disciplineLabel: "—",
                                showRequestButton: false,
                                teacherDisplay: "na",
                                report: null,
                                requestSent: false,
                            };
                        }
                    })
                );

                if (!cancelled) setRows(built);
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Ошибка загрузки");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const groupOptions = useMemo(() => {
        const map = new Map<number, string>();
        rows.forEach((r) => map.set(r.groupId, r.groupLabel));
        const rest = [...map.entries()]
            .sort((a, b) => a[1].localeCompare(b[1], "ru"))
            .map(([id, label]) => ({ value: String(id), label }));
        return [{ value: "", label: "Не выбрано" }, ...rest];
    }, [rows]);

    const disciplineOptions = useMemo(() => {
        const map = new Map<number, string>();
        rows.forEach((r) => map.set(r.disciplineId, r.disciplineLabel));
        const rest = [...map.entries()]
            .sort((a, b) => a[1].localeCompare(b[1], "ru"))
            .map(([id, label]) => ({ value: String(id), label }));
        return [{ value: "", label: "Не выбрано" }, ...rest];
    }, [rows]);

    const displayedRows = useMemo(() => {
        return rows.filter((r) => {
            if (selectedGroup && String(r.groupId) !== selectedGroup) return false;
            if (selectedDiscipline && String(r.disciplineId) !== selectedDiscipline) {
                return false;
            }
            return true;
        });
    }, [rows, selectedGroup, selectedDiscipline]);

    const sendDisciplineRequest = async (row: TeacherTableRow) => {
        if (!row.report) return;
        try {
            const res = await fetch(
                `${API_BASE_URL}Report/ReportDisciplineIdUpdate/${row.report.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ disciplineId: row.disciplineId }),
                }
            );
            if (res.ok) {
                setRows((prev) =>
                    prev.map((r) =>
                        r.testingId === row.testingId ? { ...r, requestSent: true } : r
                    )
                );
            }
        } catch {
            /* сеть / CORS — оставляем кнопку активной */
        }
    };

    return (
        <div className="bg-container">
            <div className="bg-gradient"></div>
            <Navbar
                title="Проверка остаточных знаний"
                linkOptions={navLinks}
                name="Иван"
                surname="Иванов"
                lastname="Иванович"
            />
            <div className="main-container">
                <h1 className="text-bold" style={{ marginBottom: "16px" }}>
                    Выбор преподавателей
                </h1>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "16px",
                        marginBottom: "20px",
                    }}
                >
                    <Dropdown
                        options={groupOptions}
                        value={selectedGroup}
                        onChange={setSelectedGroup}
                        placeholder="Не выбрано"
                        label="Группа"
                    />
                    <Dropdown
                        options={disciplineOptions}
                        value={selectedDiscipline}
                        onChange={setSelectedDiscipline}
                        placeholder="Не выбрано"
                        label="Дисциплина"
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

                <table className="table-container">
                    <thead>
                        <tr>
                            <th>Группа</th>
                            <th>Дисциплина</th>
                            <th>Преподаватель</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={3} style={{ textAlign: "center" }}>
                                    Загрузка…
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            displayedRows.map((row) => (
                                <tr key={row.testingId}>
                                    <td>{row.groupLabel}</td>
                                    <td>{row.disciplineLabel}</td>
                                    <td>
                                        {row.teacherDisplay === "button" && (
                                            <Button
                                                title={
                                                    row.requestSent
                                                        ? "Запрос отправлен"
                                                        : "Отправить запрос"
                                                }
                                                color="btn-blue"
                                                disabled={row.requestSent}
                                                onClick={() => sendDisciplineRequest(row)}
                                            />
                                        )}
                                        {row.teacherDisplay === "name" && row.teacherName}
                                        {row.teacherDisplay === "na" && "N/A"}
                                    </td>
                                </tr>
                            ))}
                        {!loading && displayedRows.length === 0 && !error && (
                            <tr>
                                <td colSpan={3} style={{ textAlign: "center" }}>
                                    Нет данных для отображения
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
