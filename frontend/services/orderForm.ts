import type { CreateOrderRequest, OrderSemester } from "./orders";

type OrderFormRequest = Omit<CreateOrderRequest, "status">;
export type OrderFormValues = { [Key in Exclude<keyof OrderFormRequest, "requiresPaperReports">]: string }
  & { requiresPaperReports: boolean };
export type OrderFormField = keyof OrderFormValues;

export const ORDER_FORM_FIELDS = [
  { key: "orderDate", label: "Дата приказа", type: "date" },
  { key: "semesterId", label: "Семестр проведения проверки", type: "semester" },
  { key: "testingStartDate", label: "Общий период мероприятий: начало", type: "date" },
  { key: "testingEndDate", label: "Общий период мероприятий: окончание", type: "date" },
  { key: "preparationStartDate", label: "1 этап — подготовка: начало", type: "date" },
  { key: "preparationEndDate", label: "1 этап — подготовка: окончание", type: "date" },
  { key: "testingStageStartDate", label: "2 этап — тестирование: начало", type: "date" },
  { key: "testingStageEndDate", label: "2 этап — тестирование: окончание", type: "date" },
  { key: "resultsProcessingStartDate", label: "3 этап — обработка результатов: начало", type: "date" },
  { key: "inspectionSummaryDeadline", label: "3 этап — окончание / сводный отчёт по проверке до", type: "date" },
  { key: "onlineSeminarDate", label: "Обучающий онлайн-семинар для сотрудников", type: "date" },
  { key: "surveyStartDate", label: "Анкетирование: начало", type: "date" },
  { key: "surveyEndDate", label: "Анкетирование: окончание", type: "date" },
  { key: "surveySummaryDeadline", label: "Сводный отчёт по анкетированию до", type: "date" },
  { key: "requiresPaperReports", label: "Сдавать бумажные отчёты", type: "checkbox" },
  { key: "paperReportDeadline", label: "Сдача бумажных отчётов до", type: "date" },
  { key: "electronicReportDeadline", label: "Сдача электронных отчётов до", type: "date" },
  { key: "educationControlDepartmentHead", label: "Начальник отдела контроля образовательного процесса", type: "text" },
  { key: "educationalMethodicalCenterHead", label: "Начальник центра по учебно-методической работе", type: "text" },
] as const satisfies readonly { key: OrderFormField; label: string; type: "text" | "date" | "semester" | "checkbox" }[];

export type OrderDateField = Extract<(typeof ORDER_FORM_FIELDS)[number], { type: "date" }>;

// Группировка касается только отображения: поля и HTTP-контракт остаются прежними.
export const ORDER_FORM_DATE_RANGES = [
  { label: "Общий период мероприятий", start: "testingStartDate", end: "testingEndDate" },
  { label: "1 этап — подготовка", start: "preparationStartDate", end: "preparationEndDate" },
  { label: "2 этап — тестирование", start: "testingStageStartDate", end: "testingStageEndDate" },
  { label: "3 этап — обработка результатов", start: "resultsProcessingStartDate", end: "inspectionSummaryDeadline" },
  { label: "Анкетирование", start: "surveyStartDate", end: "surveyEndDate" },
] as const satisfies readonly { label: string; start: OrderDateField["key"]; end: OrderDateField["key"] }[];

export const ORDER_TEXT_LIMITS: Partial<Record<OrderFormField, number>> = {
  educationControlDepartmentHead: 200,
  educationalMethodicalCenterHead: 200,
};

export function emptyOrderForm(): OrderFormValues {
  return { ...Object.fromEntries(ORDER_FORM_FIELDS.map(({ key }) => [key, ""])), requiresPaperReports: false } as OrderFormValues;
}

// Tab идёт по строкам, включая чекбокс, date/select, и замыкается на первой строке.
export function nextOrderFieldIndex(current: number, count: number, backwards = false): number {
  if (count <= 0) return -1;
  if (current < 0 || current >= count) return backwards ? count - 1 : 0;
  return (current + (backwards ? -1 : 1) + count) % count;
}

export function matchesOrderNumber(number: string | null, search: string): boolean {
  return (number ?? "").toLocaleLowerCase("ru-RU").includes(search.trim().toLocaleLowerCase("ru-RU"));
}

export type OrderFormValidation =
  | { ok: true; request: OrderFormRequest }
  | { ok: false; field: OrderFormField; message: string };

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateOrderForm(values: OrderFormValues, semesters: readonly OrderSemester[]): OrderFormValidation {
  const trimmed = { ...values };
  for (const field of ORDER_FORM_FIELDS) {
    if (field.type === "checkbox" || (field.key === "paperReportDeadline" && !values.requiresPaperReports)) continue;
    const value = values[field.key].trim();
    trimmed[field.key] = value;
    if (!value) return { ok: false, field: field.key, message: `Заполните поле «${field.label}»` };
    if (field.type === "date" && !isCalendarDate(value)) {
      return { ok: false, field: field.key, message: `Укажите корректную дату: «${field.label}»` };
    }
    const limit = ORDER_TEXT_LIMITS[field.key];
    if (limit && value.length > limit) {
      return { ok: false, field: field.key, message: `Поле «${field.label}» длиннее ${limit} символов` };
    }
  }
  const semesterId = Number(trimmed.semesterId);
  if (!Number.isSafeInteger(semesterId) || semesterId <= 0 || !semesters.some((semester) => semester.id === semesterId)) {
    return { ok: false, field: "semesterId", message: "Выберите семестр из справочника" };
  }
  if (trimmed.testingEndDate < trimmed.testingStartDate) {
    return { ok: false, field: "testingEndDate", message: "Окончание общего периода раньше его начала" };
  }
  for (const field of ORDER_FORM_FIELDS) {
    if (field.type !== "date" || field.key === "orderDate" || field.key === "testingStartDate" || field.key === "testingEndDate"
      || (field.key === "paperReportDeadline" && !values.requiresPaperReports)) continue;
    if (trimmed[field.key] < trimmed.testingStartDate || trimmed[field.key] > trimmed.testingEndDate) {
      return { ok: false, field: field.key, message: `«${field.label}» должно входить в общий период мероприятий` };
    }
  }
  const phaseDates = ["preparationStartDate", "preparationEndDate", "testingStageStartDate",
    "testingStageEndDate", "resultsProcessingStartDate", "inspectionSummaryDeadline"] as const;
  for (let i = 1; i < phaseDates.length; i++) {
    if (trimmed[phaseDates[i]] < trimmed[phaseDates[i - 1]]) {
      return { ok: false, field: phaseDates[i], message: "Этапы должны идти последовательно: подготовка, тестирование, обработка результатов" };
    }
  }
  if (trimmed.surveyEndDate < trimmed.surveyStartDate || trimmed.surveySummaryDeadline < trimmed.surveyEndDate) {
    return { ok: false, field: "surveyEndDate", message: "Проверьте последовательность дат анкетирования и сводного отчёта" };
  }
  return { ok: true, request: { ...trimmed, semesterId, paperReportDeadline: values.requiresPaperReports ? trimmed.paperReportDeadline : null } };
}
