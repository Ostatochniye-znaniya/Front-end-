"use client";
import Navbar from "@/components/navbar/Navbar";
import { PieChart, Users, BookOpen, GraduationCap } from "lucide-react";

const hodLinks = [
  { label: "Статистика",              href: "/hod/statistics",    icon: PieChart },
  { label: "Выбор групп",             href: "/hod/groups",        icon: Users },
  { label: "Выбор дисциплин",         href: "/hod/disciplines",   icon: BookOpen },
  { label: "Выбор преподавателей",    href: "/hod/teachers",      icon: GraduationCap },
];

export default function HodLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-container">
      <Navbar title="Проверка остаточных знаний" linkOptions={hodLinks} />
      {children}
    </div>
  );
}
