"use client";
import Navbar from "@/components/navbar/Navbar";
import { CalendarDays, FileText } from "lucide-react";

const teacherLinks = [
  { label: "Тестирования на согласование", href: "/teacher/dates", icon: CalendarDays },
  { label: "Отчёты", href: "/teacher/report", icon: FileText },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-container">
      <Navbar title="Проверка остаточных знаний" linkOptions={teacherLinks} />
      {children}
    </div>
  );
}
