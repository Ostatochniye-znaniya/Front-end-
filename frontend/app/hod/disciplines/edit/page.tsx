"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/navbar/Navbar";
import Button from "@/components/button/Button";

const navLinks = [
    { label: "Главная", href: "/csh/hod/main" },
    { label: "Выбор групп", href: "/csh/hod/groups" },
    { label: "Выбор дисциплин", href: "/csh/hod/disciplines" },
    { label: "Выбор преподавателей", href: "/csh/hod/teachers" },
];

type Discipline = {
    id: number;
    name: string;
};

const initialDisciplines: Discipline[] = [
    { id: 1, name: "Математический анализ" },
    { id: 2, name: "Прототипирование интерфейсов информационных систем" },
    { id: 3, name: "Введение в программирование" },
    { id: 4, name: "Офисные приложения" },
];

const deleteBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--accent-red-c)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-regular)',
    padding: '0',
};

function EditDisciplinesContent() {
    const searchParams = useSearchParams();
    const group = searchParams.get('group') ?? '241-334';

    const [disciplines, setDisciplines] = useState<Discipline[]>(initialDisciplines);

    const handleDelete = (id: number) => {
        setDisciplines(prev => prev.filter(d => d.id !== id));
    };

    const handleAdd = () => {
        const newId = Math.max(...disciplines.map(d => d.id), 0) + 1;
        setDisciplines(prev => [...prev, { id: newId, name: "Новая дисциплина" }]);
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
                <h1 className="text-bold" style={{ marginBottom: '20px' }}>
                    Редактирование списка дисциплин
                    <span style={{ color: 'var(--secondary-lock-font-c)', fontWeight: 400, marginLeft: '16px', fontSize: '16px' }}>
                        Группа {group}
                    </span>
                </h1>

                <div className="table-wrapper">
                <table className="table-container">
                    <thead>
                        <tr>
                            <th>№ ↕</th>
                            <th>Дисциплина ↕</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {disciplines.map((d, idx) => (
                            <tr key={d.id}>
                                <td>{idx + 1}</td>
                                <td>{d.name}</td>
                                <td>
                                    <button
                                        style={deleteBtnStyle}
                                        onClick={() => handleDelete(d.id)}
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                    <Button
                        title="+ Добавить дисциплину"
                        color="btn-blue"
                        onClick={handleAdd}
                    />
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                    <button
                        style={{ background: 'none', border: 'none', color: 'var(--secondary-link-c)', cursor: 'pointer', fontSize: 'var(--font-size-regular)' }}
                        onClick={() => window.history.back()}
                    >
                        ← Вернуться к списку дисциплин
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function EditDisciplines() {
    return (
        <Suspense fallback={<div>Загрузка...</div>}>
            <EditDisciplinesContent />
        </Suspense>
    );
}
