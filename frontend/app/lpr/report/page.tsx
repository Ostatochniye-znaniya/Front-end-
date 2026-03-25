"use client";

import Navbar from "@/components/navbar/Navbar";
import Table from "@/components/table/Table";
import Search from "@/components/search/Search";
import Button from "@/components/button/Button";
import Pagination from "@/components/pagination/Pagination";
import Dropdown from "@/components/dropdown/Dropdown";

import { useState } from "react";


const table = [
    {
        group: "221-111", class: "Сети и телекоммуникации", e_report: "Сдан", report: "Одобрен", more: "Подробнее"
    },
    {
        group: "221-111", class: "Сети и телекоммуникации", e_report: "Не сдан", report: "Не сдан", more: "Подробнее"
    },
    {
        group: "221-111", class: "Сети и телекоммуникации", e_report: "На доработке", report: "Не сдан", more: "Подробнее"
    },
    {
        group: "221-111", class: "Back-end разработка", e_report: "Требует проверки", report: "Не сдан", more: "Подробнее"
    }
]

const semestrs = [
    { value: '1', label: 'Осень 2024' },
    { value: '2', label: 'Весна 2025' },
    { value: '3', label: 'Осень 2025' },
    { value: '4', label: 'Весна 2026' },
    { value: '5', label: 'Осень 2026' },
    { value: '6', label: 'Весна 2027' },
    { value: '7', label: 'Осень 2027' },
    { value: '8', label: 'Весна 2028' }
];
const faculties = [
    { value: 'fit', label: 'ФИТ' },
    { value: 'fm', label: 'ФМ' },
    { value: 'tf', label: 'ТФ' },
    { value: 'faiu', label: 'ФЭИУ' },
    { value: 'fuigh', label: 'ФУИГХ' },
    { value: 'fbk', label: 'ФБК' },
    { value: 'fhtib', label: 'ФХТИБ' },
    { value: 'pi', label: 'ПИ' }
];
const e_reports = [
    { value: '1', label: 'Сдан' },
    { value: '2', label: 'Не сдан' },
    { value: '3', label: 'На доработке' },
    { value: '4', label: 'Требует проверки' }
];
const departments = [
    { value: 'ib', label: 'ИБ' },
    { value: 'iiit', label: 'ИиИТ' },
    { value: 'ikt', label: 'ИКТ' },
    { value: 'pi', label: 'ПИ' },
    { value: 'smart', label: 'СМАРТ' }
];
const reports = [
    { value: '1', label: 'Одобрен' },
    { value: '2', label: 'Не сдан' }
];

export default function Home() {
    const [selectedSemestr, setSelectedSemestr] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [e_reportStatus, setE_reportStatus] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedReport, setSelectedReport] = useState('');
    const [searchBigValue, setSearchBigValue] = useState('');

    const [isFirstVisible, setIsFirstVisible] = useState(true);
    const toggleDisplay = () => {
        setIsFirstVisible(!isFirstVisible);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 10;

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };


    return (
        <div className="bg-container">
            <div className="bg-gradient"></div>
            <Navbar 
                title="Проверка остаточных знаний"
                linkOptions={[
                    { label: "Главная", href: "/csh/lpr/main" },
                    { label: "Приказы", href: "/csh/lpr/order" },
                    { label: "Списки рекомедуемых групп", href: "/csh/lpr/list" },
                    { label: "Отчеты", href: "/csh/lpr/report" },
                    { label: "Настройки доступа", href: "/csh/lpr/settings" }
                ]}
                name="Иван"
                surname="Иванов"
                lastname="Иванович"
            />
            <div className="main-container" style={{ display: isFirstVisible ? 'block' : 'none' }}>
                <div className="p-block-header">
                    <h1 className="text-bold">Отчёты</h1>
                    <Button title="Отчёты проверки" color="btn-blue" onClick={toggleDisplay} />
                </div>
                <div className="p-block-with-padding">
                    <div className="p-report-dropdown-block">
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
                            label="Факультет/институт"
                        />
                        <Dropdown 
                            options={e_reports}
                            value={e_reportStatus}
                            onChange={setE_reportStatus}
                            placeholder="Не выбрано"
                            label="Статус электронного отчёта"
                        />
                        <Dropdown 
                            options={departments}
                            value={selectedDepartment}
                            onChange={setSelectedDepartment}
                            placeholder="Не выбрано"
                            label="Подразделение (кафедра)"
                        />
                        <Dropdown 
                            options={reports}
                            value={selectedReport}
                            onChange={setSelectedReport}
                            placeholder="Не выбрано"
                            label="Статус бумажного отчёта"
                        />
                    </div>
                </div>
                <h3>Статистика по Факультету/институту:</h3>
                <p>Всего сдано электронных отчётов: 50 из 60</p>
                <p>Всего сдано бумажных отчётов: 20 из 60</p>
                <Table 
                        columns={[
                        { 
                            header: 'Группа', 
                            accessor: 'group'
                        },
                        { 
                            header: 'Дисциплина', 
                            accessor: 'class'
                        },
                        { 
                            header: 'Электронный отчёт', 
                            accessor: 'e_report'
                        },
                        { 
                            header: 'Бумажный отчёт', 
                            accessor: 'report'
                        },
                        { 
                            header: '', 
                            accessor: 'more'
                        }
                        ]}
                        data={table}
                    />
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        siblingCount={2}
                        showFirstLast={true}
                    />
            </div>
            <div className="main-container" style={{ display: isFirstVisible ? 'none' : 'block' }}>
                <div className="p-block-header">
                    <h1 className="text-bold">Отчёты</h1>
                    <Button title="Сводные отчёты" color="btn-blue" onClick={toggleDisplay} />
                </div>
                <div className="p-block-with-padding">
                    <Button title="Сформировать новый сводный отчёт" color="btn-blue" onClick={() => {}} />
                </div>
                <div className="p-block-with-padding">
                    <Search hint="Введите сюда" value={searchBigValue} onChange={(value) => setSearchBigValue(value)} size="large" />
                </div>
                <div>
                    <div className="p-list-item">
                        Сводный отчёт №000 по результатам Проверки, весна 2024 от 05.05.2024
                    </div>
                    <div className="p-list-item">
                        Сводный отчёт №000 по результатам Проверки, весна 2024 от 05.05.2024
                    </div>
                    <div className="p-list-item">
                        Сводный отчёт №000 по результатам Проверки, весна 2024 от 05.05.2024
                    </div>
                    <div className="p-list-item">
                        Сводный отчёт №000 по результатам Проверки, весна 2024 от 05.05.2024
                    </div>
                    <div className="p-list-item">
                        Сводный отчёт №000 по результатам Проверки, весна 2024 от 05.05.2024
                    </div>
                    <div className="p-list-item">
                        Сводный отчёт №000 по результатам Проверки, весна 2024 от 05.05.2024
                    </div>
                    <div className="p-list-item">
                        Сводный отчёт №000 по результатам Проверки, весна 2024 от 05.05.2024
                    </div>
                    <div className="p-list-item">
                        Сводный отчёт №000 по результатам Проверки, весна 2024 от 05.05.2024
                    </div>
                    <div className="p-list-item">
                        Сводный отчёт №000 по результатам Проверки, весна 2024 от 05.05.2024
                    </div>
                    <div className="p-list-item">
                        Сводный отчёт №000 по результатам Проверки, весна 2024 от 05.05.2024
                    </div>
                </div>
            </div>
        </div>
    );
}