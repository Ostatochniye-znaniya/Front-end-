"use client";
import Navbar from "@/components/navbar/Navbar";
import { CalendarDays, FileText } from 'lucide-react';

export default function TeacherReport() {
  return (
    <div className="bg-container">
        <div className="bg-gradient"></div>
        <Navbar
            title="Проверка остаточных знаний"
            linkOptions={[
                { label: "Согласование дат", href: "/csh/teacher/main",   icon: CalendarDays },
                { label: "Отчеты",           href: "/csh/teacher/report", icon: FileText },
            ]}
            name="Иван"
            surname="Иванов"
            lastname="Иванович"
            role="Преподаватель"
        />
        <div className="main-container">
            <h1 className="text-bold">Отчеты</h1>
        </div>
    </div>
  );
}