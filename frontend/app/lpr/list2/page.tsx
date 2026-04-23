"use client";

import Navbar from "@/components/navbar/Navbar";
import Button from "@/components/button/Button";
import Dropdown from "@/components/dropdown/Dropdown";
import CheckBox from "@/components/checkbox/CheckBox";

import { useState } from "react";

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

const courses = [
    { value: 'isit', label: 'ИСИТ' },
    { value: 'sipi', label: 'СИПИ' },
    { value: 'web', label: 'ВЕБ' },
    { value: 'ib', label: 'ИБ' }
];

const classes = [
    { value: 'linal', label: 'Линейная алгебра' },
    { value: 'database', label: 'Базы данных' },
    { value: 'programming', label: 'Основы программирования' },
    { value: 'cybersecurity', label: 'Аналитика информационной безопасности' }
];

const style:React.CSSProperties = {
  display:"flex",
  justifyContent: "center"
};
const style2:React.CSSProperties = {
  display:"flex",
  alignItems: "center",
  flexDirection: "column",
};


export default function LprList() {
    const [selectedSemestr, setSelectedSemestr] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState('');
    var [selectedClass1, setSelectedClass1] = useState('linal');
    var [selectedClass2, setSelectedClass2] = useState('');

    const [isModalVisible, setIsModalVisible] = useState(true);
    const toggleDisplay = () => {
        setIsModalVisible(!isModalVisible);
    };

    const clearDisplay = () => {
        [selectedClass1, setSelectedClass1] = useState('');
        [selectedClass2, setSelectedClass2] = useState('');
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
            <div className="p-modal-container" style={{ visibility: isModalVisible ? 'hidden' : 'visible' }}>
                <h2 className="text-bold">Выбор дисциплин для группы 221-111</h2>
                <div className="p-two-column">
                    <div>
                        <Dropdown 
                            options={classes}
                            value={selectedClass1}
                            onChange={setSelectedClass1}
                            placeholder="Не выбрано"
                            label="Дисциплина 1"
                        />
                    </div>
                    <div>
                        <Dropdown 
                            options={classes}
                            value={selectedClass2}
                            onChange={setSelectedClass2}
                            placeholder="Не выбрано"
                            label="Дисциплина 2"
                        />
                    </div>
                </div>
                <div className="p-block-with-padding" style={{display: "flex", justifyContent: "space-around"}}>
                    <Button title="Вернуться" color="btn-red" onClick={() => {toggleDisplay()}} />
                    <Button title="Очистить выбор" color="btn-orange" onClick={() => {clearDisplay()}} />
                    <Button title="Подтвердить выбор" color="btn-blue" onClick={() => alert("Тут пока ещё некуда перенаправлять ☻")} />
                </div>
            </div>
            <div className="main-container">
                <div className="p-block-header">
                    <h1 className="text-bold">Формирование списка рекомендательных групп</h1>
                </div>
                <div className="p-block-with-padding">
                    <div className="p-report-dropdown-block">
                        <Dropdown 
                            options={faculties}
                            value={selectedFaculty}
                            onChange={setSelectedFaculty}
                            placeholder="Не выбрано"
                            label="Факультет/институт"
                        />
                        <Dropdown 
                            options={courses}
                            value={selectedCourse}
                            onChange={setSelectedCourse}
                            placeholder="Не выбрано"
                            label="Направление"
                        />
                        <Dropdown 
                            options={semestrs}
                            value={selectedSemestr}
                            onChange={setSelectedSemestr}
                            placeholder="Не выбрано"
                            label="Роль"
                        />
                    </div>
                </div>
                <div className="p-block-with-padding">
                    <div className="table-wrapper">
                    <table className="table-container">
                        <thead>
                            <tr>
                                <th>Группа</th>
                                <th>Курс</th>
                                <th>Предыдущие тестирования</th>
                                <th>Текущее тестирование</th>
                                <th>Запланировать тестирование</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>221-111</td>
                                <td>3</td>
                                <td>
                                    <div style={{display: "flex", flexDirection: "row", gap: "8px", justifyContent: "space-around"}}>
                                        <div style={style2}>
                                            <span>весна 2023</span>
                                            <div>
                                                <CheckBox text="" type="red" state={true}/>
                                            </div>
                                        </div>
                                        <div style={style2}>
                                            <span>осень 2023</span>
                                            <div>
                                                <CheckBox text="" type="blue" state={true}/>
                                            </div>
                                        </div>
                                        <div style={style2}>
                                            <span>весна 2024</span>
                                            <div>
                                                <CheckBox text="" type="blue" state={true}/>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={style2}>
                                        <span>весна 2025</span>
                                        <div>
                                            <CheckBox text="" type="red" state={true}/>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{display: "flex", flexDirection: "row", gap: "8px", justifyContent: "space-around"}}>
                                        <div style={style2}>
                                            <span>осень 2025</span>
                                            <div>
                                                <CheckBox text="" type="blue" state={true}/>
                                            </div>
                                        </div>
                                        <div style={style2}>
                                            <span>осень 2026</span>
                                            <div>
                                                <CheckBox text="" type="blue" />
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>221-112</td>
                                <td>3</td>
                                <td>
                                    <div style={{display: "flex", flexDirection: "row", gap: "8px", justifyContent: "space-around"}}>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="red" state={true}/>
                                            </div>
                                        </div>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="blue" state={true}/>
                                            </div>
                                        </div>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="blue" state={true}/>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={style2}>
                                        <div>
                                            <CheckBox text="" type="blue" state={true}/>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{display: "flex", flexDirection: "row", gap: "8px", justifyContent: "space-around"}}>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="blue" />
                                            </div>
                                        </div>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="blue" state={true}/>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>221-113</td>
                                <td>3</td>
                                <td>
                                    <div style={{display: "flex", flexDirection: "row", gap: "8px", justifyContent: "space-around"}}>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="red" state={true}/>
                                            </div>
                                        </div>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="blue" state={true}/>
                                            </div>
                                        </div>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="blue" state={true}/>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={style2}>
                                        <div>
                                            <CheckBox text="" type="blue" state={true}/>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{display: "flex", flexDirection: "row", gap: "8px", justifyContent: "space-around"}}>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="blue" />
                                            </div>
                                        </div>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="blue" state={true}/>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>221-114</td>
                                <td>3</td>
                                <td>
                                    <div style={{display: "flex", flexDirection: "row", gap: "8px", justifyContent: "space-around"}}>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="red" state={true}/>
                                            </div>
                                        </div>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="blue" state={true}/>
                                            </div>
                                        </div>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="blue" state={true}/>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={style2}>
                                        <div>
                                            <CheckBox text="" type="red" state={true}/>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{display: "flex", flexDirection: "row", gap: "8px", justifyContent: "space-around"}}>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="blue" state={true}/>
                                            </div>
                                        </div>
                                        <div style={style2}>
                                            <div>
                                                <CheckBox text="" type="blue" />
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    </div>
                </div>
                <div className="p-block-with-padding">
                    <div style={style}>
                        <Button title="Сформировать приказ" color="btn-blue" onClick={() => {toggleDisplay()}} />
                    </div>
                </div>
            </div>
        </div>
    );
}