const API_BASE_URL = "/csh/api/TeacherWorkflow";
export const MAX_DOCX_SIZE_MB = 20;

export interface TeacherTesting {
  testingId: number;
  reportId: number | null;
  groupName: string;
  disciplineName: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  scheduledPair: number | null;
  selectionPeriodStart: string | null;
  selectionPeriodEnd: string | null;
  isInPerson: boolean | null;
  room: string | null;
  lmsUrl: string | null;
  approvalStatus: string;
  comment: string | null;
  respondedAt: string | null;
}

export interface TeacherReportTask {
  reportId: number | null;
  groupId: number;
  semesterId: number;
  disciplineId: number;
  groupName: string;
  disciplineName: string;
  fileName: string | null;
  status: string;
  statusLabel: string;
  reviewComment: string | null;
  uploadedAt: string | null;
  paperStatus: "not_required" | "pending" | "submitted";
  paperStatusLabel: string;
  doneInPaperForm: boolean | null;
  doneInElectronicForm: boolean | null;
  allDone: boolean | null;
}

export interface TeacherStageDeadlines {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  preparationStartDate: string;
  preparationEndDate: string;
  testingStartDate: string;
  testingEndDate: string;
  surveyStartDate: string;
  surveyEndDate: string;
  resultsProcessingStartDate: string;
  inspectionSummaryDeadline: string;
  surveySummaryDeadline: string;
  paperReportDeadline: string;
  electronicReportDeadline: string;
}

export interface TestingDelivery {
  isInPerson: boolean;
  room: string | null;
  lmsUrl: string | null;
}

export type UploadProgressHandler = (percent: number) => void;

export class TeacherWorkflowApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "TeacherWorkflowApiError";
  }
}

export function validateDocxFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".docx")) return "Можно загрузить только DOCX-файл";
  if (file.size === 0) return "Файл пустой";
  if (file.size > MAX_DOCX_SIZE_MB * 1024 * 1024) {
    return `Файл больше ${MAX_DOCX_SIZE_MB} МБ`;
  }
  return null;
}

async function readError(response: Response, fallback: string): Promise<TeacherWorkflowApiError> {
  const text = await response.text();
  try {
    const body: unknown = JSON.parse(text);
    if (body && typeof body === "object" && "error" in body &&
        typeof body.error === "string" && body.error) {
      return new TeacherWorkflowApiError(body.error, response.status);
    }
    if (body && typeof body === "object" && "title" in body &&
        typeof body.title === "string" && body.title) {
      return new TeacherWorkflowApiError(body.title, response.status);
    }
  } catch {
    // The API may return a plain-text error.
  }
  return new TeacherWorkflowApiError(`${fallback} (HTTP ${response.status})`, response.status);
}

async function requestJson<T>(
  path: string,
  fallback: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) throw await readError(response, fallback);
  return response.json() as Promise<T>;
}

export function getTeacherTestings(signal?: AbortSignal): Promise<TeacherTesting[]> {
  return requestJson("/GetTestings", "Не удалось загрузить назначения", { signal });
}

export function getTeacherStageDeadlines(signal?: AbortSignal): Promise<TeacherStageDeadlines | null> {
  return requestJson("/GetStageDeadlines", "Не удалось загрузить сроки этапов", { signal });
}

export function saveTestingDelivery(
  testingId: number,
  delivery: TestingDelivery,
): Promise<TeacherTesting> {
  return requestJson(`/UpdateTestingDelivery/${testingId}/delivery`, "Не удалось сохранить формат проведения", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(delivery),
  });
}

export async function validateTestingSchedule(
  testingId: number,
  date: string,
  pairNumber: number,
  delivery: TestingDelivery,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/ValidateTestingSchedule/${testingId}/availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, pairNumber, ...delivery }),
  });
  if (!response.ok) {
    throw await readError(response, "Это время или место проведения уже занято");
  }
}

export function approveTesting(testingId: number): Promise<TeacherTesting> {
  return requestJson(`/ApproveTesting/${testingId}/approve`, "Не удалось согласовать назначение", {
    method: "POST",
  });
}

export function rejectTesting(testingId: number, comment: string): Promise<TeacherTesting> {
  return requestJson(`/RejectTesting/${testingId}/reject`, "Не удалось отклонить назначение", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
}

export function saveTestingTime(
  testing: TeacherTesting,
  date: string,
  pairNumber: number,
): Promise<TeacherTesting> {
  const action = testing.approvalStatus === "approved"
    ? `UpdateTestingTime/${testing.testingId}/change-time`
    : `ChooseTestingTime/${testing.testingId}/choose-time`;
  return requestJson(`/${action}`, "Не удалось сохранить дату и время", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, pairNumber }),
  });
}

export function getTeacherReports(signal?: AbortSignal): Promise<TeacherReportTask[]> {
  return requestJson("/GetReports", "Не удалось загрузить отчёты", { signal });
}

function getFilename(response: Response, fallback: string): string {
  const header = response.headers.get("Content-Disposition");
  const encoded = header?.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      return fallback;
    }
  }
  return header?.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback;
}

async function downloadDocx(url: string, fallback: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw await readError(response, "Не удалось скачать шаблон отчёта");

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = getFilename(response, fallback);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function downloadBlankTeacherReportTemplate(): Promise<void> {
  return downloadDocx(
    `${API_BASE_URL}/GenerateBlankReportTemplate`,
    "Шаблон_отчёта.docx",
  );
}

export function downloadTeacherReportTemplate(task: TeacherReportTask): Promise<void> {
  const query = new URLSearchParams({
    groupId: String(task.groupId),
    semesterId: String(task.semesterId),
    disciplineId: String(task.disciplineId),
  });
  return downloadDocx(
    `${API_BASE_URL}/GenerateReport?${query}`,
    `Отчёт_${task.groupName}_${task.disciplineName}.docx`,
  );
}

export function uploadTeacherReport(
  reportId: number,
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<void> {
  const form = new FormData();
  form.append("file", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/UploadReport/${reportId}/upload`);
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      const response = new Response(xhr.responseText, { status: xhr.status });
      void readError(response, "Не удалось загрузить DOCX").then(reject);
    };
    xhr.onerror = () => reject(new TeacherWorkflowApiError("Сеть недоступна, файл не отправлен", 0));
    xhr.onabort = () => reject(new TeacherWorkflowApiError("Загрузка отменена", 0));
    xhr.send(form);
  });
}
