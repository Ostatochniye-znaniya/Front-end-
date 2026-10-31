"use client";
import Navbar from "@/components/navbar/Navbar";
import { PieChart, FileText, Users, BookOpen, Settings } from "lucide-react";

const lprLinks = [
  { label: "Статистика",                href: "/lpr/statistics", icon: PieChart },
  { label: "Приказы",                   href: "/lpr/order",      icon: FileText },
  { label: "Рекомендуемые группы",       href: "/lpr/list2",      icon: Users },
  { label: "Отчеты",                    href: "/lpr/report",     icon: BookOpen },
  { label: "Права доступа",             href: "/access-rights",  icon: Settings },
];

export default function LprLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-container">
      <Navbar title="Проверка остаточных знаний" linkOptions={lprLinks} />
      {children}
    </div>
  );
}
