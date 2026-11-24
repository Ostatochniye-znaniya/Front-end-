"use client";
import Navbar from "@/components/navbar/Navbar";
import { PieChart } from "lucide-react";

const rodLinks = [
  { label: "Статистика", href: "/rod/statistics", icon: PieChart },
];

export default function RodLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-container">
      <Navbar title="Проверка остаточных знаний" linkOptions={rodLinks} />
      {children}
    </div>
  );
}
