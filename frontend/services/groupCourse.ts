import type { TestingSemester } from "./groupsTesting";

// Курс меняется с началом учебного года, а не первого января.
export function getGroupCourse(groupNumber: string, semester: Pick<TestingSemester, "semesterYear" | "semesterPart">): number | null {
  const match = /^(\d{2})\d-\d{3}$/.exec(groupNumber.trim());
  if (!match) return null;
  const admissionYear = 2000 + Number(match[1]);
  const academicYearStart = semester.semesterYear - (semester.semesterPart === 1 ? 1 : 0);
  const course = academicYearStart - admissionYear + 1;
  return course > 0 ? course : null;
}
