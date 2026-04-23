"use client";

import Navbar from "@/components/navbar/Navbar";
import Table from "@/components/table/Table";
import Button from "@/components/button/Button";
import Dropdown from "@/components/dropdown/Dropdown";
import Input from "@/components/input/Input";

import { useState } from "react";

import { PieChart, FileText, Users, BookOpen, Settings } from 'lucide-react';

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
const roles = [
    { value: 'teacher', label: 'Преподаватель' },
    { value: 'manager', label: 'Руководитель подразделения' },
    { value: 'guest', label: 'Гость' }
];

const table = [
    {
        name: "Иванов Иван Иванович", role: "Преподаватель", faculty: "ФИТ", action: "Изменить"
    },
    {
        name: "Иванов Иван Иванович", role: "Преподаватель", faculty: "ФИТ", action: "Изменить"
    },
    {
        name: "Иванов Иван Иванович", role: "Руководитель подразделения", faculty: "ФИТ", action: "Изменить"
    },
    {
        name: "Иванов Иван Иванович", role: "Гость", faculty: "ФИТ", action: "Изменить"
    },
    {
        name: "", role: "", faculty: "", action: 'Добавить'
    }
]

const style:React.CSSProperties = {
  display:"flex",
  justifyContent: "center"
};

export default function LprSettings() {
    const [selectedSemestr, setSelectedSemestr] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState('');

    const [inputValue, setInputValue] = useState('01.01.2025');
    const [inputValue2, setInputValue2] = useState('01.01.2025');
    const [inputValue3, setInputValue3] = useState('01.01.2025');
    const [inputValue4, setInputValue4] = useState('01.01.2025');
    const [inputValue5, setInputValue5] = useState('01.01.2025');
    const [inputValue6, setInputValue6] = useState('01.01.2025');
    const [inputValue7, setInputValue7] = useState('01.01.2025');
    const [inputValue8, setInputValue8] = useState('01.01.2025');
    const [inputValue9, setInputValue9] = useState('01.01.2025');

    const [isFirstVisible, setIsFirstVisible] = useState(true);
    const toggleDisplay = () => {
        setIsFirstVisible(!isFirstVisible);
    };



    return (
        <div className="bg-container">
            <div className="bg-gradient"></div>
            <Navbar
                title="Проверка остаточных знаний"
                linkOptions={[
                    { label: "Статистика",                   href: "/csh/lpr/statistics",     icon: PieChart },
                    { label: "Приказы",                   href: "/csh/lpr/order",    icon: FileText },
                    { label: "Списки рекомедуемых групп", href: "/csh/lpr/list",     icon: Users },
                    { label: "Отчеты",                    href: "/csh/lpr/report",   icon: BookOpen },
                    { label: "Настройки доступа",         href: "/csh/lpr/settings", icon: Settings },
                ]}
                name="Иван"
                surname="Иванов"
                lastname="Иванович"
                role="Лицо, принимающее решения"
            />
            <div className="main-container" style={{ display: isFirstVisible ? 'block' : 'none' }}>
                <div className="p-block-header">
                    <h1 className="text-bold">Настройки доступа</h1>
                    <Button title="Настройки ролей" color="btn-blue" onClick={toggleDisplay} />
                </div>
                <div className="p-block-with-padding">
                    <div className="p-report-dropdown-block">
                        <Dropdown 
                            options={roles}
                            value={selectedRole}
                            onChange={setSelectedRole}
                            placeholder="Не выбрано"
                            label="Роль"
                        />
                        <Dropdown 
                            options={faculties}
                            value={selectedFaculty}
                            onChange={setSelectedFaculty}
                            placeholder="Не выбрано"
                            label="Факультет/институт"
                        />
                    </div>
                </div>
                <Table 
                    columns={[
                    { 
                        header: 'ФИО', 
                        accessor: 'name'
                    },
                    { 
                        header: 'Роль в системе', 
                        accessor: 'role'
                    },
                    { 
                        header: 'Факультет/институт', 
                        accessor: 'faculty'
                    },
                    { 
                        header: 'Действия', 
                        accessor: 'action'
                    }
                    ]}
                    data={table}
                />
            </div>
            <div className="main-container" style={{ display: isFirstVisible ? 'none' : 'block' }}>
                <div className="p-block-header">
                    <h1 className="text-bold">Настройки доступа</h1>
                    <Button title="Настройки дат" color="btn-blue" onClick={toggleDisplay} />
                </div>
                <div className="search-container" style={style}>
                    <Dropdown 
                      options={semestrs}
                      value={selectedSemestr}
                      onChange={setSelectedSemestr}
                      placeholder="Не выбрано"
                      label="Семестр"
                    />
                </div>
                <div className="p-block-with-padding"></div>
                <div className="p-block-with-padding2 p-two-column">
                    <div>
                        <div style={style}>
                            <h3 className="text-bold">Списки, графики и анкетирование</h3>
                        </div>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "8px 0"}}>
                            <p className="text">Формирование списков студентов</p>
                            <div>
                                <Input hint="дд.мм.гг" value={inputValue} onChange={(value) => setInputValue(value)} />
                            </div>
                            -
                            <div>
                                <Input hint="дд.мм.гг" value={inputValue2} onChange={(value) => setInputValue2(value)} />
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "8px 0"}}>
                            <p className="text">Формирование графиков тестирования</p>
                            <div>
                                <Input hint="дд.мм.гг" value={inputValue3} onChange={(value) => setInputValue3(value)} />
                            </div>
                            -
                            <div>
                                <Input hint="дд.мм.гг" value={inputValue4} onChange={(value) => setInputValue4(value)} />
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "8px 0"}}>
                            <p className="text">Сроки проведения анкетирования</p>
                            <div>
                                <Input hint="дд.мм.гг" value={inputValue5} onChange={(value) => setInputValue5(value)} />
                            </div>
                            -
                            <div>
                                <Input hint="дд.мм.гг" value={inputValue6} onChange={(value) => setInputValue6(value)} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style={style}>
                            <h3 className="text-bold">Отчёты</h3>
                        </div>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "8px 0"}}>
                            <p className="text">Сдача электронных отчётов до</p>
                            <div>
                                <Input hint="дд.мм.гг" value={inputValue7} onChange={(value) => setInputValue7(value)} />
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "8px 0"}}>
                            <p className="text">Сдача бумажных отчётов до</p>
                            <div>
                                <Input hint="дд.мм.гг" value={inputValue8} onChange={(value) => setInputValue8(value)} />
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "8px 0"}}>
                            <p className="text">Подготовка сводного отчёта до</p>
                            <div>
                                <Input hint="дд.мм.гг" value={inputValue9} onChange={(value) => setInputValue9(value)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}