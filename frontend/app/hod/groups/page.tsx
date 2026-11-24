"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import Button from "@/components/button/Button";
import CheckBox from "@/components/checkbox/CheckBox";
import Modal from "@/components/modal/Modal";
import Dropdown from "@/components/dropdown/Dropdown";
import MiniAlert from "@/components/alert/MiniAlert";
import GroupsTestingTable, { TestingMark } from "@/components/groupsTesting/GroupsTestingTable";
import { historySemesterLabel } from "@/components/groupsTesting/TestingHistory";
import { DocumentApiError } from "@/services/documents";
import { getHodGroups, saveHodGroups, type HodDecision, type HodGroupsResponse } from "@/services/hodGroups";
import tableStyles from "@/app/lpr/list2/page.module.css";
import styles from "./page.module.css";

interface ReasonDialog {
  studyProgramId: number;
  groupId: number;
  selectedGroupId: number | null;
}

export default function HodGroupSelection() {
  const [data, setData] = useState<HodGroupsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [needsReload, setNeedsReload] = useState(false);
  const [direction, setDirection] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [edits, setEdits] = useState<Record<number, HodDecision>>({});
  const [reasonDialog, setReasonDialog] = useState<ReasonDialog | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [reasonError, setReasonError] = useState("");
  const reasonField = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (reasonDialog) reasonField.current?.focus();
  }, [reasonDialog]);

  useEffect(() => {
    const controller = new AbortController();
    void getHodGroups(controller.signal).then(result => {
      if (!controller.signal.aborted) setData(result);
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Не удалось загрузить группы");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const programs = useMemo(() => (data?.plan?.studyPrograms ?? []).filter(program =>
    program.groups.length > 0 && (!direction || program.cypherOfTheDirection === direction)
    && (!facultyId || String(program.facultyId) === facultyId)), [data, direction, facultyId]);
  const choiceMap = new Map(data?.choices.map(choice => [choice.studyProgramId, choice]));
  const visible = new Set(programs.map(program => program.studyProgramId));
  const pending = (data?.choices ?? []).filter(choice => choice.editable && (
    edits[choice.studyProgramId] || (!choice.reviewed && visible.has(choice.studyProgramId) && choice.recommendedGroupId !== null)));
  const current = data?.plan?.semesters.find(semester => semester.id === data.plan?.currentSemesterId);
  const faculties = new Map<string, string>();
  for (const program of data?.plan?.studyPrograms ?? []) {
    if (program.facultyId !== null) faculties.set(String(program.facultyId), program.facultyName ?? "Без названия");
  }
  const facultyOptions = [{ value: "", label: "Все факультеты / институты" }, ...[...faculties]
    .sort((a, b) => a[1].localeCompare(b[1], "ru")).map(([value, label]) => ({ value, label }))];
  const directionOptions = [{ value: "", label: "Все направления" }, ...[...new Set(
    (data?.plan?.studyPrograms ?? []).filter(program => !facultyId || String(program.facultyId) === facultyId)
      .map(program => program.cypherOfTheDirection).filter((code): code is string => Boolean(code)),
  )].sort().map(code => ({ value: code, label: code }))];

  const openReason = (studyProgramId: number, groupId: number, selectedGroupId: number | null) => {
    if (busyRef.current) return;
    const choice = choiceMap.get(studyProgramId);
    if (!choice) return;
    setReasonText(edits[studyProgramId]?.reason ?? choice.reason ?? "");
    setReasonError("");
    setReasonDialog({ studyProgramId, groupId, selectedGroupId });
  };

  const update = (studyProgramId: number, selectedGroupId: number | null, reason: string) => {
    setEdits(previous => ({ ...previous, [studyProgramId]: { studyProgramId, selectedGroupId, reason } }));
    setNotice("");
    setError("");
  };

  const changeSelection = (studyProgramId: number, groupId: number, planned: boolean) => {
    const choice = choiceMap.get(studyProgramId);
    if (!choice?.editable || busyRef.current || needsReload) return;
    if (!planned) {
      openReason(studyProgramId, groupId, null);
      return;
    }
    const draft = edits[studyProgramId];
    const selected = draft ? draft.selectedGroupId : choice.selectedGroupId;
    if (!choice.eligibleGroupIds.includes(groupId) || (selected !== null && selected !== groupId)) return;
    const reason = groupId === choice.recommendedGroupId ? "" : draft?.reason ?? choice.reason ?? "";
    if (groupId !== choice.recommendedGroupId && !reason.trim()) {
      openReason(studyProgramId, groupId, groupId);
      return;
    }
    update(studyProgramId, groupId, reason);
  };

  const applyReason = () => {
    if (!reasonDialog || busyRef.current || needsReload) return;
    const choice = choiceMap.get(reasonDialog.studyProgramId);
    if (!choice?.editable) return;
    const reason = reasonText.trim();
    if (reasonDialog.selectedGroupId !== choice.recommendedGroupId && !reason) {
      setReasonError("Укажите причину отказа или замены рекомендованной группы.");
      reasonField.current?.focus();
      return;
    }
    update(reasonDialog.studyProgramId, reasonDialog.selectedGroupId, reason);
    setReasonDialog(null);
  };

  const refresh = async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try { setData(await getHodGroups()); setEdits({}); setNeedsReload(false); setNotice(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Не удалось обновить таблицу"); }
    finally { busyRef.current = false; setBusy(false); }
  };

  const save = async () => {
    if (!data?.plan || busyRef.current || needsReload || pending.length === 0) return;
    const decisions = pending.map(c => edits[c.studyProgramId] ?? {
      studyProgramId: c.studyProgramId, selectedGroupId: c.selectedGroupId, reason: c.reason ?? "",
    });
    const missing = decisions.find(d => d.selectedGroupId !== choiceMap.get(d.studyProgramId)?.recommendedGroupId && !d.reason.trim());
    if (missing) {
      setError("Укажите причину отказа или замены рекомендованной группы.");
      const problem = data.plan.studyPrograms.find(p => p.studyProgramId === missing.studyProgramId);
      setDirection(problem?.cypherOfTheDirection ?? "");
      setFacultyId(problem?.facultyId === null || problem?.facultyId === undefined ? "" : String(problem.facultyId));
      openReason(missing.studyProgramId,
        missing.selectedGroupId ?? choiceMap.get(missing.studyProgramId)?.recommendedGroupId ?? problem!.groups[0].groupId,
        missing.selectedGroupId);
      return;
    }
    busyRef.current = true; setBusy(true); setError(""); setNotice("");
    try {
      setData(await saveHodGroups(data.plan.currentSemesterId, data.plan.version, decisions));
      setEdits({});
      setNotice("Участие групп сохранено. Для итоговых групп доступен выбор дисциплин.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить выбор");
      if (reason instanceof DocumentApiError && reason.status === 409) setNeedsReload(true);
    } finally { busyRef.current = false; setBusy(false); }
  };

  const disabled = busy || needsReload;
  const dialogChoice = reasonDialog ? choiceMap.get(reasonDialog.studyProgramId) : undefined;
  const dialogProgram = data?.plan?.studyPrograms.find(program => program.studyProgramId === reasonDialog?.studyProgramId);
  const dialogEditable = dialogChoice?.editable === true && !disabled;
  const reasonRequired = reasonDialog !== null && reasonDialog.selectedGroupId !== dialogChoice?.recommendedGroupId;
  return (
    <div className="main-container" aria-busy={loading || busy}>
      <div className="p-block-header"><h1 className="text-bold">Выбор групп</h1></div>
      {error && <div className="p-block-with-padding" role="alert"><MiniAlert type="error" text={error} /></div>}
      {notice && <div className="p-block-with-padding" role="status"><MiniAlert type="success" text={notice} /></div>}
      {loading ? <p className="text">Загрузка…</p> : !data?.plan ? (
        <div className="p-block-with-padding"><p className="text">Ожидается формирование рекомендаций ЛПР на текущий семестр.</p>
          <Button title="Обновить список" color="btn-blue" disabled={busy} onClick={() => void refresh()} /></div>
      ) : <>
        <div className="p-block-with-padding">
          <p className="text">{data.departmentName}</p>
          <p className="text">Текущий семестр: {current && historySemesterLabel(current)}</p>
          <p className="text">Ручной выбор ЛПР можно заменить в рамках цикла тестирований. Назначение автоподбором можно отменить.
            Для изменения причины нажмите на ячейку текущего семестра. На семестр участвует не более одной группы профиля.</p>
          {data.plan.requiresRecalculation && <MiniAlert type="info" text="Рекомендации требуют уточнения. Подтвердите итоговый выбор групп на текущий семестр." />}
          <div className={tableStyles.filters}>
            <Dropdown label="Факультет/институт" options={facultyOptions} value={facultyId} placeholder="Все факультеты / институты"
              onChange={value => { setFacultyId(value); setDirection(""); }} />
            <Dropdown label="Направление" options={directionOptions} value={direction} placeholder="Все направления" onChange={setDirection} />
          </div>
        </div>
        <div className="p-block-with-padding">
          {programs.length === 0 ? <p className="text">Нет групп для выбранных фильтров</p> : (
            <GroupsTestingTable programs={programs} semesters={data.plan.semesters} currentSemesterId={data.plan.currentSemesterId}
              renderPlanningCell={(program, group, semester) => {
                const cell = group.plannedTestings.find(item => item.semesterId === semester.id)!;
                if (semester.id !== data.plan!.currentSemesterId) {
                  return <td className={tableStyles.statusCell} title={cell.restrictionReason ?? undefined}>
                    {cell.editable ? (
                      <span className={`${tableStyles.planningChoice} ${styles.readOnlyChoice}`}>
                        <span className={`cb-block ${cell.planned ? "cb-block-active-blue" : "cb-block-deactive"}`}
                          role="img" aria-label={`${group.groupNumber}, ${historySemesterLabel(semester)}: ${cell.planned ? "Тестирование назначено" : "Тестирование не назначено"}`}>
                          {cell.planned && <Check size={14} strokeWidth={1.8} aria-hidden="true" />}
                        </span>
                      </span>
                    ) : (
                      <TestingMark checked={cell.planned}
                        label={`${historySemesterLabel(semester)}: ${cell.planned ? "Тестирование назначено" : "Тестирование не назначено"}`} />
                    )}
                    {cell.planned && cell.author === "automatic" && <small className={tableStyles.automaticLabel}>Автоподбор</small>}
                  </td>;
                }
                const choice = choiceMap.get(program.studyProgramId)!;
                const draft = edits[program.studyProgramId];
                const selected = draft ? draft.selectedGroupId : choice.selectedGroupId;
                const checked = selected === group.groupId;
                const recommended = program.groups.find(item => item.groupId === choice.recommendedGroupId);
                const automatic = recommended?.plannedTestings.find(item => item.semesterId === semester.id)?.author === "automatic";
                const occupiedElsewhere = selected !== null && selected !== group.groupId;
                const restriction = !choice.editable ? choice.restrictionReason ?? "Изменение недоступно"
                  : !checked && automatic && group.groupId !== choice.recommendedGroupId
                    ? "Назначение автоподбором можно только отменить или восстановить"
                    : !checked && occupiedElsewhere ? "Сначала отмените выбор другой группы профиля"
                      : !checked && !choice.eligibleGroupIds.includes(group.groupId)
                        ? "Группа недоступна: архив или ограничение цикла тестирования" : null;
                const reason = draft?.reason ?? choice.reason;
                return <td className={`${tableStyles.statusCell} ${styles.reasonCell}`} tabIndex={0}
                  aria-label={`Причина изменения выбора группы ${group.groupNumber}`}
                  title={reason || restriction || "Указать причину изменения выбора"}
                  onClick={event => {
                    if (event.target instanceof Element && event.target.closest(".cb-container")) return;
                    openReason(program.studyProgramId, group.groupId, selected);
                  }}
                  onKeyDown={event => {
                    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      openReason(program.studyProgramId, group.groupId, selected);
                    }
                  }}>
                  <fieldset className={tableStyles.planningChoice} disabled={disabled || restriction !== null}
                    aria-label={`Тестирование группы ${group.groupNumber}`} title={restriction ?? undefined}>
                    <CheckBox text={`Назначить тестирование: ${group.groupNumber}, ${historySemesterLabel(semester)}`}
                      type="blue" state={checked} onChange={planned => changeSelection(program.studyProgramId, group.groupId, planned)} />
                  </fieldset>
                  {checked && automatic && <small className={tableStyles.automaticLabel}>Автоподбор</small>}
                </td>;
              }} />
          )}
        </div>
        <div className={`p-block-with-padding ${tableStyles.actions}`}>
          <Button title={busy ? "Сохранение…" : "Подтвердить и сохранить"} color="btn-green" disabled={disabled || pending.length === 0} onClick={() => void save()} />
          <Button title="Отменить изменения" color="btn-orange" disabled={busy || Object.keys(edits).length === 0} onClick={() => { setEdits({}); setError(""); setNotice(""); }} />
          <Button title={needsReload ? "Обновить и сбросить изменения" : "Обновить список"} color="btn-blue" disabled={busy || (!needsReload && Object.keys(edits).length > 0)} onClick={() => void refresh()} />
          {pending.length > 0 && <span className="text">Профилей к сохранению: {pending.length}</span>}
        </div>
      </>}
      <Modal open={reasonDialog !== null} onClose={() => setReasonDialog(null)}
        title={<>Причина изменения выбора<span className="modal-subtitle">{dialogProgram?.studyProgramName}</span></>}
        footer={<>
          <button type="button" className="modal-cancel" onClick={() => setReasonDialog(null)}>{dialogEditable ? "Отмена" : "Закрыть"}</button>
          {dialogEditable && <Button title="Применить" color="btn-blue" onClick={applyReason} />}
        </>}>
        {reasonDialog && <>
          <dl className={styles.details}>
            <div><dt>Выбор ЛПР</dt><dd>{dialogProgram?.groups.find(group => group.groupId === dialogChoice?.recommendedGroupId)?.groupNumber ?? "Группа не выбрана"}</dd></div>
            <div><dt>Выбор заведующего кафедрой</dt><dd>{dialogProgram?.groups.find(group => group.groupId === reasonDialog.selectedGroupId)?.groupNumber ?? "Участие отменено"}</dd></div>
          </dl>
          {dialogChoice?.restrictionReason && <p className="text">{dialogChoice.restrictionReason}</p>}
          {needsReload && <p className="text">Обновите список перед дальнейшими изменениями.</p>}
          <div className={styles.reason}>
            <label htmlFor="hod-selection-reason">Причина отказа или замены{reasonRequired ? " (обязательно)" : ""}</label>
            <textarea id="hod-selection-reason" ref={reasonField} maxLength={1000} value={reasonText}
              readOnly={!dialogEditable} required={reasonRequired} aria-invalid={Boolean(reasonError)}
              aria-describedby={reasonError ? "hod-reason-error" : undefined}
              onChange={event => { setReasonText(event.target.value); setReasonError(""); }} />
          </div>
          {reasonError && <p id="hod-reason-error" className="modal-error" role="alert">{reasonError}</p>}
        </>}
      </Modal>
    </div>
  );
}
