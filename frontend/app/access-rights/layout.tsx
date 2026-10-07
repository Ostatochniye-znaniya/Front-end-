"use client";
import React from "react";
import Navbar from "@/components/navbar/Navbar";
import { PieChart, FileText, Users, BookOpen, ShieldCheck } from "lucide-react";

export const accessRightsNavLinks = [
  { label: "Статистика",                href: "/lpr/statistics", icon: PieChart },
  { label: "Приказы",                   href: "/lpr/order",      icon: FileText },
  { label: "Списки рекомедуемых групп", href: "/lpr/list",       icon: Users },
  { label: "Отчеты",                    href: "/lpr/report",     icon: BookOpen },
  { label: "Права доступа",             href: "/access-rights",  icon: ShieldCheck },
];

export default function AccessRightsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-container">
      <Navbar title="Проверка остаточных знаний" linkOptions={accessRightsNavLinks} />
      {children}
    </div>
  );
}
