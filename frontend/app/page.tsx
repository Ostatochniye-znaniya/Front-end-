"use client";

import Navbar from "@/components/navbar/Navbar";

export default function Home() {
  return (
    <div>
        <Navbar 
            title="Проверка остаточных знаний"
            linkOptions={[
                { label: "Согласование дат", href: "/" },
                { label: "Отчеты", href: "/about" }
            ]}
            name="Иван"
            surname="Иванов"
            lastname="Иванович"
        />
    </div>
  );
}
