"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Search } from "lucide-react";
import Button from "@/components/button/Button";
import Dropdown from "@/components/dropdown/Dropdown";
import MiniAlert from "@/components/alert/MiniAlert";
import Pagination from "@/components/pagination/Pagination";
import Table, { type Column } from "@/components/table/Table";
import { usePagination } from "@/components/pagination/usePagination";
import { getDepartment, getGroups, type DisciplineGroupRow } from "@/services/disciplines";
import EditDisciplinesModal from "./EditDisciplinesModal";
import styles from "./page.module.css";

export default function DisciplineSelection() {
  const [rows, setRows] = useState<DisciplineGroupRow[]>([]);
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DisciplineGroupRow | null>(null);
  const request = useRef<AbortController | null>(null);

  const load = useCallback((controller: AbortController) =>
    Promise.all([getGroups(controller.signal), getDepartment(controller.signal)]).then(([groups, currentDepartment]) => {
      if (!controller.signal.aborted) {
        setRows(groups);
        setDepartment(currentDepartment.name);
      }
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Не удалось загрузить группы");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    }), []);

  const refresh = () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    void load(controller);
  };

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    void load(controller);
    return () => request.current?.abort();
  }, [load]);

  const profiles = useMemo(() => [{ value: "", label: "Все профили" },
    ...[...new Map(rows.map(row => [row.programId, row.spec])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "ru"))
      .map(([id, label]) => ({ value: String(id), label }))], [rows]);
  const filtered = useMemo(() => rows.filter(row => {
    const complete = row.maxDisciplines > 0 && row.disciplines.length === row.maxDisciplines;
    return (!profile || String(row.programId) === profile)
      && (!status || (status === "complete" ? complete : status === "empty-program"
        ? row.availableDisciplinesCount === 0 : !complete))
      && `${row.group} ${row.spec} ${row.directionCode ?? ""} ${row.disciplines.map(d => d.name).join(" ")}`
        .toLocaleLowerCase("ru").includes(search.trim().toLocaleLowerCase("ru"));
  }).sort((a, b) => (a.directionCode ?? "").localeCompare(b.directionCode ?? "")
    || a.spec.localeCompare(b.spec, "ru") || a.group.localeCompare(b.group, "ru", { numeric: true })),
  [rows, profile, status, search]);
  const { currentPage, totalPages, pageItems, setPage } = usePagination(filtered, 12);
  const semester = rows[0];
  const completeCount = rows.filter(row => row.maxDisciplines > 0 && row.disciplines.length === row.maxDisciplines).length;
  const columns: Column<DisciplineGroupRow>[] = [
    { header: "Профиль подготовки", className: styles.profileCell, accessor: row => <>
      <span className={styles.profileName}>{row.spec}</span>
      {row.directionCode && <span className={styles.secondary}>{row.directionCode}</span>}
    </> },
    { header: "Группа", style: { width: "130px" }, accessor: row => <strong>{row.group}</strong> },
    { header: "Дисциплины для проверки", className: styles.disciplinesCell, accessor: row => row.disciplines.length
      ? <ol className={styles.selectedList}>{row.disciplines.map(discipline => <li key={discipline.id}>
        {discipline.name}{!discipline.isInStudyProgram && <span className={styles.secondary}>Ранее выбранная дисциплина</span>}
      </li>)}</ol> : <span className={styles.secondary}>Дисциплины ещё не выбраны</span> },
    { header: "Выбор", style: { width: "168px" }, accessor: row => <div className={styles.progressCell}>
      <span className={row.disciplines.length === row.maxDisciplines && row.maxDisciplines > 0 ? styles.complete : styles.pending}>
        {row.disciplines.length === row.maxDisciplines && row.maxDisciplines > 0 && <Check size={15} aria-hidden="true" />}
        {row.disciplines.length} из {row.maxDisciplines}
      </span>
      {row.availableDisciplinesCount === 0 && <span className={styles.secondary}>Перечень не заполнен</span>}
    </div> },
    { header: "Действие", style: { width: "150px" }, accessor: row => <Button color="btn-blue" onClick={() => setEditing(row)}>
      {row.disciplines.length ? "Изменить" : "Выбрать"}<ChevronRight size={15} aria-hidden="true" />
    </Button> },
  ];

  return <div className="main-container" aria-busy={loading}>
    <div className="p-block-header"><h1 className="text-bold">Выбор дисциплин</h1></div>
    <div className="p-block-with-padding">
      <div className={styles.context}>
        {department && <p className="text">{department}</p>}
        {semester && <p className={styles.secondary}>{semester.semesterPart === 1 ? "Весна" : "Осень"} {semester.semesterYear}</p>}
      </div>
      <p className={styles.description}>Выберите две дисциплины из программы профиля для каждой участвующей группы.</p>
      {error && <div role="alert"><MiniAlert type="error" text={error} /></div>}
      {notice && <div role="status"><MiniAlert type="success" text={notice} /></div>}
      <div className={styles.filters}>
        <Dropdown label="Профиль подготовки" options={profiles} value={profile} onChange={value => { setProfile(value); setPage(1); }} />
        <Dropdown label="Состояние выбора" value={status} onChange={value => { setStatus(value); setPage(1); }} options={[
          { value: "", label: "Все группы" }, { value: "incomplete", label: "Не завершён" },
          { value: "complete", label: "Выбраны дисциплины" }, { value: "empty-program", label: "Нет перечня дисциплин" },
        ]} />
        <label className={styles.searchField}><span className="dropdown-label">Поиск</span>
          <span className={styles.searchBox}><Search size={18} aria-hidden="true" /><input className="search-input"
            type="search" placeholder="Группа или дисциплина" value={search}
            onChange={event => { setSearch(event.target.value); setPage(1); }} /></span>
        </label>
      </div>
    </div>
    <div className={`p-block-with-padding ${styles.content}`}>
      {loading ? <p className={styles.empty}>Загрузка групп…</p> : error ? <div className={styles.empty}>
        <Button color="btn-blue" title="Повторить загрузку" onClick={() => void refresh()} />
      </div> : rows.length === 0 ? <div className={styles.empty}>
        <p>В текущем семестре нет групп для выбора дисциплин.</p>
        <a href="/csh/hod/groups" className={styles.link}>Перейти к выбору групп</a>
      </div> : <>
        <div className={styles.summary}><span>Групп: {rows.length}</span><span>Дисциплины выбраны: {completeCount} из {rows.length}</span></div>
        {filtered.length ? <div className={styles.table}><Table columns={columns} data={pageItems} style={{ width: "100%" }}
          onRowClick={setEditing} /></div> : <div className={styles.empty}>
          <p>По выбранным фильтрам ничего не найдено.</p>
          <button type="button" className="modal-cancel" onClick={() => { setProfile(""); setStatus(""); setSearch(""); setPage(1); }}>Сбросить фильтры</button>
        </div>}
        {totalPages > 1 && <div className={styles.pagination}><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} /></div>}
      </>}
    </div>
    {editing && <EditDisciplinesModal key={`${editing.id}:${editing.semesterId}`} group={editing} onClose={() => setEditing(null)}
      onSaved={() => { setNotice(`Выбор дисциплин для группы ${editing.group} сохранён.`); setEditing(null); void refresh(); }} />}
  </div>;
}
