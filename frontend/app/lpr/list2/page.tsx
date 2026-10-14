"use client";

import Button from "@/components/button/Button";
import CheckBox from "@/components/checkbox/CheckBox";
import Dropdown from "@/components/dropdown/Dropdown";
import { Check, X } from "lucide-react";
import type {
  GroupsTestingResponse,
  PlannedTestingCell,
  TestingGroup,
  TestingSemester,
  TestingStudyProgram,
} from "@/services/groupsTesting";
import {
  changeTestingSelection,
  getOccupiedGroup,
  isTestingPlanned,
  type TestingSelection,
} from "@/services/groupTestingSelection";
import { useMemo, useState } from "react";
import styles from "./page.module.css";

// Только статические данные для вёрстки. Они не отправляются в API.
const unassignedTestings: PlannedTestingCell[] = [
  { semesterId: 8, planned: false, author: null, editable: true, restrictionReason: null },
  { semesterId: 15, planned: false, author: null, editable: true, restrictionReason: null },
  { semesterId: 31, planned: false, author: null, editable: true, restrictionReason: null },
];

const STATIC_PLAN: GroupsTestingResponse = {
  currentSemesterId: 8,
  semesters: [
    { id: 2, semesterYear: 2025, semesterPart: 1, period: "past" },
    { id: 4, semesterYear: 2025, semesterPart: 2, period: "past" },
    { id: 5, semesterYear: 2026, semesterPart: 1, period: "past" },
    { id: 8, semesterYear: 2026, semesterPart: 2, period: "current" },
    { id: 15, semesterYear: 2027, semesterPart: 1, period: "future" },
    { id: 31, semesterYear: 2027, semesterPart: 2, period: "future" },
  ],
  studyPrograms: [
    {
      studyProgramId: 7,
      studyProgramName: "Разработка и интеграция корпоративных информационных систем",
      cypherOfTheDirection: "09.03.03",
      facultyId: 1,
      facultyName: "Факультет информационных технологий",
      groups: [
        {
          groupId: 12, groupNumber: "241-111", course: 3,
          testingHistory: [
            { semesterId: 2, completed: true },
            { semesterId: 4, completed: false },
            { semesterId: 5, completed: true },
          ],
          plannedTestings: [
            { semesterId: 8, planned: true, author: "automatic", editable: false, restrictionReason: "Назначено автоматическим подбором" },
            { semesterId: 15, planned: true, author: "automatic", editable: false, restrictionReason: "Назначено автоматическим подбором" },
            { semesterId: 31, planned: true, author: "automatic", editable: false, restrictionReason: "Назначено автоматическим подбором" },
          ],
        },
        { groupId: 13, groupNumber: "261-111", course: 1, testingHistory: [], plannedTestings: unassignedTestings },
        { groupId: 14, groupNumber: "261-112", course: 1, testingHistory: [], plannedTestings: unassignedTestings },
      ],
    },
    {
      studyProgramId: 9,
      studyProgramName: "Прикладная информатика в анализе данных",
      cypherOfTheDirection: "09.03.03",
      facultyId: 1,
      facultyName: "Факультет информационных технологий",
      groups: [
        { groupId: 21, groupNumber: "261-121", course: 1, testingHistory: [], plannedTestings: unassignedTestings },
        { groupId: 22, groupNumber: "261-122", course: 1, testingHistory: [], plannedTestings: unassignedTestings },
        { groupId: 23, groupNumber: "261-123", course: 1, testingHistory: [], plannedTestings: unassignedTestings },
      ],
    },
    {
      studyProgramId: 20,
      studyProgramName: "Финансовый анализ и управление",
      cypherOfTheDirection: "38.03.01",
      facultyId: 2,
      facultyName: "Институт экономики и управления",
      groups: [
        {
          groupId: 31, groupNumber: "261-311", course: 1, testingHistory: [],
          plannedTestings: [
            unassignedTestings[0],
            { semesterId: 15, planned: true, author: "manual", editable: true, restrictionReason: null },
            unassignedTestings[2],
          ],
        },
        { groupId: 32, groupNumber: "261-312", course: 1, testingHistory: [], plannedTestings: unassignedTestings },
      ],
    },
  ],
};

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
  const data = STATIC_PLAN;
  const [hasPlan, setHasPlan] = useState(false);
  const [selection, setSelection] = useState<TestingSelection>({});
  const [facultyId, setFacultyId] = useState("");
  const [directionCode, setDirectionCode] = useState("");

  const changedCount = Object.keys(selection).length;

  const faculties = useMemo(() => {
    const options = new Map<string, string>();
    for (const program of data.studyPrograms) {
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
    for (const program of data.studyPrograms) {
      if ((!facultyId || String(program.facultyId) === facultyId)
        && program.cypherOfTheDirection) codes.add(program.cypherOfTheDirection);
    }
    return [
      { value: "", label: "Все направления" },
      ...[...codes].sort().map((code) => ({ value: code, label: code })),
    ];
  }, [data, facultyId]);

  const programs = useMemo(
    () => data.studyPrograms
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

  // После подключения API открывать план только после успешного autoFillPlannedTestings.
  if (!hasPlan) {
    return (
      <div className="main-container">
        <div className="p-block-header">
          <h1 className="text-bold">Формирование списка рекомендуемых групп</h1>
        </div>
        <div className={`p-block-with-padding ${styles.start}`}>
          <p className="text">Выполните автоматический подбор групп на текущий и два следующих семестра.</p>
          <Button
            title="Выполнить автоматический подбор"
            color="btn-blue"
            onClick={() => setHasPlan(true)}
          />
        </div>
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

  const directionRowCounts = new Map<string, number>();
  for (const program of programs) {
    const key = directionKey(program);
    directionRowCounts.set(key, (directionRowCounts.get(key) ?? 0) + program.groups.length);
  }

  return (
    <div className="main-container">
      <div className="p-block-header">
        <h1 className="text-bold">Формирование списка рекомендуемых групп</h1>
      </div>

      <div className="p-block-with-padding">
        <p className="text">Текущий семестр: {currentSemester && semesterLabel(currentSemester)}</p>
        <p className="text">
          Автоматические назначения доступны для просмотра.
          Для остальных групп возможность выбора определяется планом.
          Назначайте тестирование на текущий семестр и, по желанию, на следующие.
          На каждый семестр можно выбрать не более одной группы каждого профиля.
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
                  <th scope="col" rowSpan={2}>Направление</th>
                  <th scope="col" rowSpan={2}>Профиль</th>
                  <th scope="col" rowSpan={2}>Группа</th>
                  <th scope="col" rowSpan={2}>Курс</th>
                  {previousSemesters.length > 0 ? (
                    <th scope="colgroup" colSpan={previousSemesters.length}>Предыдущие тестирования</th>
                  ) : (
                    <th scope="col" rowSpan={2}>Предыдущие тестирования</th>
                  )}
                  <th scope="colgroup" colSpan={1}>Текущее тестирование</th>
                  <th scope="colgroup" colSpan={futureSemesters.length}>Запланировать тестирование</th>
                </tr>
                <tr>
                  {previousSemesters.map((semester) => (
                    <th scope="col" className={styles.semesterHeading} key={semester.id}>{semesterLabel(semester)}</th>
                  ))}
                  <th scope="col" className={styles.semesterHeading}>
                    {currentSemester ? semesterLabel(currentSemester) : "Текущий семестр"}
                  </th>
                  {futureSemesters.map((semester) => (
                    <th scope="col" className={styles.semesterHeading} key={semester.id}>{semesterLabel(semester)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {programs.flatMap((program, programIndex) => {
                  const key = directionKey(program);
                  const firstInDirection = programIndex === 0
                    || directionKey(programs[programIndex - 1]) !== key;
                  return program.groups.map((group, groupIndex) => (
                    <tr key={group.groupId}>
                      {firstInDirection && groupIndex === 0 && (
                        <td rowSpan={directionRowCounts.get(key)} className={styles.groupingCell}>
                          <strong>{program.cypherOfTheDirection ?? "Без шифра"}</strong>
                          <small>{program.facultyName ?? "Факультет не указан"}</small>
                        </td>
                      )}
                      {groupIndex === 0 && (
                        <td rowSpan={program.groups.length} className={styles.groupingCell}>
                          {program.studyProgramName}
                        </td>
                      )}
                      <td>{group.groupNumber}</td>
                      <td>{group.course ?? "—"}</td>
                      {previousSemesters.length === 0 ? (
                        <td>Нет предыдущих семестров</td>
                      ) : previousSemesters.map((semester) => (
                        <td className={styles.statusCell} key={semester.id}>
                          <HistoryMark group={group} semester={semester} />
                        </td>
                      ))}
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
                                disabled={occupiedElsewhere}>
                                <CheckBox
                                  text={`Назначить тестирование: ${group.groupNumber}, ${semesterLabel(semester)}`}
                                  type="blue"
                                  state={checked}
                                  onChange={(planned) => {
                                    setSelection((previous) => changeTestingSelection(
                                      program, group.groupId, semester.id, planned, previous,
                                    ));
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
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={`p-block-with-padding ${styles.actions}`}>
        <button type="button" className="btn btn-green" disabled
          title="Сохранение будет доступно после подключения API">
          Сохранить выбор
        </button>
        <Button
          title="Отменить изменения"
          color="btn-orange"
          disabled={changedCount === 0}
          onClick={() => setSelection({})}
        />
        <button type="button" className="btn btn-blue" disabled
          title="Обновление будет доступно после подключения API">
          Обновить список
        </button>
        {changedCount > 0 && (
          <span className="text" role="status">Несохранённых изменений: {changedCount}</span>
        )}
      </div>
    </div>
  );
}
