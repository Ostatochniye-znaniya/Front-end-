"use client";

import Navbar from "@/components/navbar/Navbar";

export default function LprList() {
  return (
    <div>
        <Navbar 
            title="Проверка остаточных знаний"
            linkOptions={[
                { label: "Преподаватель", href: "/csh/teacher/main" },
                { label: "ЛПР", href: "/csh/lpr/statistics" },
                { label: "Заведующего кафедрой", href: "/csh/hod/statistics" }
            ]}
            name="Иван"
            surname="Иванов"
            lastname="Иванович"
        />
    </div>
  );
}
