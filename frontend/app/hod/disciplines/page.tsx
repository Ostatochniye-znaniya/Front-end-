"use client";

import React, { useState } from "react";
import Navbar from "@/components/navbar/Navbar";
import Button from "@/components/button/Button";
import Dropdown from "@/components/dropdown/Dropdown";
import Pagination from "@/components/pagination/Pagination";

import { PieChart, Users, BookOpen, GraduationCap } from 'lucide-react';

const navLinks = [
    { label: "Статистика",              href: "/csh/hod/statistics",        icon: PieChart },
    { label: "Выбор групп",          href: "/csh/hod/groups",      icon: Users },
    { label: "Выбор дисциплин",      href: "/csh/hod/disciplines", icon: BookOpen },
    { label: "Выбор преподавателей", href: "/csh/hod/teachers",    icon: GraduationCap },
];

const faculties = [
    { value: 'fit', label: 'ФИТ' },
    { value: 'fm', label: 'ФМ' },
    { value: 'tf', label: 'ТФ' },
];

const departments = [
    { value: 'iiit', label: 'ИиИТ' },
    { value: 'ib', label: 'ИБ' },
    { value: 'ikt', label: 'ИКТ' },
];

type DisciplineRow = {
    faculty: string;
    department: string;
    group: string;
    spec: string;
    teacher: string;
    recommender: string;
};

const disciplinesData: DisciplineRow[] = [
    { faculty: "ФИТ", department: "ИиИТ", group: "241-331", spec: "АСОИУ", teacher: "Иванов И.И.", recommender: "Иванов И.И." },
    { faculty: "ФИТ", department: "ИиИТ", group: "241-332", spec: "АСОИУ", teacher: "Иванов И.И.", recommender: "Иванов И.И." },
    { faculty: "ФИТ", department: "ИиИТ", group: "241-333", spec: "АСОИУ", teacher: "Иванов И.И.", recommender: "Иванов И.И." },
    { faculty: "ФИТ", department: "ИиИТ", group: "241-334", spec: "АСОИУ", teacher: "Иванов И.И.", recommender: "Иванов И.И." },
];

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
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 10;

    const toggleRow = (idx: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
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
        <div className="bg-container">
            <div className="bg-gradient"></div>
            <Navbar
                title="Проверка остаточных знаний"
                linkOptions={navLinks}
                name="Иван"
                surname="Иванов"
                lastname="Иванович"
                role="Заведующий кафедрой"
            />
            <div className="main-container">
                <h1 className="text-bold" style={{ marginBottom: '16px' }}>Выбор дисциплин</h1>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <Dropdown
                        options={faculties}
                        value={selectedFaculty}
                        onChange={setSelectedFaculty}
                        placeholder="Не выбрано"
                        label="Факультет/институт"
                    />
                    <Dropdown
                        options={departments}
                        value={selectedDepartment}
                        onChange={setSelectedDepartment}
                        placeholder="Не выбрано"
                        label="Кафедра"
                    />
                </div>
                <div className="table-wrapper">
                <table className="table-container">
                    <thead>
                        <tr>
                            <th>Факультет ↕</th>
                            <th>Кафедра ↕</th>
                            <th>Группа ↕</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {disciplinesData.map((row, idx) => (
                            <React.Fragment key={idx}>
                                <tr>
                                    <td>{row.faculty}</td>
                                    <td>{row.department}</td>
                                    <td>{row.group}</td>
                                    <td>
                                        <button
                                            style={toggleBtnStyle}
                                            onClick={() => toggleRow(idx)}
                                        >
                                            {expandedRows.has(idx) ? 'Свернуть ∧' : 'Подробнее ∨'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedRows.has(idx) && (
                                    <tr>
                                        <td colSpan={4} style={expandedCellStyle}>
                                            <p style={detailTextStyle}>Факультет/институт: {row.faculty}</p>
                                            <p style={detailTextStyle}>Подразделение (Кафедра): {row.department}</p>
                                            <p style={detailTextStyle}>Профиль/специализация: {row.spec}</p>
                                            <p style={detailTextStyle}>Ответственный преподаватель: {row.teacher}</p>
                                            <p style={detailTextStyle}>Группу порекомендовал к проверке: {row.recommender}</p>
                                            <div style={{ marginTop: '12px' }}>
                                                <Button
                                                    title="Редактировать список дисциплин"
                                                    color="btn-blue"
                                                    onClick={() => {
                                                        window.location.href = `/csh/hod/disciplines/edit?group=${row.group}`;
                                                    }}
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
                
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    siblingCount={2}
                    showFirstLast={true}
                />
            </div>
        </div>
    );
}
