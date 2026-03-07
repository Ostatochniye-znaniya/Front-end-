"use client";

import Button from "../components/button/Button";
import CheckBox from "../components/checkbox/CheckBox";

export default function Home() {
  

  return (
    <div>
    <div className="flex">
      <Button title="Кнопка 1" color="btn-blue" onClick={() => alert("Кнопка 1 нажата")} />
      <Button title="Кнопка 1" color="btn-red" onClick={() => alert("Кнопка 1 нажата")} />
      <Button title="Кнопка 1" color="btn-orange" onClick={() => alert("Кнопка 1 нажата")} />  
      <Button title="Кнопка 1" color="btn-green" onClick={() => alert("Кнопка 1 нажата")} />
      <Button title="Кнопка 1" color="btn-purple" onClick={() => alert("Кнопка 1 нажата")} />
      
    </div>
    <div className="flex">
      <CheckBox text="Чек бокс с галкой" type="blue" />
      <CheckBox text="Чек бокс с крестиком" type="red" />
    </div>
    </div>
  );
}
