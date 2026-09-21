"use client";
import Navbar from "@/components/navbar/Navbar";
import { Handshake } from "lucide-react";

const guestLinks = [
  { label: "Приветствие", href: "/guest", icon: Handshake },
];

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-container">
      <Navbar title="Проверка остаточных знаний" linkOptions={guestLinks} />
      {children}
    </div>
  );
}
