"use client";

import Button from "@/components/button/Button";
import MiniAlert from "@/components/alert/MiniAlert";
import CheckBox from "@/components/checkbox/CheckBox";
import Dropdown from "@/components/dropdown/Dropdown";
import TestingHistoryHeader from "@/components/groupsTesting/TestingHistory";
import { getGroupCourse } from "@/services/groupCourse";
import { Check, X } from "lucide-react";
import {
  autoFillPlannedTestings,
  getGroupsTesting,
  updateGroupsTesting,
  type GroupsTestingResponse,
  type TestingGroup,
  type TestingSemester,
  type TestingStudyProgram,
} from "@/services/groupsTesting";
import {
  changeTestingSelection,
  getOccupiedGroup,
  isTestingPlanned,
  type TestingSelection,
} from "@/services/groupTestingSelection";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

function semesterLabel(semester: TestingSemester): string {
  return `${semester.semesterPart === 1 ? "Весна" : "Осень"} ${semester.semesterYear}`;
}

function TestingMark({ checked, label }: { checked: boolean; label: string }) {
  const Icon = checked ? Check : X;
  return (
    <span className={`${styles.mark} ${checked ? styles.checkedMark : styles.negativeMark}`}
      role="img" title={label} aria-label={label}>
      <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}

function HistoryMark({ group, semester }: {
  group: TestingGroup;
  semester: TestingSemester;
}) {
  const completed = group.testingHistory.find(
    (cell) => cell.semesterId === semester.id,
  )?.completed;
  const label = completed === true
    ? "Тестирование завершено"
    : completed === false
      ? "Тестирование не завершено"
      : "Нет данных";
  return (
    <TestingMark checked={completed === true}
      label={`${group.groupNumber}, ${semesterLabel(semester)}: ${label}`} />
  );
}

export default function LprRecommendedGroupsPage() {
  const [data, setData] = useState<GroupsTestingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [action, setAction] = useState<"auto" | "save" | "refresh" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [needsReload, setNeedsReload] = useState(false);
  const [selection, setSelection] = useState<TestingSelection>({});
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

  const changedCount = Object.keys(selection).length;
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
      });
      setData(response);
      setSelection({});
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
        && (!directionCode || program.cypherOfTheDirection === directionCode))
      .sort((a, b) =>
        (a.facultyName ?? "").localeCompare(b.facultyName ?? "", "ru")
        || (a.facultyId ?? 0) - (b.facultyId ?? 0)
        || (a.cypherOfTheDirection ?? "").localeCompare(b.cypherOfTheDirection ?? "")
        || a.studyProgramName.localeCompare(b.studyProgramName, "ru")),
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

  const semesters = [...data.semesters].sort(
    (a, b) => a.semesterYear - b.semesterYear || a.semesterPart - b.semesterPart,
  );
  const previousSemesters = semesters.filter((semester) => semester.period === "past");
  const currentSemester = semesters.find((semester) => semester.id === data.currentSemesterId);
  const futureSemesters = semesters.filter((semester) => semester.period === "future");
  const planningSemesters = semesters.filter((semester) => semester.period !== "past");

  const directionKey = (program: TestingStudyProgram): string =>
    `${program.facultyId ?? "none"}:${program.cypherOfTheDirection ?? "none"}`;

  const directions = new Map<string, TestingStudyProgram[]>();
  for (const program of programs) {
    const key = directionKey(program);
    const directionPrograms = directions.get(key) ?? [];
    directionPrograms.push(program);
    directions.set(key, directionPrograms);
  }
  const tableColumnCount = 4 + planningSemesters.length;

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
        <div className={styles.filters}>
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
        </div>
      </div>

      <div className="p-block-with-padding">
        {programs.length === 0 ? (
          <p className="text">Нет групп для выбранных фильтров</p>
        ) : (
          <div className={`table-wrapper ${styles.tableWrapper}`}>
            <table className={`table-container ${styles.table}`}>
              <caption className={styles.caption}>План тестирований по направлениям и профилям</caption>
              <thead>
                <tr>
                  <th scope="col" rowSpan={2}>Профиль</th>
                  <th scope="col" rowSpan={2}>Группа</th>
                  <th scope="col" rowSpan={2}>Курс</th>
                  <TestingHistoryHeader semesters={previousSemesters} />
                  <th scope="colgroup" className={styles.testingHeading} colSpan={1}>Текущее тестирование</th>
                  <th scope="colgroup" className={styles.testingHeading} colSpan={futureSemesters.length}>Запланировать тестирование</th>
                </tr>
                <tr>
                  <th scope="col" className={styles.semesterHeading}>
                    {currentSemester ? semesterLabel(currentSemester) : "Текущий семестр"}
                  </th>
                  {futureSemesters.map((semester) => (
                    <th scope="col" className={styles.semesterHeading} key={semester.id}>{semesterLabel(semester)}</th>
                  ))}
                </tr>
              </thead>
              {[...directions].map(([key, directionPrograms]) => (
                <tbody key={key}>
                  <tr className={styles.directionRow}>
                    <th scope="rowgroup" colSpan={tableColumnCount}>
                      <strong>{directionPrograms[0].cypherOfTheDirection ?? "Без шифра"}</strong>{" "}
                      <span>{directionPrograms[0].facultyName ?? "Факультет не указан"}</span>
                    </th>
                  </tr>
                  {directionPrograms.flatMap((program) => program.groups.map((group, groupIndex) => (
                    <tr key={group.groupId}>
                      {groupIndex === 0 && (
                        <td rowSpan={program.groups.length} className={styles.groupingCell}>
                          {program.studyProgramName}
                        </td>
                      )}
                      <td>{group.groupNumber}</td>
                      <td>{currentSemester ? getGroupCourse(group.groupNumber, currentSemester) ?? "—" : "—"}</td>
                      <td className={styles.historyCell}>
                        <div className={styles.historyViewport}>
                          <div className={`${styles.historyStrip} ${styles.historyValues}`}>
                            {previousSemesters.map((semester) => (
                              <span className={styles.historySemester} key={semester.id}>
                                <HistoryMark group={group} semester={semester} />
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      {planningSemesters.map((semester) => {
                        const cell = group.plannedTestings.find((item) => item.semesterId === semester.id)!;
                        const checked = isTestingPlanned(group.groupId, cell, selection);
                        const occupiedGroup = getOccupiedGroup(program, semester.id, selection);
                        const occupiedElsewhere = occupiedGroup !== null && occupiedGroup !== group.groupId;
                        const reason = !cell.editable
                          ? cell.restrictionReason ?? "Изменение недоступно"
                          : occupiedElsewhere
                            ? "На этот семестр уже выбрана другая группа профиля"
                            : null;
                        return (
                          <td key={semester.id} className={styles.statusCell} title={reason ?? undefined}>
                            {cell.editable ? (
                              <fieldset className={styles.planningChoice}
                                disabled={editDisabled || occupiedElsewhere}>
                                <CheckBox
                                  text={`Назначить тестирование: ${group.groupNumber}, ${semesterLabel(semester)}`}
                                  type="blue"
                                  state={checked}
                                  onChange={(planned) => {
                                    setSelection((previous) => changeTestingSelection(
                                      program, group.groupId, semester.id, planned, previous,
                                    ));
                                    setNotice(null);
                                  }}
                                />
                              </fieldset>
                            ) : (
                              <TestingMark checked={checked}
                                label={`${group.groupNumber}, ${semesterLabel(semester)}: ${
                                  checked ? "Тестирование назначено" : "Тестирование не назначено"
                                }. ${reason ?? "Изменение недоступно"}`} />
                            )}
                            {checked && cell.author === "automatic" && (
                              <small className={styles.automaticLabel}>Автоподбор</small>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )))}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </div>

      <div className={`p-block-with-padding ${styles.actions}`}>
        <Button title={action === "save" ? "Сохранение..." : "Сохранить выбор"} color="btn-green"
          disabled={editDisabled || changedCount === 0} onClick={() => void handleSave()} />
        <Button title="Отменить изменения" color="btn-orange" disabled={busy || needsReload || changedCount === 0}
          onClick={() => { setSelection({}); setNotice(null); }} />
        <Button title={action === "refresh" ? "Обновление..." : "Обновить список"} color="btn-blue"
          disabled={busy || (changedCount > 0 && !needsReload)} onClick={() => void handleRefresh()} />
        {changedCount > 0 && (
          <span className="text" role="status">Несохранённых изменений: {changedCount}</span>
        )}
      </div>
    </div>
  );
}
