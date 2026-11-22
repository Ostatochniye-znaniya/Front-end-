"use client";

import { Fragment, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import TestingHistoryHeader, { historySemesterLabel } from "./TestingHistory";
import { getGroupCourse } from "@/services/groupCourse";
import type { TestingGroup, TestingSemester, TestingStudyProgram } from "@/services/groupsTesting";
import styles from "@/app/lpr/list2/page.module.css";

export function TestingMark({ checked, label }: { checked: boolean; label: string }) {
  const Icon = checked ? Check : X;
  return (
    <span className={`${styles.mark} ${checked ? styles.checkedMark : styles.negativeMark}`}
      role="img" title={label} aria-label={label}>
      <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}

interface GroupsTestingTableProps {
  programs: readonly TestingStudyProgram[];
  semesters: readonly TestingSemester[];
  currentSemesterId: number;
  renderPlanningCell: (program: TestingStudyProgram, group: TestingGroup, semester: TestingSemester) => ReactNode;
}

export default function GroupsTestingTable({ programs, semesters, currentSemesterId, renderPlanningCell }: GroupsTestingTableProps) {
  const orderedSemesters = [...semesters].sort(
    (a, b) => a.semesterYear - b.semesterYear || a.semesterPart - b.semesterPart,
  );
  const previousSemesters = orderedSemesters.filter(semester => semester.period === "past");
  const currentSemester = orderedSemesters.find(semester => semester.id === currentSemesterId);
  const futureSemesters = orderedSemesters.filter(semester => semester.period === "future");
  const planningSemesters = orderedSemesters.filter(semester => semester.period !== "past");
  const orderedPrograms = [...programs].sort((a, b) =>
    (a.facultyName ?? "").localeCompare(b.facultyName ?? "", "ru")
    || (a.facultyId ?? 0) - (b.facultyId ?? 0)
    || (a.cypherOfTheDirection ?? "").localeCompare(b.cypherOfTheDirection ?? "")
    || a.studyProgramName.localeCompare(b.studyProgramName, "ru"));
  const directions = new Map<string, TestingStudyProgram[]>();
  for (const program of orderedPrograms) {
    const key = `${program.facultyId ?? "none"}:${program.cypherOfTheDirection ?? "none"}`;
    const directionPrograms = directions.get(key) ?? [];
    directionPrograms.push(program);
    directions.set(key, directionPrograms);
  }

  return (
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
              {currentSemester ? historySemesterLabel(currentSemester) : "Текущий семестр"}
            </th>
            {futureSemesters.map(semester => (
              <th scope="col" className={styles.semesterHeading} key={semester.id}>{historySemesterLabel(semester)}</th>
            ))}
          </tr>
        </thead>
        {[...directions].map(([key, directionPrograms]) => (
          <tbody key={key}>
            <tr className={styles.directionRow}>
              <th scope="rowgroup" colSpan={4 + planningSemesters.length}>
                <strong>{directionPrograms[0].cypherOfTheDirection ?? "Без шифра"}</strong>{" "}
                <span>{directionPrograms[0].facultyName ?? "Факультет не указан"}</span>
              </th>
            </tr>
            {directionPrograms.flatMap(program => program.groups.map((group, groupIndex) => (
              <tr key={group.groupId}>
                {groupIndex === 0 && (
                  <td rowSpan={program.groups.length} className={styles.groupingCell}>{program.studyProgramName}</td>
                )}
                <td>{group.groupNumber}{group.isActive === false && <small className={styles.automaticLabel}>В архиве</small>}</td>
                <td>{currentSemester ? getGroupCourse(group.groupNumber, currentSemester) ?? "—" : "—"}</td>
                <td className={styles.historyCell}>
                  <div className={styles.historyViewport}>
                    <div className={`${styles.historyStrip} ${styles.historyValues}`}>
                      {previousSemesters.map(semester => {
                        const completed = group.testingHistory.find(cell => cell.semesterId === semester.id)?.completed;
                        const label = completed === true ? "Тестирование завершено"
                          : completed === false ? "Тестирование не завершено" : "Нет данных";
                        return (
                          <span className={styles.historySemester} key={semester.id}>
                            <TestingMark checked={completed === true}
                              label={`${group.groupNumber}, ${historySemesterLabel(semester)}: ${label}`} />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </td>
                {planningSemesters.map(semester => (
                  <Fragment key={semester.id}>{renderPlanningCell(program, group, semester)}</Fragment>
                ))}
              </tr>
            )))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
