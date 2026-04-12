"use client";

import Navbar from "@/components/navbar/Navbar";
import Table from "@/components/table/Table";
import Dropdown from "@/components/dropdown/Dropdown";
import { useState } from "react";

const navLinks = [
    { label: "Главная", href: "/csh/hod/main" },
    { label: "Выбор групп", href: "/csh/hod/groups" },
    { label: "Выбор дисциплин", href: "/csh/hod/disciplines" },
    { label: "Выбор преподавателей", href: "/csh/hod/teachers" },
];

const semestrs = [
    { value: 'fall2024', label: 'Осень 2024' },
    { value: 'spring2025', label: 'Весна 2025' },
    { value: 'fall2025', label: 'Осень 2025' },
    { value: 'spring2026', label: 'Весна 2026' },
];

const faculties = [
    { value: 'igrk', label: 'ИГРИК' },
    { value: 'iidij', label: 'ИИДиЖ' },
    { value: 'pi', label: 'ПИ' },
    { value: 'tf', label: 'ТФ' },
    { value: 'fit', label: 'ФИТ' },
    { value: 'fm', label: 'ФМ' },
    { value: 'fuigh', label: 'ФУиГХ' },
    { value: 'fhtib', label: 'ФХТиБ' },
    { value: 'feiu', label: 'ФЭиУ' },
];

const tableData = [
    { faculty: "ИГРИК", group_norm: 20, group_fact: 18, class_norm: 30, class_fact: 25, e_report: 10, report: 7, e_remark: 2, remark: 1, pass: 1 },
    { faculty: "ИИДиЖ", group_norm: 20, group_fact: 18, class_norm: 30, class_fact: 25, e_report: 10, report: 7, e_remark: 2, remark: 1, pass: 0 },
    { faculty: "ПИ",     group_norm: 20, group_fact: 18, class_norm: 30, class_fact: 25, e_report: 10, report: 7, e_remark: 2, remark: 1, pass: 1 },
    { faculty: "ТФ",     group_norm: 20, group_fact: 18, class_norm: 30, class_fact: 25, e_report: 10, report: 7, e_remark: 2, remark: 1, pass: 0 },
    { faculty: "ФИТ",   group_norm: 20, group_fact: 18, class_norm: 30, class_fact: 25, e_report: 10, report: 2, e_remark: 7, remark: 1, pass: 0 },
    { faculty: "ФМ",    group_norm: 20, group_fact: 18, class_norm: 30, class_fact: 25, e_report: 10, report: 2, e_remark: 7, remark: 1, pass: 1 },
    { faculty: "ФУиГХ", group_norm: 20, group_fact: 18, class_norm: 30, class_fact: 25, e_report: 10, report: 2, e_remark: 7, remark: 1, pass: 0 },
    { faculty: "ФХТиБ", group_norm: 20, group_fact: 18, class_norm: 30, class_fact: 25, e_report: 10, report: 2, e_remark: 7, remark: 1, pass: 1 },
    { faculty: "ФЭиУ",  group_norm: 20, group_fact: 18, class_norm: 30, class_fact: 25, e_report: 10, report: 2, e_remark: 7, remark: 1, pass: 1 },
];

export default function KafedraMain() {
    const [selectedSemestr, setSelectedSemestr] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState('');

    return (
        <div className="bg-container">
            <div className="bg-gradient"></div>
            <Navbar
                title="Проверка остаточных знаний"
                linkOptions={navLinks}
                name="Иван"
                surname="Иванов"
                lastname="Иванович"
            />
            <div className="main-container">
                <h1 className="text-bold">Главная</h1>
                <div className="search-container" style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <Dropdown
                        options={semestrs}
                        value={selectedSemestr}
                        onChange={setSelectedSemestr}
                        placeholder="Не выбрано"
                        label="Семестр"
                    />
                    <Dropdown
                        options={faculties}
                        value={selectedFaculty}
                        onChange={setSelectedFaculty}
                        placeholder="Не выбрано"
                        label="Факультет"
                    />
                </div>
                <Table
                    columns={[
                        { header: 'Факультеты', accessor: 'faculty' },
                        { header: 'По нормативу', accessor: 'group_norm' },
                        { header: 'По факту', accessor: 'group_fact' },
                        { header: 'По нормативу', accessor: 'class_norm' },
                        { header: 'По факту', accessor: 'class_fact' },
                        { header: 'Электронные отчёты', accessor: 'e_report' },
                        { header: 'Бумажные отчёты', accessor: 'report' },
                        { header: 'Замечания по электронному отчёту', accessor: 'e_remark' },
                        { header: 'Замечания по бумажному отчёту', accessor: 'remark' },
                        { header: 'Всё сдано', accessor: 'pass' },
                    ]}
                    data={tableData}
                />
            </div>
        </div>
    );
}
