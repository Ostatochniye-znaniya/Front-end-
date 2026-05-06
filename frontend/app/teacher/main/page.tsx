"use client";

import Navbar from "@/components/navbar/Navbar";
import Table, { Column } from "@/components/table/Table";
import { CalendarDays, FileText } from "lucide-react";

type Table1Row = {
  stage: string;
  date: string;
};

type Table2Row = {
  groupe: string;
  subject: string;
  date: string;
  time: string;
  stage: string;
};

const table_1: Table1Row[] = [
  {
    stage: "Контроль знаний",
    date: "30.05.2025 - 28.06.2025",
  },
  {
    stage: "Сдача электронных отчетов",
    date: "до 05.07.2025",
  },
  {
    stage: "Сдача бумажных отчетов",
    date: "до 15.07.2025",
  },
];

const table_2: Table2Row[] = [
  {
    groupe: "221-111",
    subject: "Сети и телекоммуникации",
    date: "15.06.2024",
    time: "12:20",
    stage: "Согласованно",
  },
  {
    groupe: "221-111",
    subject: "Back-end разработка",
    date: "15.06.2024",
    time: "12:20",
    stage: "Согласованно",
  },
];

const columns1: Column<Table1Row>[] = [
  {
    header: "Этап",
    accessor: "stage",
  },
  {
    header: "Дата",
    accessor: "date",
  },
];

const columns2: Column<Table2Row>[] = [
  {
    header: "Группа",
    accessor: "groupe",
  },
  {
    header: "Дисциплина",
    accessor: "subject",
  },
  {
    header: "Дата проведения",
    accessor: "date",
  },
  {
    header: "Время проведения",
    accessor: "time",
  },
  {
    header: "Стадия согласования",
    accessor: "stage",
  },
];

export default function Home() {
  return (
    <div className="bg-container">
      <div className="bg-gradient"></div>

      <Navbar
        title="Проверка остаточных знаний"
        linkOptions={[
          {
            label: "Согласование дат",
            href: "/csh/teacher/main",
            icon: CalendarDays,
          },
          {
            label: "Отчеты",
            href: "/csh/teacher/report",
            icon: FileText,
          },
        ]}
        name="Иван"
        surname="Иванов"
        lastname="Иванович"
        role="Преподаватель"
      />

      <div className="main-container">
        <p className="title text-bold">Сроки проведения тестирования</p>
        <Table columns={columns1} data={table_1} />

        <p className="title text-bold">
          Согласование дат проведения проверки остаточных знаний
        </p>
        <Table columns={columns2} data={table_2} />
      </div>
    </div>
  );
}