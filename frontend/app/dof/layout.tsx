"use client";
import Navbar from "@/components/navbar/Navbar";
import { FileText } from "lucide-react";

const dofLinks = [
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
