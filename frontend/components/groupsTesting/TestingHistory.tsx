"use client";

import { useEffect, useRef } from "react";
import type { TestingSemester } from "@/services/groupsTesting";
import styles from "@/app/lpr/list2/page.module.css";

export function historySemesterLabel(semester: TestingSemester): string {
  return `${semester.semesterPart === 1 ? "Весна" : "Осень"} ${semester.semesterYear}`;
}

// Один скроллер управляет заголовками и всеми строками только области истории.
export default function TestingHistoryHeader({ semesters }: { semesters: readonly TestingSemester[] }) {
  const scroll = useRef<HTMLDivElement>(null);
  const firstId = semesters[0]?.id;
  const lastId = semesters.at(-1)?.id;
  const synchronize = () => {
    const element = scroll.current;
    element?.closest("table")?.style.setProperty("--history-offset", `${element.scrollLeft}px`);
  };
  useEffect(() => {
    const element = scroll.current;
    if (!element) return;
    // При открытии видны три последних семестра; более ранние находятся слева.
    element.scrollLeft = element.scrollWidth - element.clientWidth;
    synchronize();
  }, [firstId, lastId]);
  return (
    <th scope="col" rowSpan={2} className={styles.historyColumn}>
      <div className={styles.historyTitle}>Предыдущие тестирования</div>
      <div ref={scroll} className={styles.historyScroll} onScroll={synchronize}
        role="region" tabIndex={0} aria-label="История восьми семестров: прокрутите влево для более ранних тестирований">
        <div className={styles.historyStrip}>
          {semesters.map((semester) => <span className={styles.historySemester} key={semester.id}>
            {historySemesterLabel(semester)}
          </span>)}
        </div>
      </div>
    </th>
  );
}
