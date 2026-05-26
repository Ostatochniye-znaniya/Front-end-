"use client";
import Navbar from "@/components/navbar/Navbar";
import { CalendarDays, FileText } from "lucide-react";

const teacherLinks = [
  { label: "Согласование дат", href: "/teacher/main", icon: CalendarDays },
  { label: "Отчеты", href: "/teacher/report", icon: FileText },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-container">
      <Navbar title="Проверка остаточных знаний" linkOptions={teacherLinks} />
      {children}
    </div>
  );
}
