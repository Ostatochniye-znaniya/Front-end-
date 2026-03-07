"use client";

import Button from "@/components/button/Button";
import CheckBox from "@/components/checkbox/CheckBox";
import Alert from "@/components/alert/Alert";
import Input from "@/components/input/Input";
import Search from "@/components/search/Search";

import { useState } from "react";

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [inputBigValue, setInputBigValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searchBigValue, setSearchBigValue] = useState('');
  return (
    <div>
      <p className="title">Московский Политехнический Университет - Остаточные знания</p>
      <p className="text">Это тестовая страница для проверки компонентов</p>
      <p className="title">Кнопки</p>
      <div className="flex">
        <Button title="Кнопка 1" color="btn-blue" onClick={() => alert("Кнопка 1 нажата")} />
        <div style={{ marginLeft: '10px' }}></div>
        <Button title="Кнопка 2" color="btn-red" onClick={() => alert("Кнопка 2 нажата")} />
        <div style={{ marginLeft: '10px' }}></div>
        <Button title="Кнопка 3" color="btn-orange" onClick={() => alert("Кнопка 3 нажата")} />
        <div style={{ marginLeft: '10px' }}></div>
        <Button title="Кнопка 4" color="btn-green" onClick={() => alert("Кнопка 4 нажата")} />
        <div style={{ marginLeft: '10px' }}></div>
        <Button title="Кнопка 5" color="btn-purple" onClick={() => alert("Кнопка 5 нажата")} />
      </div>
      <p className="title">Чекбоксы</p>
      <div className="flex">
        <CheckBox text="Чек бокс с галкой" type="blue" />
        <CheckBox text="Чек бокс с крестиком" type="red" />
      </div>
      <p className="title">Поиск</p>
      <Search hint="Поиск" value={searchValue} onChange={(value) => setSearchValue(value)} size="small" />
      <p className="title">Большой поиск</p>
      <Search hint="Введите сюда" value={searchBigValue} onChange={(value) => setSearchBigValue(value)} size="large" />
      <p className="title">Выпадающий список</p>
      <p className="title">Ввод</p>
      <Input hint="Введите текст..." value={inputValue} onChange={(value) => setInputValue(value)} />
      <p className="title">Большой ввод</p>
      <Input hint="Описание" value={inputBigValue} onChange={(value) => setInputBigValue(value)} multiline rows={5} />
      <p className="title">Уведомления</p>
      <Alert type="success" title="Успешная операция" text="Текст" />
      <div style={{
        height: '20px'
      }}></div>
      <Alert type="error" title="Произошла ошибка" text="Текст" />
      <div style={{
        height: '20px'
      }}></div>
      <Alert type="warning" title="Предупреждение" text="Текст" />
      <div style={{
        height: '20px'
      }}></div>
      <Alert type="info" title="Информация" text="Текст" />
      <p className="title">Таблица</p>
    </div>
  );
}
