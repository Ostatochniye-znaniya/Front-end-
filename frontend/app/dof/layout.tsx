"use client";
import Navbar from "@/components/navbar/Navbar";
import { CalendarDays, FileText, PieChart } from "lucide-react";

const dofLinks = [
  { label: "Статистика", href: "/dof/statistics", icon: PieChart },
  { label: "Составление графика", href: "/dof/schedule", icon: CalendarDays },
  { label: "Рассмотрение документов", href: "/dof/documents", icon: FileText },
];

export default function DofLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-container">
      <Navbar title="Проверка остаточных знаний" linkOptions={dofLinks} />
      {children}
    </div>
  );
}
