"use client";

import React, { useState } from "react";
import Navbar from "@/components/navbar/Navbar";
import Button from "@/components/button/Button";
import Dropdown from "@/components/dropdown/Dropdown";
import Checkbox from "@/components/checkbox/CheckBox";

import { Home, Users, BookOpen, GraduationCap } from 'lucide-react';

const navLinks = [
    { label: "Главная",              href: "/csh/hod/main",        icon: Home },
    { label: "Выбор групп",          href: "/csh/hod/groups",      icon: Users },
    { label: "Выбор дисциплин",      href: "/csh/hod/disciplines", icon: BookOpen },
    { label: "Выбор преподавателей", href: "/csh/hod/teachers",    icon: GraduationCap },
];

const directions = ["ИСИТ", "ПМИ", "ИВТ"];

const years = [
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
];

const semestrs = [
    { value: 'spring', label: 'Весна' },
    { value: 'fall', label: 'Осень' },
];

type GroupRow = {
    group: string;
    course: number;
    past: boolean[];   // 3 предыдущих тестирования
    current: boolean;  // текущее тестирование
    schedule: boolean[]; // 2 запланированных
};

const groupsData: GroupRow[] = [
    { group: "211-111", course: 4, past: [false, true, true], current: false, schedule: [true, false] },
    { group: "221-112", course: 3, past: [false, true, true], current: true,  schedule: [false, true] },
    { group: "231-113", course: 2, past: [false, true, true], current: true,  schedule: [true, false] },
    { group: "241-114", course: 1, past: [false, true, true], current: false, schedule: [true, false] },
];

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <circle cx="8" cy="8" r="7" fill="var(--accent-blue-c)" />
        <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CrossIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <circle cx="8" cy="8" r="7" fill="var(--accent-red-c)" />
        <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

export default function GroupSelection() {
    const [directionIndex, setDirectionIndex] = useState(0);
    const [selectedYear, setSelectedYear] = useState('2025');
    const [selectedSemestr, setSelectedSemestr] = useState('spring');
    const [scheduleState, setScheduleState] = useState<boolean[][]>(
        groupsData.map(g => [...g.schedule])
    );

    const handleScheduleChange = (rowIdx: number, colIdx: number, value: boolean) => {
        setScheduleState(prev => {
            const next = prev.map(row => [...row]);
            next[rowIdx][colIdx] = value;
            return next;
        });
    };

    const navBtnStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        color: 'var(--secondary-link-c)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-regular)',
        padding: '8px 12px',
        opacity: 1,
    };

    const navBtnDisabledStyle: React.CSSProperties = {
        ...navBtnStyle,
        color: 'var(--secondary-lock-font-c)',
        cursor: 'default',
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
                <h1 className="text-bold" style={{ marginBottom: '16px' }}>
                    Выбор групп
                    <span style={{ color: 'var(--secondary-lock-font-c)', fontWeight: 400, marginLeft: '16px', fontSize: '16px' }}>
                        Кафедра ИиИТ
                    </span>
                </h1>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <Dropdown
                        options={directions.map(d => ({ value: d, label: d }))}
                        value={directions[directionIndex]}
                        onChange={(v) => setDirectionIndex(directions.indexOf(v))}
                        placeholder="Не выбрано"
                        label="Направление"
                    />
                    <Dropdown
                        options={years}
                        value={selectedYear}
                        onChange={setSelectedYear}
                        placeholder="Не выбрано"
                        label="Учебный год"
                    />
                    <Dropdown
                        options={semestrs}
                        value={selectedSemestr}
                        onChange={setSelectedSemestr}
                        placeholder="Не выбрано"
                        label="Семестр"
                    />
                </div>

                <table className="table-container">
                    <thead>
                        <tr>
                            <th rowSpan={2}>Группа ↕</th>
                            <th rowSpan={2}>Курс ↕</th>
                            <th colSpan={3}>Предыдущие тестирования</th>
                            <th colSpan={1}>Текущее тестирование</th>
                            <th colSpan={2}>Запланировать тестирование</th>
                        </tr>
                        <tr>
                            <th>весна 2023</th>
                            <th>осень 2023</th>
                            <th>весна 2024</th>
                            <th>весна 2025</th>
                            <th>осень 2025</th>
                            <th>весна 2026</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupsData.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                <td>{row.group}</td>
                                <td>{row.course}</td>
                                {row.past.map((val, i) => (
                                    <td key={i} style={{ textAlign: 'center' }}>
                                        {val ? <CheckIcon /> : <CrossIcon />}
                                    </td>
                                ))}
                                <td style={{ textAlign: 'center' }}>
                                    {row.current ? <CheckIcon /> : <CrossIcon />}
                                </td>
                                {scheduleState[rowIdx].map((val, colIdx) => (
                                    <td key={colIdx} style={{ textAlign: 'center' }}>
                                        <Checkbox
                                            text=""
                                            state={val}
                                            type="blue"
                                            onChange={(newVal) => handleScheduleChange(rowIdx, colIdx, newVal)}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                    <button
                        style={directionIndex === 0 ? navBtnDisabledStyle : navBtnStyle}
                        onClick={() => setDirectionIndex(i => Math.max(0, i - 1))}
                        disabled={directionIndex === 0}
                    >
                        &lt; Пред. направление
                    </button>
                    <Button
                        title="Выбрать группы для тестирования"
                        color="btn-blue"
                        onClick={() => {}}
                    />
                    <button
                        style={directionIndex === directions.length - 1 ? navBtnDisabledStyle : navBtnStyle}
                        onClick={() => setDirectionIndex(i => Math.min(directions.length - 1, i + 1))}
                        disabled={directionIndex === directions.length - 1}
                    >
                        След. направление &gt;
                    </button>
                </div>
            </div>
        </div>
    );
}
