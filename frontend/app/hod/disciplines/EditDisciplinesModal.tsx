"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LockKeyhole, Search } from "lucide-react";
import Modal from "@/components/modal/Modal";
import Button from "@/components/button/Button";
import CheckBox from "@/components/checkbox/CheckBox";
import MiniAlert from "@/components/alert/MiniAlert";
import { getAvailableDisciplines, saveGroupDisciplines, type Discipline, type DisciplineGroupRow } from "@/services/disciplines";
import pageStyles from "./page.module.css";
import styles from "./EditDisciplinesModal.module.css";

interface Props {
  group: DisciplineGroupRow;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditDisciplinesModal({ group, onClose, onSaved }: Props) {
  const [available, setAvailable] = useState<Discipline[] | null>(null);
  const [selectedIds, setSelectedIds] = useState(group.disciplines.map(d => d.id));
  const [search, setSearch] = useState("");
  const [loadingError, setLoadingError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    void getAvailableDisciplines(group.id, controller.signal)
      .then(list => { if (!controller.signal.aborted) setAvailable(list); })
      .catch(reason => {
        if (!controller.signal.aborted) setLoadingError(reason instanceof Error ? reason.message : "Не удалось загрузить дисциплины");
      });
    return () => controller.abort();
  }, [group.id]);

  const options = useMemo(() => {
    const list = new Map(available?.map(d => [d.id, d]));
    for (const existing of group.disciplines) list.set(existing.id, { ...list.get(existing.id), ...existing });
    return [...list.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [available, group.disciplines]);
  const matching = options.filter(d => `${d.name} ${d.departmentName ?? ""} ${d.facultyName ?? ""}`
    .toLocaleLowerCase("ru").includes(search.trim().toLocaleLowerCase("ru")));
  const changed = selectedIds.length !== group.disciplines.length || group.disciplines.some(d => !selectedIds.includes(d.id));
  const limitReached = selectedIds.length >= group.maxDisciplines;

  const toggle = (discipline: Discipline) => {
    if (savingRef.current || discipline.locked) return;
    setSaveError("");
    setSelectedIds(previous => previous.includes(discipline.id)
      ? previous.filter(id => id !== discipline.id)
      : discipline.isInStudyProgram && previous.length < group.maxDisciplines ? [...previous, discipline.id] : previous);
  };
  const close = () => { if (!savingRef.current) onClose(); };
  const save = async () => {
    if (savingRef.current || available === null || !changed) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    try {
      await saveGroupDisciplines(group.id, selectedIds, group.semesterId);
      onSaved();
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Не удалось сохранить выбор");
      savingRef.current = false;
      setSaving(false);
    }
  };

  return <Modal open onClose={close} title={<>Выбор дисциплин<span className="modal-subtitle">Группа {group.group}</span></>}
    footer={<><button type="button" className="modal-cancel" onClick={close} disabled={saving}>Отмена</button>
      <Button color="btn-blue" title={saving ? "Сохранение…" : "Сохранить выбор"} disabled={saving || !changed || available === null}
        onClick={() => void save()} /></>}>
    <div className={styles.profile}>{group.spec}{group.directionCode && <span className={pageStyles.secondary}>{group.directionCode}</span>}</div>
    <div className={styles.selectionSummary} aria-live="polite">
      <span>Выбрано <strong>{selectedIds.length} из {group.maxDisciplines}</strong></span>
      <span className={styles.steps} aria-hidden="true">{Array.from({ length: group.maxDisciplines }, (_, index) =>
        <span key={index} className={index < selectedIds.length ? styles.filled : undefined} />)}</span>
    </div>
    <p className={styles.hint}>Можно сохранить промежуточный выбор. Для завершения выберите две дисциплины.</p>
    {loadingError ? <div role="alert"><MiniAlert type="error" text={loadingError} /></div> : available === null ?
      <p className={styles.loading}>Загрузка дисциплин…</p> : <>
        {available.length === 0 && <MiniAlert type="info" text="Для этого профиля ещё не заполнен перечень дисциплин. Ранее сохранённый выбор остаётся доступен для просмотра." />}
        {group.disciplines.some(d => !d.isInStudyProgram) && <p className={styles.hint}>Ранее выбранные дисциплины вне текущего перечня отмечены отдельно. После снятия их нельзя выбрать повторно.</p>}
        {options.length > 0 && <>
          <label className={`${pageStyles.searchField} ${styles.search}`}>
            <span className="dropdown-label">Поиск дисциплины</span>
            <span className={pageStyles.searchBox}><Search size={18} aria-hidden="true" /><input className="search-input"
              type="search" placeholder="Название или кафедра" value={search} disabled={saving} onChange={event => setSearch(event.target.value)} /></span>
          </label>
          <div className={styles.options}><table className={`table-container ${styles.table}`}>
            <caption className={styles.caption}>Дисциплины программы профиля</caption>
            <thead><tr><th scope="col">Выбор</th><th scope="col">Дисциплина и кафедра</th></tr></thead>
            <tbody>{matching.map(discipline => {
              const selected = selectedIds.includes(discipline.id);
              const disabled = saving || discipline.locked || (!selected && (limitReached || !discipline.isInStudyProgram));
              const reason = discipline.locked ? "Уже начата работа с преподавателями, графиком или отчётом"
                : !selected && !discipline.isInStudyProgram ? "Дисциплина отсутствует в текущем перечне профиля"
                : !selected && limitReached ? "Сначала снимите выбор другой дисциплины" : undefined;
              return <tr key={discipline.id} className={selected ? styles.selected : undefined}>
                <td title={reason}><fieldset className={styles.checkbox} disabled={disabled}>
                  <CheckBox text={discipline.name} state={selected} type="blue" onChange={() => toggle(discipline)} />
                </fieldset></td>
                <td className={styles.discipline}>
                  <button type="button" className={styles.optionName} disabled={disabled} onClick={() => toggle(discipline)} title={reason}>
                    {discipline.name}{discipline.locked && <LockKeyhole size={14} aria-label="Изменение недоступно" />}
                  </button>
                  <span className={pageStyles.secondary}>{discipline.departmentName ?? "Кафедра не указана"}</span>
                  {discipline.facultyName && <span className={pageStyles.secondary}>{discipline.facultyName}</span>}
                  {!discipline.isInStudyProgram && <span className={styles.legacy}>Ранее выбранная · вне текущего перечня</span>}
                </td>
              </tr>;
            })}{matching.length === 0 && <tr><td colSpan={2} className={styles.loading}>Дисциплины не найдены</td></tr>}</tbody>
          </table></div>
          <p className={styles.hint}>{limitReached ? "Выбрано максимальное количество. Для замены снимите одну отметку." : "Доступны дисциплины программы, в том числе других кафедр и факультетов."}</p>
        </>}
      </>}
    {saveError && <div role="alert"><MiniAlert type="error" text={saveError} /></div>}
  </Modal>;
}
