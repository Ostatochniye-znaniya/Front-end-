"use client";
import Navbar from "@/components/navbar/Navbar";
import Button from "@/components/button/Button";
import Dropdown from "@/components/dropdown/Dropdown";
import { PieChart, Users, BookOpen, GraduationCap } from 'lucide-react';

const API_BASE_URL = `${typeof window !== "undefined" ? window.location.origin : ""}/csh/api/`;

const navLinks = [
    { label: "Статистика",           href: "/csh/hod/statistics",        icon: PieChart },
    { label: "Выбор групп",          href: "/csh/hod/groups",      icon: Users },
    { label: "Выбор дисциплин",      href: "/csh/hod/disciplines", icon: BookOpen },
    { label: "Выбор преподавателей", href: "/csh/hod/teachers",    icon: GraduationCap },
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
                role="Заведующий кафедрой"
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