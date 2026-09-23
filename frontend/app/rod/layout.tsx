"use client";
import Navbar from "@/components/navbar/Navbar";
import { CalendarDays } from "lucide-react";

const rodLinks = [
  { label: "Составление графика", href: "/rod/schedule", icon: CalendarDays },
];

export default function RodLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-container">
      <Navbar title="Проверка остаточных знаний" linkOptions={rodLinks} />
      {children}
    </div>
  );
}
