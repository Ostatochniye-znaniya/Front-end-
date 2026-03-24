"use client";

import Navbar from "@/components/navbar/Navbar";
import Table from "@/components/table/Table";
import Search from "@/components/search/Search";
import Button from "@/components/button/Button";

import { useState } from "react";
import { redirect } from "next/dist/server/api-utils";
import { RedirectType } from "next/navigation";
import { useRouter } from 'next/navigation'



const table_1 = [
    {
        number: "001", name: 'Приказ "О проведении анкетирования и проверки остаточных знаний"', year: "2025", semestr: "Весна"
    },
    {
        number: "002", name: 'Приказ "О проведении анкетирования и проверки остаточных знаний"', year: "2025", semestr: "Весна"
    },
    {
        number: "003", name: 'Приказ "О проведении анкетирования и проверки остаточных знаний"', year: "2025", semestr: "Весна"
    },
    {
        number: "004", name: 'Приказ "О проведении анкетирования и проверки остаточных знаний"', year: "2025", semestr: "Весна"
    }
]

const table_2 = [
    {
        number: "001", name: 'Черновик "О проведении анкетирования и проверки остаточных знаний"', year: "2025", semestr: "Весна"
    },
    {
        number: "002", name: 'Черновик "О проведении анкетирования и проверки остаточных знаний"', year: "2025", semestr: "Весна"
    },
    {
        number: "003", name: 'Черновик "О проведении анкетирования и проверки остаточных знаний"', year: "2025", semestr: "Весна"
    },
    {
        number: "004", name: 'Черновик "О проведении анкетирования и проверки остаточных знаний"', year: "2025", semestr: "Весна"
    }
]


export default function Home() {
    const router = useRouter()
    const [searchBigValue, setSearchBigValue] = useState('');

    const [isFirstVisible, setIsFirstVisible] = useState(true);
    const toggleDisplay = () => {
        setIsFirstVisible(!isFirstVisible);
    };

    const [isTableVisible, setIsTableVisible] = useState(true);
    const toggleTableDisplay = (state: boolean) => {
        setIsTableVisible(state);
    };

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
            <div className="main-container" style={{ display: isFirstVisible ? 'block' : 'none' }}>
                <div className="p-block-header">
                    <h1 className="text-bold">Приказы</h1>
                    <Button title="#" color="btn-blue" onClick={() => {toggleTableDisplay(true)}} />
                    <div style={{ marginLeft: '10px' }}></div>
                    <Button title=".-" color="btn-blue" onClick={() => {toggleTableDisplay(false)}} />
                    <div style={{ marginLeft: '10px' }}></div>
                    <Button title="Сформировать новый приказ" color="btn-blue" onClick={() => router.push('/lpr/create_order')} />
                    <div style={{ marginLeft: '10px' }}></div>
                    <Button title="Черновики" color="btn-purple" onClick={toggleDisplay} />
                </div>
                <div className="p-block-with-padding">
                    <Search hint="Введите сюда" value={searchBigValue} onChange={(value) => setSearchBigValue(value)} size="large" />
                </div>
                <div style={{ display: isTableVisible ? 'block' : 'none' }}>
                    <Table 
                        columns={[
                        { 
                            header: '№', 
                            accessor: 'number'
                        },
                        { 
                            header: 'Название', 
                            accessor: 'name'
                        },
                        { 
                            header: 'Учебный год', 
                            accessor: 'year'
                        },
                        { 
                            header: 'Семестр', 
                            accessor: 'semestr'
                        }
                        ]}
                        data={table_1}
                    />
                </div>
                <div style={{ display: isTableVisible ? 'none' : 'block' }}>
                    <div className="p-list-item">
                        Приказ "О проведении анкетирования и проверки остаточных знаний"
                    </div>
                    <div className="p-list-item">
                        Приказ "О проведении анкетирования и проверки остаточных знаний"
                    </div>
                    <div className="p-list-item">
                        Приказ "О проведении анкетирования и проверки остаточных знаний"
                    </div>
                    <div className="p-list-item">
                        Приказ "О проведении анкетирования и проверки остаточных знаний"
                    </div>
                </div>
            </div>
            <div className="main-container" style={{ display: isFirstVisible ? 'none' : 'block' }}>
                <div className="p-block-header">
                    <h1 className="text-bold">Черновики</h1>
                    <Button title="#" color="btn-blue" onClick={() => {toggleTableDisplay(true)}} />
                    <div style={{ marginLeft: '10px' }}></div>
                    <Button title=".-" color="btn-blue" onClick={() => {toggleTableDisplay(false)}} />
                    <div style={{ marginLeft: '10px' }}></div>
                    <Button title="Сформировать новый приказ" color="btn-blue" onClick={() => alert("Тут пока ещё некуда перенаправлять ☻")} />
                    <div style={{ marginLeft: '10px' }}></div>
                    <Button title="Приказы" color="btn-purple" onClick={toggleDisplay} />
                </div>
                <div className="p-block-with-padding">
                    <Search hint="Введите сюда" value={searchBigValue} onChange={(value) => setSearchBigValue(value)} size="large" />
                </div>
                <div style={{ display: isTableVisible ? 'block' : 'none' }}>
                    <Table 
                        columns={[
                        { 
                            header: '№', 
                            accessor: 'number'
                        },
                        { 
                            header: 'Название', 
                            accessor: 'name'
                        },
                        { 
                            header: 'Учебный год', 
                            accessor: 'year'
                        },
                        { 
                            header: 'Семестр', 
                            accessor: 'semestr'
                        }
                        ]}
                        data={table_2}
                    />
                </div>
                <div style={{ display: isTableVisible ? 'none' : 'block' }}>
                    <div className="p-list-item">
                        Черновик "О проведении анкетирования и проверки остаточных знаний"
                    </div>
                    <div className="p-list-item">
                        Черновик "О проведении анкетирования и проверки остаточных знаний"
                    </div>
                    <div className="p-list-item">
                        Черновик "О проведении анкетирования и проверки остаточных знаний"
                    </div>
                    <div className="p-list-item">
                        Черновик "О проведении анкетирования и проверки остаточных знаний"
                    </div>
                </div>
            </div>
        </div>
    );
}