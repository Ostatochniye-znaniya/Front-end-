"use client";

import Navbar from "@/components/navbar/Navbar";
import Table from "@/components/table/Table";
import Pagination from "@/components/pagination/Pagination";

import { useState } from "react";

const table_1 = [
    {
        stage: "Контроль знаний", date: "30.05.2025 - 28.06.2025"
    },
    {
        stage: "Сдача электронных отчетов", date: "до 05.07.2025"
    },
    {
        stage: "Сдача бумажных отчетов", date: "до 15.07.2025"
    },
]

const table_2 = [
    {
        groupe: "221-111",
        subject: "Сети и телекоммуникации",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Back-end разработка",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Сети и телекоммуникации",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Back-end разработка",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Сети и телекоммуникации",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Back-end разработка",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Сети и телекоммуникации",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Back-end разработка",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Сети и телекоммуникации",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Back-end разработка",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Сети и телекоммуникации",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Back-end разработка",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Сети и телекоммуникации",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    },
    {
        groupe: "221-111",
        subject: "Back-end разработка",
        date: "15.06.2024",
        time: "12:20",
        stage: "Согласованно"
    }
]

export default function Home() {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 10;

    const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Здесь можно добавить логику загрузки данных для новой страницы
    console.log('Переход на страницу:', page);
    };
    return (
        <div className="bg-container">
            <div className="bg-gradient"></div>
            <Navbar 
                title="Проверка остаточных знаний"
                linkOptions={[
                    { label: "Согласование дат", href: "/csh/teacher/main" },
                    { label: "Отчеты", href: "/csh/teacher/report" }
                ]}
                name="Иван"
                surname="Иванов"
                lastname="Иванович"
            />
            <div className="main-container" style={{
                    width: "100%",
                }}>
                <div style={{
                    width: "100%",
                }}>
                    <p className="title text-bold" style={{
                        margin: "0px",
                        marginBottom: "25px",
                    }}>Сроки проведения тестирования</p>
                    <Table 
                        columns={[
                        { 
                            header: 'Этап', 
                            accessor: 'stage'
                        },
                        { 
                            header: 'Дата', 
                            accessor: 'date'
                        }
                        ]}
                        data={table_1}
                    />
                </div>
                <div style={{
                        marginTop: "40px",
                        width: "100%",
                    }}>
                    <p className="title text-bold" style={{
                        margin: "0px",
                        marginBottom: "25px",
                    }}>Согласование дат проведения проверки остаточных знаний</p>
                    <Table 
                        columns={[
                        { 
                            header: 'Группа', 
                            accessor: 'groupe'
                        },
                        { 
                            header: 'Дисциплина', 
                            accessor: 'subject'
                        },
                        { 
                            header: 'Дата проведения', 
                            accessor: 'date'
                        },
                        { 
                            header: 'Время проведения', 
                            accessor: 'time'
                        },
                        { 
                            header: 'Стадия соглосования', 
                            accessor: 'stage'
                        }
                    ]}
                        data={table_2}
                    />
                    <div style={{
                        marginTop: "25px",
                        display: "flex",
                        justifyContent: "flex-end",
                    }}>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            siblingCount={0}
                            showFirstLast={true}>
                        </Pagination>
                    </div>
                </div>
            </div>
        </div>
    );
}
