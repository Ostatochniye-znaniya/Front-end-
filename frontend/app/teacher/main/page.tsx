"use client";

import Navbar from "@/components/navbar/Navbar";
import Table, { Column } from "@/components/table/Table";
import { CalendarDays, Download, FileText, Check } from "lucide-react";
import Pagination from "@/components/pagination/Pagination";
import Capsule from "@/components/capsule/Capsule";
import { ReactNode } from "react";

type Table1Row = {
  stage: string;
  date: ReactNode;
};

type Table2Row = {
  groupe: string;
  subject: string;
  date: string;
  time: string;
  stage: ReactNode;
};

const table_1: Table1Row[] = [
  {
    stage: "Контроль знаний",
    date: <Capsule
      variant="danger"
    >
      30.05.2025 - 28.06.2025
    </Capsule>,
  },
  {
    stage: "Сдача электронных отчетов",
    date: <Capsule
      variant="success"
    >
      до 05.07.2025
    </Capsule>,
  },
  {
    stage: "Сдача бумажных отчетов",
    date: <Capsule
      variant="success"
    >
      до 15.07.2025
    </Capsule>,
  },
];

const table_2: Table2Row[] = [
  {
    groupe: "221-111",
    subject: "Сети и телекоммуникации",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule
        variant="success"
        icon={<Check size={16} />}
      >
        Согласовано
      </Capsule>
    ),
  },
  {
    groupe: "221-111",
    subject: "Back-end разработка",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule
        variant="success"
        icon={<Check size={16} />}
      >
        Согласовано
      </Capsule>
    ),
  },
  {
    groupe: "221-222",
    subject: "Сети и телекоммуникации",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule
        variant="success"
        icon={<Check size={16} />}
      >
        Согласовано
      </Capsule>
    ),
  },
  // Дальше идут строки со статусом "Согласовать"
  {
    groupe: "221-222",
    subject: "Back-end разработка",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule variant="default">
        Согласовать
      </Capsule>
    ),
  },
  {
    groupe: "221-222",
    subject: "Сети и телекоммуникации",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule variant="default">
        Согласовать
      </Capsule>
    ),
  },
  {
    groupe: "221-222",
    subject: "Back-end разработка",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule variant="default">
        Согласовать
      </Capsule>
    ),
  },
  {
    groupe: "221-222",
    subject: "Сети и телекоммуникации",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule variant="default">
        Согласовать
      </Capsule>
    ),
  },
  {
    groupe: "221-222",
    subject: "Back-end разработка",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule variant="default">
        Согласовать
      </Capsule>
    ),
  },
  {
    groupe: "221-222",
    subject: "Сети и телекоммуникации",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule variant="default">
        Согласовать
      </Capsule>
    ),
  },
  {
    groupe: "221-222",
    subject: "Back-end разработка",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule variant="default">
        Согласовать
      </Capsule>
    ),
  },
  {
    groupe: "221-222",
    subject: "Сети и телекоммуникации",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule variant="default">
        Согласовать
      </Capsule>
    ),
  },
  {
    groupe: "221-222",
    subject: "Back-end разработка",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule variant="default">
        Согласовать
      </Capsule>
    ),
  },
  {
    groupe: "221-222",
    subject: "Сети и телекоммуникации",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule variant="default">
        Согласовать
      </Capsule>
    ),
  },
  {
    groupe: "221-222",
    subject: "Back-end разработка",
    date: "15.06.2024",
    time: "12:20",
    stage: (
      <Capsule variant="default">
        Согласовать
      </Capsule>
    ),
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
        <Table style={{width: "100%"}} columns={columns1} data={table_1} />
        <p className="title text-bold">
          Согласование дат проведения проверки остаточных знаний
        </p>
        <Table style={{width: "100%"}} columns={columns2} data={table_2} />
        <div style={{
          display: "flex",
          justifyContent: "right",
          marginTop: "20px",
        }}>
          <Pagination
            currentPage={1}
            totalPages={5}
            onPageChange={() => {}}
            siblingCount={1}
            showFirstLast={true}
          ></Pagination>
        </div>
      </div>
    </div>
  );
}