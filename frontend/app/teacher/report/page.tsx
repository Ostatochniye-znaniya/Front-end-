"use client";
import { CalendarDays, FileText, Download, Upload, Clock, AlertCircle, Check } from 'lucide-react';
import Table, { Column } from "@/components/table/Table";
import Pagination from "@/components/pagination/Pagination";
import Capsule from "@/components/capsule/Capsule";
import { ReactNode } from "react";
import Button from "@/components/button/Button";

type Table2Row = {
  groupe: string;
  subject: string;
  e_report: ReactNode;
  paper_report: ReactNode;
};

// Хелпер для рендера статуса электронного отчета
const renderEReportStatus = (status: string) => {
  switch (status) {
    case "Сдан":
      return (
        <Capsule variant="success" icon={<Check size={16} />}>
          Сдан
        </Capsule>
      );
    case "На проверке":
      return (
        <Capsule variant="warning" icon={<Clock size={16} />}>
          На проверке
        </Capsule>
      );
    case "На доработке":
      return (
        <Capsule variant="danger" icon={<AlertCircle size={16} />}>
          На доработке
        </Capsule>
      );
    case "Загрузить":
      return (
        <Capsule variant="default" icon={<Upload size={16} />} iconPosition="right">
          Загрузить
        </Capsule>
      );
    default:
      return <Capsule variant="default">{status}</Capsule>;
  }
};

// Хелпер для рендера статуса бумажного отчета
const renderPReportStatus = (status: string) => {
  if (status === "Сдан") {
    return (
      <Capsule variant="success" icon={<Check size={16} />}>
        Сдан
      </Capsule>
    );
  }
  if (status === "Отсутствует") {
    return (
      <Capsule variant="default">
        Отсутствует
      </Capsule>
    );
  }
  return <Capsule variant="default">{status}</Capsule>;
};

const table_2: Table2Row[] = [
  {
    groupe: "221-111",
    subject: "Сети и телекоммуникации",
    e_report: renderEReportStatus("Загрузить"),
    paper_report: renderPReportStatus("Отсутствует"),
  },
  {
    groupe: "221-111",
    subject: "Back-end разработка",
    e_report: renderEReportStatus("На проверке"),
    paper_report: renderPReportStatus("Отсутствует"),
  },
  {
    groupe: "221-222",
    subject: "Сети и телекоммуникации",
    e_report: renderEReportStatus("На доработке"),
    paper_report: renderPReportStatus("Отсутствует"),
  },
  {
    groupe: "221-222",
    subject: "Back-end разработка",
    e_report: renderEReportStatus("Сдан"),
    paper_report: renderPReportStatus("Отсутствует"),
  },
  {
    groupe: "221-222",
    subject: "Сети и телекоммуникации",
    e_report: renderEReportStatus("Сдан"),
    paper_report: renderPReportStatus("Отсутствует"),
  },
  {
    groupe: "221-222",
    subject: "Back-end разработка",
    e_report: renderEReportStatus("Сдан"),
    paper_report: renderPReportStatus("Отсутствует"),
  },
  {
    groupe: "221-222",
    subject: "Сети и телекоммуникации",
    e_report: renderEReportStatus("Сдан"),
    paper_report: renderPReportStatus("Сдан"),
  },
  {
    groupe: "221-222",
    subject: "Back-end разработка",
    e_report: renderEReportStatus("Сдан"),
    paper_report: renderPReportStatus("Сдан"),
  },
  {
    groupe: "221-222",
    subject: "Сети и телекоммуникации",
    e_report: renderEReportStatus("Сдан"),
    paper_report: renderPReportStatus("Сдан"),
  },
  {
    groupe: "221-222",
    subject: "Back-end разработка",
    e_report: renderEReportStatus("Сдан"),
    paper_report: renderPReportStatus("Сдан"),
  },
  {
    groupe: "221-222",
    subject: "Сети и телекоммуникации",
    e_report: renderEReportStatus("Сдан"),
    paper_report: renderPReportStatus("Сдан"),
  },
  {
    groupe: "221-222",
    subject: "Back-end разработка",
    e_report: renderEReportStatus("Сдан"),
    paper_report: renderPReportStatus("Сдан"),
  },
  {
    groupe: "221-222",
    subject: "Сети и телекоммуникации",
    e_report: renderEReportStatus("Сдан"),
    paper_report: renderPReportStatus("Сдан"),
  },
  {
    groupe: "221-222",
    subject: "Back-end разработка",
    e_report: renderEReportStatus("Сдан"),
    paper_report: renderPReportStatus("Сдан"),
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
        <div className="main-container">
            <p className="title text-bold">Отчеты о проверке остаточных знаний</p>
            <Button
                color="btn-blue"
                onClick={() => {}}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    width: "fit-content",
                    padding: "10px 16px",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    marginBottom: "20px",
                }}
                >
                <Download size={24} color="white" />
                <span>
                    Скачать шаблон оформления отчета
                </span>
            </Button>
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
  );
}