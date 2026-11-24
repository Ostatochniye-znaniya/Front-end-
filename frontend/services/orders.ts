const API_BASE_URL = "/csh/api";

export type OrderStatus = "draft" | "issued";

export interface CreateOrderRequest {
  orderDate: string;
  semesterId: number;
  status: OrderStatus;
  testingStartDate: string;
  testingEndDate: string;
  educationControlDepartmentHead: string;
  educationalMethodicalCenterHead: string;
  inspectionSummaryDeadline: string;
  surveySummaryDeadline: string;
  requiresPaperReports: boolean;
  paperReportDeadline: string | null;
  electronicReportDeadline: string;
  preparationStartDate: string;
  preparationEndDate: string;
  testingStageStartDate: string;
  testingStageEndDate: string;
  resultsProcessingStartDate: string;
  surveyStartDate: string;
  surveyEndDate: string;
  onlineSeminarDate: string;
}

export interface OrderSemester {
  id: number;
  semesterYear: number;
  semesterPart: 1 | 2;
}

export interface OrderEssentials {
  id: number;
  number: string | null;
  name: string;
  status: OrderStatus;
  orderDate: string;
  testingStartDate: string;
  testingEndDate: string;
  semester: OrderSemester;
}

export interface OrderDetails extends OrderEssentials {
  educationControlDepartmentHead: string;
  educationalMethodicalCenterHead: string;
  inspectionSummaryDeadline: string;
  surveySummaryDeadline: string;
  requiresPaperReports: boolean;
  paperReportDeadline: string | null;
  electronicReportDeadline: string;
  preparationStartDate: string | null;
  preparationEndDate: string | null;
  testingStageStartDate: string | null;
  testingStageEndDate: string | null;
  resultsProcessingStartDate: string | null;
  surveyStartDate: string | null;
  surveyEndDate: string | null;
  onlineSeminarDate: string | null;
  fileSize: number;
  createdAt: string;
  createdByUserId: number | null;
  createdByName: string | null;
}

export function formatOrderDate(value: string | null): string {
  return value === null ? "Не указано" : value.split("-").reverse().join(".");
}

export function formatOrderStatus(status: OrderStatus): string {
  return status === "draft" ? "Черновик" : "Приказ";
}

export function formatOrderAcademicYear(semester: OrderSemester): string {
  const start = semester.semesterPart === 1 ? semester.semesterYear - 1 : semester.semesterYear;
  return `${start}/${start + 1}`;
}

export function formatOrderSemester(semester: OrderSemester): string {
  return `${semester.semesterPart === 1 ? "Весенний" : "Осенний"} ${semester.semesterYear}`;
}

type JsonObject = Record<string, unknown>;
const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

function isSemester(value: unknown): value is OrderSemester {
  return isObject(value) && isId(value.id) && isId(value.semesterYear)
    && value.semesterYear <= 9999 && (value.semesterPart === 1 || value.semesterPart === 2);
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return value === "draft" || value === "issued";
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isOrder(value: unknown): value is OrderEssentials {
  return isObject(value) && isId(value.id) && (value.status === "draft" ? value.number === null : typeof value.number === "string" && value.number.length > 0)
    && typeof value.name === "string"
    && isOrderStatus(value.status) && isCalendarDate(value.orderDate)
    && isCalendarDate(value.testingStartDate) && isCalendarDate(value.testingEndDate)
    && value.testingEndDate >= value.testingStartDate && isSemester(value.semester);
}

function isOrderDetails(value: unknown): value is OrderDetails {
  return isObject(value) && isOrder(value)
    && typeof value.educationControlDepartmentHead === "string" && typeof value.educationalMethodicalCenterHead === "string"
    && isCalendarDate(value.inspectionSummaryDeadline) && isCalendarDate(value.surveySummaryDeadline)
    && typeof value.requiresPaperReports === "boolean"
    && (value.requiresPaperReports ? isCalendarDate(value.paperReportDeadline) : value.paperReportDeadline === null)
    && isCalendarDate(value.electronicReportDeadline)
    && (value.preparationStartDate === null || isCalendarDate(value.preparationStartDate)) && (value.preparationEndDate === null || isCalendarDate(value.preparationEndDate))
    && (value.resultsProcessingStartDate === null || isCalendarDate(value.resultsProcessingStartDate))
    && (value.surveyStartDate === null || isCalendarDate(value.surveyStartDate)) && (value.surveyEndDate === null || isCalendarDate(value.surveyEndDate))
    && (value.testingStageStartDate === null || isCalendarDate(value.testingStageStartDate))
    && (value.testingStageEndDate === null || isCalendarDate(value.testingStageEndDate))
    && (value.onlineSeminarDate === null || isCalendarDate(value.onlineSeminarDate))
    && typeof value.fileSize === "number" && Number.isSafeInteger(value.fileSize) && value.fileSize >= 0
    && typeof value.createdAt === "string" && !Number.isNaN(Date.parse(value.createdAt))
    && (value.createdByUserId === null || isId(value.createdByUserId))
    && (value.createdByName === null || typeof value.createdByName === "string");
}

export function getOrderDownloadName(number: string | null, contentType: string): string {
  const extensions: Record<string, string> = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/msword": ".doc",
    "application/rtf": ".rtf",
    "text/rtf": ".rtf",
    "application/zip": ".zip",
  };
  const safeNumber = (number ?? "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim();
  const mime = contentType.split(";")[0].trim().toLowerCase();
  return `Приказ-${safeNumber || "без-номера"}${extensions[mime] ?? ""}`;
}

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (typeof body === "object" && body !== null) {
      const error = "error" in body ? body.error : undefined;
      const detail = "detail" in body ? body.detail : undefined;
      const title = "title" in body ? body.title : undefined;

      if (typeof error === "string" && error) return error;
      if (typeof detail === "string" && detail) return detail;
      if (typeof title === "string" && title) return title;
    }
  } catch {
  }

  return `${fallback} (HTTP ${response.status})`;
}

