"use client";
import Navbar from "@/components/navbar/Navbar";
import { CalendarDays, PieChart } from "lucide-react";

const dofLinks = [
  { label: "Статистика", href: "/dof/statistics", icon: PieChart },
  { label: "Составление графика", href: "/dof/schedule", icon: CalendarDays },
];

export default function DofLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-container">
      <Navbar title="Проверка остаточных знаний" linkOptions={dofLinks} />
      {children}
    </div>
  );
}
