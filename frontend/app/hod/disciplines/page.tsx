"use client";

import React, { useCallback, useEffect, useState } from "react";
import Button from "@/components/button/Button";
import Pagination from "@/components/pagination/Pagination";
import EditDisciplinesModal from "./EditDisciplinesModal";
import { getDepartment, getGroups, type DisciplineGroupRow } from "@/services/disciplines";

const expandedCellStyle: React.CSSProperties = {
    padding: '12px 16px',
    background: 'var(--background-inner-main-element-c)',
};

const detailTextStyle: React.CSSProperties = {
    margin: '4px 0',
    fontSize: 'var(--font-size-regular)',
    color: 'var(--secondary-font-c)',
};

export default function DisciplineSelection() {
    const [departmentName, setDepartmentName] = useState<string | null>(null);
    const [rows, setRows] = useState<DisciplineGroupRow[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [editingGroup, setEditingGroup] = useState<DisciplineGroupRow | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 10;

    const loadRows = useCallback(() => {
        return getGroups()
            .then(data => {
                setRows(data);
                setLoadError(null);
            })
            .catch((e: unknown) =>
                setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить список групп')
            );
    }, []);

    useEffect(() => {
        let cancelled = false;
        // подпись к заголовку; если не загрузилась — страница работает и без неё
        getDepartment()
            .then(d => {
                if (!cancelled) setDepartmentName(d.name);
            })
            .catch(() => {});
        getGroups()
            .then(data => {
                if (!cancelled) setRows(data);
            })
            .catch((e: unknown) => {
                if (!cancelled) {
                    setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить список групп');
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const toggleRow = (id: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSaved = () => {
        setEditingGroup(null);
        loadRows();
    };

    const toggleBtnStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        color: 'var(--secondary-link-c)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-regular)',
        padding: '0',
    };

    return (
        <div className="main-container">
            <h1 className="text-bold" style={{ marginBottom: '16px' }}>
                Выбор дисциплин
                {departmentName && (
                    <span style={{ color: 'var(--secondary-lock-font-c)', fontWeight: 400, marginLeft: '16px', fontSize: '16px' }}>
                        Кафедра {departmentName}
                    </span>
                )}
            </h1>

            {loadError && <p className="modal-error">{loadError}</p>}
            {!loadError && !rows && <p style={detailTextStyle}>Загрузка...</p>}

            {rows && rows.length === 0 && (
                <p style={detailTextStyle}>
                    В текущем семестре нет групп, выбранных для проверки остаточных знаний.
                </p>
            )}

            {rows && rows.length > 0 && (
                <div className="table-wrapper">
                    <table className="table-container table-container-centered">
                        <thead>
                            <tr>
                                <th>Группа ↕</th>
                                <th>Профиль/специализация</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(row => (
                                <React.Fragment key={row.id}>
                                    <tr>
                                        <td>{row.group}</td>
                                        <td>{row.spec}</td>
                                        <td>
                                            <button
                                                style={toggleBtnStyle}
                                                onClick={() => toggleRow(row.id)}
                                            >
                                                {expandedRows.has(row.id) ? 'Свернуть ∧' : 'Подробнее ∨'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRows.has(row.id) && (
                                        <tr>
                                            <td colSpan={3} style={expandedCellStyle}>
                                                <p style={detailTextStyle}>
                                                    Выбранные дисциплины:{' '}
                                                    {row.disciplines.length > 0
                                                        ? row.disciplines.map(d => d.name).join('; ')
                                                        : 'не выбраны'}
                                                </p>
                                                <div style={{ marginTop: '12px' }}>
                                                    <Button
                                                        title="Редактировать список дисциплин"
                                                        color="btn-blue"
                                                        onClick={() => setEditingGroup(row)}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                siblingCount={2}
                showFirstLast={true}
            />

            {editingGroup && (
                <EditDisciplinesModal
                    key={editingGroup.id}
                    group={editingGroup}
                    onClose={() => setEditingGroup(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
