"use client";

import Navbar from "@/components/navbar/Navbar";

const navLinks = [
    { label: "Главная", href: "/csh/hod/main" },
    { label: "Выбор групп", href: "/csh/hod/groups" },
    { label: "Выбор дисциплин", href: "/csh/hod/disciplines" },
    { label: "Выбор преподавателей", href: "/csh/hod/teachers" },
];

export default function TeacherSelection() {
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
                <h1 className="text-bold">Выбор преподавателей</h1>
                <p className="text" style={{ marginTop: '16px', color: 'var(--secondary-lock-font-c)' }}>
                    Страница находится в разработке.
                </p>
            </div>
        </div>
    );
}
