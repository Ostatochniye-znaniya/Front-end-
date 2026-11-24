import { DocumentApiError } from "./documents";
import { parseGroupsTestingResponse, type GroupsTestingResponse } from "./groupsTesting";

export interface HodProfileChoice {
  studyProgramId: number;
  recommendedGroupId: number | null;
  selectedGroupId: number | null;
  reviewed: boolean;
  reason: string | null;
  editable: boolean;
  restrictionReason: string | null;
  eligibleGroupIds: number[];
}

export interface HodGroupsResponse {
  departmentId: number;
  departmentName: string;
  plan: GroupsTestingResponse | null;
  choices: HodProfileChoice[];
}

export interface HodDecision {
  studyProgramId: number;
  selectedGroupId: number | null;
  reason: string;
}

async function request(path: string, init?: RequestInit): Promise<HodGroupsResponse> {
  const response = await fetch(`/csh/api/HodGroups/${path}`, { cache: "no-store", ...init });
  if (!response.ok) {
    let message = `Не удалось загрузить выбор групп (HTTP ${response.status})`;
    try {
      const body = await response.json();
      message = body.error ?? body.detail ?? message;
    } catch { /* Прокси может вернуть текст вместо JSON. */ }
    throw new DocumentApiError(message, response.status);
  }
  const data = await response.json();
  const isId = (value: unknown) => Number.isSafeInteger(value) && Number(value) > 0;
  if (!data || !isId(data.departmentId) || typeof data.departmentName !== "string" || !Array.isArray(data.choices))
    throw new Error("Сервер вернул некорректную таблицу выбора групп");
  const plan = data.plan === null ? null : parseGroupsTestingResponse(data.plan);
  const ids = new Set<number>();
  for (const choice of data.choices) {
    const program = plan?.studyPrograms.find(p => p.studyProgramId === choice?.studyProgramId);
    if (!choice || !program || ids.has(choice.studyProgramId)
      || !(choice.recommendedGroupId === null || program.groups.some(g => g.groupId === choice.recommendedGroupId))
      || !(choice.selectedGroupId === null || program.groups.some(g => g.groupId === choice.selectedGroupId))
      || typeof choice.reviewed !== "boolean" || typeof choice.editable !== "boolean"
      || !(choice.reason === null || typeof choice.reason === "string")
      || !(choice.restrictionReason === null || typeof choice.restrictionReason === "string")
      || !Array.isArray(choice.eligibleGroupIds)
      || choice.eligibleGroupIds.some((id: unknown) => !isId(id) || !program.groups.some(g => g.groupId === id)))
      throw new Error("Сервер вернул некорректные ограничения выбора групп");
    ids.add(choice.studyProgramId);
  }
  if (ids.size !== (plan?.studyPrograms.length ?? 0)) throw new Error("Отсутствуют решения по профилям");
  return { ...data, plan };
}

export function getHodGroups(signal?: AbortSignal): Promise<HodGroupsResponse> {
  return request("GetGroups", { signal });
}

export function saveHodGroups(currentSemesterId: number, version: number, decisions: HodDecision[]): Promise<HodGroupsResponse> {
  return request("UpdateGroups", {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentSemesterId, version, decisions }),
  });
}
