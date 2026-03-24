"use client";

import Navbar from "@/components/navbar/Navbar";
import Dropdown from "@/components/dropdown/Dropdown";
import Button from "@/components/button/Button";
import Input from "@/components/input/Input";
import { useRouter } from 'next/navigation'

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

export default function Home() {
    const [selectedSemestr, setSelectedSemestr] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [inputValue2, setInputValue2] = useState('');
    const [inputValue3, setInputValue3] = useState('');
    const [inputValue4, setInputValue4] = useState('');
    const [inputValue5, setInputValue5] = useState('');
    const [inputValue6, setInputValue6] = useState('');
    const [inputValue7, setInputValue7] = useState('');
    const [inputValue8, setInputValue8] = useState('');

    const router = useRouter()

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
                <div className="p-block-header2">
                    <h1 className="text-bold">Приказы</h1>
                    <p>Формирование приказа</p>
                </div>
                <div className="p-block-with-padding2 p-two-column">
                    <div>
                        <div>
                            <h3>Дата приказа</h3>
                            <Input hint="дд.мм.гг" value={inputValue} onChange={(value) => setInputValue(value)} />
                        </div>
                        <div>
                            <h3>Учебный год</h3>
                            <Dropdown 
                                options={semestrs}
                                value={selectedSemestr}
                                onChange={setSelectedSemestr}
                                placeholder="Не выбрано"
                            />
                        </div>
                        <div>
                            <h2>Должностные лица</h2>
                            <p>Начальник отдела контроля образовательного процесса</p>
                            <Input hint="ФИО" value={inputValue2} onChange={(value) => setInputValue2(value)} />
                        </div>
                        <div>
                            <h2>Сроки проведения</h2>
                            <h3>Сводный отчёт по результатам Проверки до</h3>
                            <Input hint="дд.мм.гг" value={inputValue3} onChange={(value) => setInputValue3(value)} />
                        </div>
                        <div>
                            <h3>Сдача бумажных отчётов до</h3>
                            <Input hint="дд.мм.гг" value={inputValue4} onChange={(value) => setInputValue4(value)} />
                        </div>
                    </div>
                    <div>
                        <div>
                            <h3>Номер</h3>
                            <Input hint="дд.мм.гг" value={inputValue5} onChange={(value) => setInputValue5(value)} />
                        </div>
                        <div>
                            <h3>Проверяемый семестр</h3>
                            <Dropdown 
                                options={semestrs}
                                value={selectedSemestr}
                                onChange={setSelectedSemestr}
                                placeholder="Не выбрано"
                            />
                        </div>
                        <div style={{ flexGrow: '1' }}>
                            <p>Начальник центра по учебно-методической работе</p>
                            <Input hint="ФИО" value={inputValue6} onChange={(value) => setInputValue6(value)} />
                        </div>
                        <div style={{ flexGrow: '1' }}>
                            <h3>Сводный отчёт по результатам Анкетирования до</h3>
                            <Input hint="дд.мм.гг" value={inputValue7} onChange={(value) => setInputValue7(value)} />
                        </div>
                        <div>
                            <h3>Сдача электронных отчётов до</h3>
                            <Input hint="дд.мм.гг" value={inputValue8} onChange={(value) => setInputValue8(value)} />
                        </div>
                    </div>
                </div>
                <div className="p-block-header">
                    <div style={{ marginLeft: '10px', flexGrow: '1' }}></div>
                    <Button title="Вернуться к списку" color="btn-blue" onClick={() => router.push('/lpr/order')} />
                    <div style={{ marginLeft: '10px', flexGrow: '1' }}></div>
                    <Button title="Сформировать приказ" color="btn-green" onClick={() => alert("Тут пока ещё некуда перенаправлять ☻")} />
                    <div style={{ marginLeft: '10px', flexGrow: '1' }}></div>
                </div>
            </div>
        </div>
    );
}