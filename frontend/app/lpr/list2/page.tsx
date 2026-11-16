"use client";

import Button from "@/components/button/Button";
import MiniAlert from "@/components/alert/MiniAlert";
import CheckBox from "@/components/checkbox/CheckBox";
import Dropdown from "@/components/dropdown/Dropdown";
import GroupsTestingTable, { TestingMark } from "@/components/groupsTesting/GroupsTestingTable";
import { historySemesterLabel as semesterLabel } from "@/components/groupsTesting/TestingHistory";
import StudentListPeriodPicker from "@/components/groupsTesting/StudentListPeriodPicker";
import {
  autoFillPlannedTestings,
  getGroupsTesting,
  updateGroupsTesting,
  type GroupsTestingResponse,
  type StudentListFormationPeriod,
} from "@/services/groupsTesting";
import {
  changeTestingSelection,
  getOccupiedGroup,
  isTestingPlanned,
  type TestingSelection,
} from "@/services/groupTestingSelection";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

export default function LprRecommendedGroupsPage() {
  const [data, setData] = useState<GroupsTestingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [action, setAction] = useState<"auto" | "save" | "refresh" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [needsReload, setNeedsReload] = useState(false);
  const [selection, setSelection] = useState<TestingSelection>({});
  const [periodSelection, setPeriodSelection] = useState<StudentListFormationPeriod | null>(null);
  const [facultyId, setFacultyId] = useState("");
  const [directionCode, setDirectionCode] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void getGroupsTesting({}, controller.signal).then((response) => {
      if (!controller.signal.aborted) setData(response);
    }).catch((caught: unknown) => {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Не удалось загрузить план");
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, []);

  const changedCount = Object.keys(selection).length + (periodSelection ? 1 : 0);
  const busy = isLoading || action !== null;
  const editDisabled = busy || needsReload || data?.requiresRecalculation === true;

  const handleAutoFill = async () => {
    if (busy || changedCount > 0) return;
    setAction("auto");
    setError(null);
    setNotice(null);
    try {
      setData(await autoFillPlannedTestings());
      setSelection({});
      setPeriodSelection(null);
      setFacultyId("");
      setDirectionCode("");
      setNeedsReload(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось выполнить подбор");
    } finally {
      setAction(null);
    }
  };

  const handleRefresh = async () => {
    if (busy || (changedCount > 0 && !needsReload)) return;
    setAction("refresh");
    setError(null);
    setNotice(null);
    try {
      setData(await getGroupsTesting());
      setSelection({});
      setPeriodSelection(null);
      setNeedsReload(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось обновить план");
    } finally {
      setAction(null);
    }
  };

  const handleSave = async () => {
    if (!data || editDisabled || changedCount === 0) return;
    setAction("save");
    setError(null);
    setNotice(null);
    try {
      const response = await updateGroupsTesting({
        currentSemesterId: data.currentSemesterId,
        version: data.version,
        changes: Object.values(selection),
        ...(periodSelection && { studentListFormationPeriod: periodSelection }),
      });
      setData(response);
      setSelection({});
      setPeriodSelection(null);
      setNotice("Выбор сохранён, зависимые назначения пересчитаны");
    } catch (caught) {
      setNeedsReload(true);
      const message = caught instanceof Error ? caught.message : "Не удалось подтвердить сохранение";
      setError(message + " Обновите список перед дальнейшими изменениями.");
    } finally {
      setAction(null);
    }
  };

  const faculties = useMemo(() => {
    const options = new Map<string, string>();
    for (const program of data?.studyPrograms ?? []) {
      if (program.facultyId !== null) {
        options.set(String(program.facultyId), program.facultyName ?? "Без названия");
      }
    }
    return [
      { value: "", label: "Все факультеты / институты" },
      ...[...options].sort((a, b) => a[1].localeCompare(b[1], "ru"))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [data]);

  const directionOptions = useMemo(() => {
    const codes = new Set<string>();
    for (const program of data?.studyPrograms ?? []) {
      if ((!facultyId || String(program.facultyId) === facultyId)
        && program.cypherOfTheDirection) codes.add(program.cypherOfTheDirection);
    }
    return [
      { value: "", label: "Все направления" },
      ...[...codes].sort().map((code) => ({ value: code, label: code })),
    ];
  }, [data, facultyId]);

  const programs = useMemo(
    () => (data?.studyPrograms ?? [])
      .filter((program) => program.groups.length > 0
        && (!facultyId || String(program.facultyId) === facultyId)
        && (!directionCode || program.cypherOfTheDirection === directionCode)),
    [data, facultyId, directionCode],
  );

  if (isLoading || !data) {
    return (
      <div className="main-container">
        <div className="p-block-header">
          <h1 className="text-bold">Формирование списка рекомендуемых групп</h1>
        </div>
        {error && <div className="p-block-with-padding" role="alert"><MiniAlert type="error" text={error} /></div>}
        {isLoading ? <div className="p-block-with-padding text" role="status">Загрузка плана тестирований...</div> : <div className={`p-block-with-padding ${styles.start}`}>
          <p className="text">Выполните автоматический подбор групп на текущий и два следующих семестра.</p>
          <Button
            title={action === "auto" ? "Выполняется подбор..." : "Выполнить автоматический подбор"}
            color="btn-blue"
            disabled={busy}
            onClick={() => void handleAutoFill()}
          />
          {error && <Button title="Повторить загрузку" color="btn-blue" disabled={busy} onClick={() => void handleRefresh()} />}
        </div>}
      </div>
    );
  }

  const currentSemester = data.semesters.find(semester => semester.id === data.currentSemesterId);

  return (
    <div className="main-container" aria-busy={busy}>
      <div className="p-block-header">
        <h1 className="text-bold">Формирование списка рекомендуемых групп</h1>
      </div>

      {error && <div className="p-block-with-padding" role="alert"><MiniAlert type="error" text={error} /></div>}
      {notice && <div className="p-block-with-padding" role="status"><MiniAlert type="success" text={notice} /></div>}
      {data.requiresRecalculation && <div className="p-block-with-padding" role="status">
        <MiniAlert type="info" text="История тестирований изменилась. Выполните пересчёт плана." />
        <Button title={action === "auto" ? "Пересчёт..." : "Пересчитать назначения"} color="btn-blue"
          disabled={busy || changedCount > 0} onClick={() => void handleAutoFill()} />
      </div>}
      <div className="p-block-with-padding">
        <p className="text">Текущий семестр: {currentSemester && semesterLabel(currentSemester)}</p>
        <p className="text">
          Автоматические назначения доступны для просмотра.
          Для остальных групп возможность выбора определяется планом.
          Назначайте тестирование на текущий семестр и, по желанию, на следующие.
          На каждый семестр можно выбрать не более одной группы каждого профиля.
          Сохраните ручной выбор, чтобы система пересчитала доступность следующих семестров.
        </p>
        <div className={`${styles.filters} ${styles.filtersWithPeriod}`}>
          <Dropdown
            label="Факультет/институт"
            options={faculties}
            value={facultyId}
            onChange={(value) => {
              setFacultyId(value);
              setDirectionCode("");
            }}
            placeholder="Все факультеты / институты"
          />
          <Dropdown
            label="Направление"
            options={directionOptions}
            value={directionCode}
            onChange={setDirectionCode}
            placeholder="Все направления"
          />
          <StudentListPeriodPicker value={periodSelection ?? data.studentListFormationPeriod ?? null} disabled={editDisabled}
            onChange={period => {
              const stored = data.studentListFormationPeriod;
              setPeriodSelection(stored?.startDate === period.startDate && stored?.endDate === period.endDate ? null : period);
              setNotice(null);
            }} />
        </div>
      </div>

      <div className="p-block-with-padding">
        {programs.length === 0 ? (
          <p className="text">Нет групп для выбранных фильтров</p>
        ) : (
          <GroupsTestingTable programs={programs} semesters={data.semesters} currentSemesterId={data.currentSemesterId}
            renderPlanningCell={(program, group, semester) => {
              const cell = group.plannedTestings.find(item => item.semesterId === semester.id)!;
              const checked = isTestingPlanned(group.groupId, cell, selection);
              const occupiedGroup = getOccupiedGroup(program, semester.id, selection);
              const occupiedElsewhere = occupiedGroup !== null && occupiedGroup !== group.groupId;
              const reason = !cell.editable
                ? cell.restrictionReason ?? "Изменение недоступно"
                : occupiedElsewhere ? "На этот семестр уже выбрана другая группа профиля" : null;
              return (
                <td className={styles.statusCell} title={reason ?? undefined}>
                  {cell.editable ? (
                    <fieldset className={styles.planningChoice} disabled={editDisabled || occupiedElsewhere}>
                      <CheckBox text={`Назначить тестирование: ${group.groupNumber}, ${semesterLabel(semester)}`}
                        type="blue" state={checked} onChange={planned => {
                          setSelection(previous => changeTestingSelection(
                            program, group.groupId, semester.id, planned, previous,
                          ));
                          setNotice(null);
                        }} />
                    </fieldset>
                  ) : (
                    <TestingMark checked={checked}
                      label={`${group.groupNumber}, ${semesterLabel(semester)}: ${checked ? "Тестирование назначено" : "Тестирование не назначено"}. ${reason ?? "Изменение недоступно"}`} />
                  )}
                  {checked && cell.author === "automatic" && <small className={styles.automaticLabel}>Автоподбор</small>}
                  {semester.id === data.currentSemesterId && program.participationDecision
                    && (group.groupId === program.participationDecision.selectedGroupId
                      || group.groupId === program.participationDecision.recommendedGroupId) && (
                    <small className={styles.automaticLabel} title={program.participationDecision.reason ?? undefined}>
                      Кафедра: {group.groupId === program.participationDecision.selectedGroupId ? "участвует" : "не участвует"}
                    </small>
                  )}
                </td>
              );
            }} />
        )}
      </div>

      <div className={`p-block-with-padding ${styles.actions}`}>
        <Button title={action === "save" ? "Сохранение..." : "Сохранить выбор"} color="btn-green"
          disabled={editDisabled || changedCount === 0} onClick={() => void handleSave()} />
        <Button title="Отменить изменения" color="btn-orange" disabled={busy || needsReload || changedCount === 0}
          onClick={() => { setSelection({}); setPeriodSelection(null); setNotice(null); }} />
        <Button title={action === "refresh" ? "Обновление..." : "Обновить список"} color="btn-blue"
          disabled={busy || (changedCount > 0 && !needsReload)} onClick={() => void handleRefresh()} />
        {changedCount > 0 && (
          <span className="text" role="status">Несохранённых изменений: {changedCount}</span>
        )}
      </div>
    </div>
  );
}
