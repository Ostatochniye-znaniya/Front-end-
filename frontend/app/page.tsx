"use client";

import Button from "../components/button/Button";
import ThemeToggle from "../components/dev/ThemeToggle";

export default function Home() {
  

  return (
    <div className="flex">
      <ThemeToggle />
      <Button title="Кнопка 1" color="btn-blue" onClick={() => alert("Кнопка 1 нажата")} />
      <Button title="Кнопка 1" color="btn-red" onClick={() => alert("Кнопка 1 нажата")} />
      <Button title="Кнопка 1" color="btn-orange" onClick={() => alert("Кнопка 1 нажата")} />  
      <Button title="Кнопка 1" color="btn-green" onClick={() => alert("Кнопка 1 нажата")} />
      <Button title="Кнопка 1" color="btn-purple" onClick={() => alert("Кнопка 1 нажата")} />
    </div>
  );
}