export async function createOrder(data: CreateOrderRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/createOrder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Не удалось сформировать приказ"),
    );
  }
}

export async function getOrderSemesters(signal?: AbortSignal): Promise<OrderSemester[]> {
  const response = await fetch(`${API_BASE_URL}/Semester/GetSemesters`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Не удалось загрузить список семестров"));
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isSemester)
    || new Set(data.map((semester) => semester.id)).size !== data.length) {
    throw new Error("Сервер вернул некорректный справочник семестров");
  }
  return data.sort((a, b) => b.semesterYear - a.semesterYear || b.semesterPart - a.semesterPart);
}

export async function getOrders(signal?: AbortSignal, status?: OrderStatus): Promise<OrderEssentials[]> {
  if (status !== undefined && !isOrderStatus(status)) throw new Error("Некорректный статус приказа");
  const query = status ? `?status=${status}` : "";
  const response = await fetch(`${API_BASE_URL}/getOrdersEssentials${query}`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Не удалось получить приказы"),
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data) || !data.every(isOrder)
    || (status && data.some((order) => order.status !== status))
    || new Set(data.map((order) => order.id)).size !== data.length) {
    throw new Error("Сервер вернул некорректный список приказов");
  }

  return data as OrderEssentials[];
}

export async function getOrderDetails(id: number, signal?: AbortSignal): Promise<OrderDetails> {
  if (!isId(id)) throw new Error("Некорректный идентификатор приказа");
  const response = await fetch(`${API_BASE_URL}/getOrderDetails/${id}`, { cache: "no-store", signal });
  if (!response.ok) throw new Error(await getErrorMessage(response, "Не удалось загрузить реквизиты приказа"));
  const data: unknown = await response.json();
  if (!isOrderDetails(data) || data.id !== id) {
    throw new Error("Сервер вернул некорректные реквизиты приказа");
  }
  return data;
}

export async function getOrderFile(id: number, signal?: AbortSignal): Promise<Blob> {
  if (!isId(id)) throw new Error("Некорректный идентификатор приказа");
  const response = await fetch(
    `${API_BASE_URL}/getOrder/${encodeURIComponent(id)}`,
    { cache: "no-store", signal },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Не удалось получить файл приказа"),
    );
  }

  const file = await response.blob();
  if (file.type.split(";")[0].trim().toLowerCase() !== "application/pdf" || file.size === 0) {
    throw new Error("Сервер вернул некорректный PDF приказа");
  }
  return file;
}

export async function signOrder(id: number): Promise<OrderDetails> {
  if (!isId(id)) throw new Error("Некорректный идентификатор приказа");
  const response = await fetch(`${API_BASE_URL}/signOrder/${id}`, { method: "POST" });
  if (!response.ok) throw new Error(await getErrorMessage(response, "Не удалось подписать приказ"));
  const data: unknown = await response.json();
  if (!isOrderDetails(data) || data.id !== id || data.status !== "issued") {
    throw new Error("Сервер вернул некорректный результат подписания. Обновите реквизиты перед повтором.");
  }
  return data;
}
