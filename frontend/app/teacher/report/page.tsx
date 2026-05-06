"use client";
import Navbar from "@/components/navbar/Navbar";
import { CalendarDays, FileText, Download } from 'lucide-react';
import Table, { Column } from "@/components/table/Table";
import Pagination from "@/components/pagination/Pagination";

type Table2Row = {
  groupe: string;
  subject: string;
  e_report: string;
  paper_report: string;
};

const table_2: Table2Row[] = [
  {
    groupe: "221-111",
    subject: "Сети и телекоммуникации",
    e_report: "Загрузить",
    paper_report: "Отсутствует",
  },
  {
    groupe: "221-111",
    subject: "Back-end разработка",
    e_report: "На проверке",
    paper_report: "Отсутствует",
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
    accessor: "e_report",
  },
  {
    header: "Время проведения",
    accessor: "paper_report",
  },
];

export default function TeacherReport() {
  return (
    <div className="bg-container">
        <div className="bg-gradient"></div>
        <Navbar
            title="Проверка остаточных знаний"
            linkOptions={[
                { label: "Согласование дат", href: "/csh/teacher/main",   icon: CalendarDays },
                { label: "Отчеты",           href: "/csh/teacher/report", icon: FileText },
            ]}
            name="Иван"
            surname="Иванов"
            lastname="Иванович"
            role="Преподаватель"
        />
        <div className="main-container">
            <p className="title text-bold">Отчеты о проверке остаточных знаний</p>
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "20px",
                justifyContent: "left",
            }}>
                <Download size={50} style={{
                    color: "var(--accent-blue-c)"
                }}/>
                <p className="text-bold">Скачать шаблон оформления отчета</p>
            </div>
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