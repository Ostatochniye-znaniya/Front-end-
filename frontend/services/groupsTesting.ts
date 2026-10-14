const API_BASE_URL = "/csh/api";

export type PlanningAuthor = "automatic" | "manual";

export interface TestingSemester {
  id: number;
  semesterYear: number;
  semesterPart: 1 | 2;
  period: "past" | "current" | "future";
}

export interface TestingHistoryCell {
  semesterId: number;
  completed: boolean | null;
}

export interface PlannedTestingCell {
  semesterId: number;
  planned: boolean;
  author: PlanningAuthor | null;
  editable: boolean;
  restrictionReason: string | null;
}

export interface TestingGroup {
  groupId: number;
  groupNumber: string;
  course: number | null;
  testingHistory: TestingHistoryCell[];
  plannedTestings: PlannedTestingCell[];
}

export interface TestingStudyProgram {
  studyProgramId: number;
  studyProgramName: string;
  cypherOfTheDirection: string | null;
  facultyId: number | null;
  facultyName: string | null;
  groups: TestingGroup[];
}

export interface GroupsTestingResponse {
  currentSemesterId: number;
  semesters: TestingSemester[];
  studyPrograms: TestingStudyProgram[];
}

export interface GroupsTestingChange {
  groupId: number;
  semesterId: number;
  planned: boolean;
}

export interface UpdateGroupsTestingRequest {
  currentSemesterId: number;
  changes: GroupsTestingChange[];
}

export interface GroupsTestingFilters {
  facultyId?: number;
  cypherOfTheDirection?: string;
}

type JsonObject = Record<string, unknown>;
const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;
const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

function invalidResponse(): never {
  throw new Error("Сервер вернул некорректные данные плана тестирований");
}

// Проверяем контракт, чтобы отсутствие editable не превращалось в разрешение.
export function parseGroupsTestingResponse(value: unknown): GroupsTestingResponse {
  if (!isObject(value) || !isId(value.currentSemesterId)
    || !Array.isArray(value.semesters) || !Array.isArray(value.studyPrograms)) {
    return invalidResponse();
  }

  const semesterIds = new Set<number>();
  const pastIds = new Set<number>();
  const planningSemesterIds = new Set<number>();
  const futureIds = new Set<number>();

  for (const semester of value.semesters) {
    if (!isObject(semester) || !isId(semester.id) || semesterIds.has(semester.id)
      || !isId(semester.semesterYear)
      || (semester.semesterPart !== 1 && semester.semesterPart !== 2)
      || !["past", "current", "future"].includes(String(semester.period))) {
      return invalidResponse();
    }
    semesterIds.add(semester.id);
    if (semester.period === "past") pastIds.add(semester.id);
    else planningSemesterIds.add(semester.id);
    if (semester.period === "future") futureIds.add(semester.id);
  }

  const current = value.semesters.filter((semester) => semester.period === "current");
  if (current.length !== 1 || current[0].id !== value.currentSemesterId
    || futureIds.size !== 2 || pastIds.size !== 3) return invalidResponse();

  const programIds = new Set<number>();
  const groupIds = new Set<number>();

  for (const program of value.studyPrograms) {
    if (!isObject(program) || !isId(program.studyProgramId)
      || programIds.has(program.studyProgramId)
      || typeof program.studyProgramName !== "string"
      || !isNullableString(program.cypherOfTheDirection)
      || !(program.facultyId === null || isId(program.facultyId))
      || !isNullableString(program.facultyName) || !Array.isArray(program.groups)) {
      return invalidResponse();
    }
    programIds.add(program.studyProgramId);
    const occupiedSemesters = new Set<number>();

    for (const group of program.groups) {
      if (!isObject(group) || !isId(group.groupId) || groupIds.has(group.groupId)
        || typeof group.groupNumber !== "string"
        || !(group.course === null || isId(group.course))
        || !Array.isArray(group.testingHistory) || !Array.isArray(group.plannedTestings)) {
        return invalidResponse();
      }
      groupIds.add(group.groupId);
      const historyIds = new Set<number>();
      for (const cell of group.testingHistory) {
        if (!isObject(cell) || !isId(cell.semesterId)
          || !pastIds.has(cell.semesterId) || historyIds.has(cell.semesterId)
          || !(cell.completed === null || typeof cell.completed === "boolean")) {
          return invalidResponse();
        }
        historyIds.add(cell.semesterId);
      }

      const planningIds = new Set<number>();
      for (const cell of group.plannedTestings) {
        if (!isObject(cell) || !isId(cell.semesterId)
          || !planningSemesterIds.has(cell.semesterId) || planningIds.has(cell.semesterId)
          || typeof cell.planned !== "boolean" || typeof cell.editable !== "boolean"
          || !(cell.author === null || cell.author === "automatic" || cell.author === "manual")
          || !isNullableString(cell.restrictionReason)
          || (cell.planned && cell.author === null)
          || (!cell.planned && cell.author !== null)) return invalidResponse();
        planningIds.add(cell.semesterId);
        if (cell.planned) {
          if (occupiedSemesters.has(cell.semesterId)) return invalidResponse();
          occupiedSemesters.add(cell.semesterId);
        }
      }
      if (planningIds.size !== planningSemesterIds.size) return invalidResponse();
    }
  }

  return value as unknown as GroupsTestingResponse;
}

async function readError(response: Response, fallback: string): Promise<Error> {
  try {
    const body: unknown = await response.json();
    if (isObject(body)) {
      const message = body.error ?? body.detail ?? body.title;
      if (typeof message === "string" && message) return new Error(message);
    }
  } catch {
    // Например, HTML-ответ прокси при недоступном API.
  }
  return new Error(`${fallback} (HTTP ${response.status})`);
}

export async function getGroupsTesting(
  filters: GroupsTestingFilters = {},
  signal?: AbortSignal,
): Promise<GroupsTestingResponse | null> {
  const query = new URLSearchParams();
  if (filters.facultyId !== undefined) query.set("facultyId", String(filters.facultyId));
  if (filters.cypherOfTheDirection) query.set("cypherOfTheDirection", filters.cypherOfTheDirection);
  const suffix = query.size ? `?${query}` : "";
  const response = await fetch(`${API_BASE_URL}/getGroupsTesting${suffix}`, {
    cache: "no-store",
    signal,
  });
  if (response.status === 204) return null;
  if (!response.ok) throw await readError(response, "Не удалось загрузить план тестирований");
  return parseGroupsTestingResponse(await response.json());
}

export async function autoFillPlannedTestings(): Promise<GroupsTestingResponse> {
  const response = await fetch(`${API_BASE_URL}/autoFillPlannedTestings`, {
    method: "POST",
    cache: "no-store",
  });
  if (!response.ok) throw await readError(response, "Не удалось выполнить автоматический подбор");
  return parseGroupsTestingResponse(await response.json());
}

export async function updateGroupsTesting(data: UpdateGroupsTestingRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/updateGroupsTesting`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw await readError(response, "Не удалось сохранить выбранные тестирования");
}
