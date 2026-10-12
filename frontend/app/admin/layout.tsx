"use client";

import React from 'react';
import Navbar from "@/components/navbar/Navbar";
import { Activity, Users, FileText, Terminal, Settings } from "lucide-react";

const adminLinks = [
  { label: "Бизнес-процессы", href: "/admin/processes", icon: Activity },
  { label: "Пользователи и роли", href: "/admin/users", icon: Users },
  { label: "Логи пользователей", href: "/admin/audit-logs", icon: FileText },
  { label: "Технические логи", href: "/admin/tech-logs", icon: Terminal },
  { label: "Настройки системы", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-container">
      <Navbar title="Проверка остаточных знаний" linkOptions={adminLinks} />
      {children}
    </div>
  );
}
