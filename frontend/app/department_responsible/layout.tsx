"use client";

import Navbar from '@/components/navbar/Navbar';
import { PieChart } from 'lucide-react';

const responsibleLinks = [
  { label: 'Статистика', href: '/department_responsible/statistics', icon: PieChart },
];

export default function ResponsibleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-container">
      <Navbar title="Проверка остаточных знаний" linkOptions={responsibleLinks} />
      {children}
    </div>
  );
}
