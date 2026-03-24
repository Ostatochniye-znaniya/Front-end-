"use client";

import Navbar from "@/components/navbar/Navbar";
import Table from "@/components/table/Table";
import Dropdown from "@/components/dropdown/Dropdown";

import { useState } from "react";

const semestrs = [
    { value: '1', label: '1 семестр' },
    { value: '2', label: '2 семестр' },
    { value: '3', label: '3 семестр' },
    { value: '4', label: '4 семестр' },
    { value: '5', label: '5 семестр' },
    { value: '6', label: '6 семестр' },
    { value: '7', label: '7 семестр' },
    { value: '8', label: '8 семестр' }
];


const table = [
    {
        faculty: "ИГРИК", group_norm: "20", group_fact: "18", class_norm: "30", class_fact: "25", e_report: "10", e_report_remark: "2", report: "7", report_remark: "1", pass: "1"
    },
    {
        faculty: "ИИДиЖ", group_norm: "20", group_fact: "18", class_norm: "30", class_fact: "25", e_report: "10", e_report_remark: "2", report: "7", report_remark: "1", pass: "0"
    },
    {
        faculty: "ПИ", group_norm: "20", group_fact: "18", class_norm: "30", class_fact: "25", e_report: "10", e_report_remark: "2", report: "7", report_remark: "1", pass: "1"
    },
    {
        faculty: "ТФ", group_norm: "20", group_fact: "18", class_norm: "30", class_fact: "25", e_report: "10", e_report_remark: "2", report: "7", report_remark: "1", pass: "0"
    },
    {
        faculty: "ФИТ", group_norm: "20", group_fact: "18", class_norm: "30", class_fact: "25", e_report: "10", e_report_remark: "7", report: "2", report_remark: "1", pass: "0"
    },
    {
        faculty: "ФМ", group_norm: "20", group_fact: "18", class_norm: "30", class_fact: "25", e_report: "10", e_report_remark: "7", report: "2", report_remark: "1", pass: "1"
    },
    {
        faculty: "ФУиГХ", group_norm: "20", group_fact: "18", class_norm: "30", class_fact: "25", e_report: "10", e_report_remark: "7", report: "2", report_remark: "1", pass: "0"
    },
    {
        faculty: "ФХТиБ", group_norm: "20", group_fact: "18", class_norm: "30", class_fact: "25", e_report: "10", e_report_remark: "7", report: "2", report_remark: "1", pass: "1"
    },
    {
        faculty: "ФЭиУ", group_norm: "20", group_fact: "18", class_norm: "30", class_fact: "25", e_report: "10", e_report_remark: "7", report: "2", report_remark: "1", pass: "1"
    },
]

const style:React.CSSProperties = {
  display:"flex",
  justifyContent: "center"
};

export default function Home() {
    const [selectedSemestr, setSelectedSemestr] = useState('');
    return (
        <div className="bg-container">
            <div className="bg-gradient"></div>
            <Navbar 
                title="Проверка остаточных знаний"
                linkOptions={[
                    { label: "Главная", href: "/lpr/main" },
                    { label: "Приказы", href: "/lpr/order" },
                    { label: "Списки рекомедуемых групп", href: "/lpr/list" },
                    { label: "Отчеты", href: "/lpr/report" },
                    { label: "Настройки доступа", href: "/lpr/settings" }
                ]}
                name="Иван"
                surname="Иванов"
                lastname="Иванович"
            />
            <div className="main-container">
                <h1 className="text-bold">Главная</h1>
                <div className="search-container" style={style}>
                    <Dropdown 
                      options={semestrs}
                      value={selectedSemestr}
                      onChange={setSelectedSemestr}
                      placeholder="Не выбрано"
                      label="Семестр"
                    />
                </div>
                <Table 
                    columns={[
                    { 
                        header: 'Факультеты', 
                        accessor: 'faculty'
                    },
                    { 
                        header: 'По нормативу', 
                        accessor: 'group_norm'
                    },
                    { 
                        header: 'По факту', 
                        accessor: 'group_fact'
                    },
                    { 
                        header: 'По нормативу', 
                        accessor: 'class_norm'
                    },
                    { 
                        header: 'По факту', 
                        accessor: 'class_fact'
                    },
                    { 
                        header: 'Электронные отчёты', 
                        accessor: 'e_report'
                    },
                    { 
                        header: 'Замечания по электронному отчёту', 
                        accessor: 'e_report_remark'
                    },
                    { 
                        header: 'Бумажные отчёты', 
                        accessor: 'report'
                    },
                    { 
                        header: 'Замечания по бумажному отчёту', 
                        accessor: 'report_remark'
                    },
                    { 
                        header: 'Всё сдано', 
                        accessor: 'pass'
                    }
                    ]}
                    data={table}
                />
            </div>
        </div>
    );
}