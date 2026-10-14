import type { CreateOrderRequest } from "./orders";

export type OrderFormValues = { [Key in keyof CreateOrderRequest]: string };
export type OrderFormField = keyof OrderFormValues;

export const ORDER_FORM_FIELDS = [
  { key: "number", label: "Номер приказа", type: "text" },
  { key: "orderDate", label: "Дата приказа", type: "date" },
  { key: "academicYear", label: "Учебный год", type: "year" },
  { key: "checkedSemester", label: "Проверяемый семестр", type: "semester" },
  { key: "testingStartDate", label: "Дата начала тестирования", type: "date" },
  { key: "testingEndDate", label: "Дата окончания тестирования", type: "date" },
  { key: "educationControlDepartmentHead", label: "Начальник отдела контроля образовательного процесса", type: "text" },
  { key: "educationalMethodicalCenterHead", label: "Начальник центра по учебно-методической работе", type: "text" },
  { key: "inspectionSummaryDeadline", label: "Сводный отчёт по результатам проверки до", type: "date" },
  { key: "surveySummaryDeadline", label: "Сводный отчёт по результатам анкетирования до", type: "date" },
  { key: "paperReportDeadline", label: "Сдача бумажных отчётов до", type: "date" },
  { key: "electronicReportDeadline", label: "Сдача электронных отчётов до", type: "date" },
] as const satisfies readonly { key: OrderFormField; label: string; type: "text" | "date" | "year" | "semester" }[];

export function emptyOrderForm(): OrderFormValues {
  return Object.fromEntries(ORDER_FORM_FIELDS.map(({ key }) => [key, ""])) as OrderFormValues;
}

// Tab идёт по строкам, включая date/select, и замыкается на первой строке.
export function nextOrderFieldIndex(current: number, count: number, backwards = false): number {
  if (count <= 0) return -1;
  if (current < 0 || current >= count) return backwards ? count - 1 : 0;
  return (current + (backwards ? -1 : 1) + count) % count;
}

export function matchesOrderNumber(number: string, search: string): boolean {
  return number.toLocaleLowerCase("ru-RU").includes(search.trim().toLocaleLowerCase("ru-RU"));
}

export type OrderFormValidation =
  | { ok: true; request: CreateOrderRequest }
  | { ok: false; field: OrderFormField; message: string };

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateOrderForm(values: OrderFormValues): OrderFormValidation {
  const trimmed = Object.fromEntries(ORDER_FORM_FIELDS.map(({ key }) => [key, values[key].trim()])) as OrderFormValues;
  for (const field of ORDER_FORM_FIELDS) {
    if (!trimmed[field.key]) return { ok: false, field: field.key, message: `Заполните поле «${field.label}»` };
    if (field.type === "date" && !isCalendarDate(trimmed[field.key])) {
      return { ok: false, field: field.key, message: `Укажите корректную дату: «${field.label}»` };
    }
  }
  const academicYear = Number(trimmed.academicYear);
  if (!Number.isInteger(academicYear) || academicYear < 1900 || academicYear > 3000) {
    return { ok: false, field: "academicYear", message: "Укажите корректный учебный год" };
  }
  const checkedSemester = Number(trimmed.checkedSemester);
  if (!Number.isInteger(checkedSemester) || checkedSemester < 1 || checkedSemester > 8) {
    return { ok: false, field: "checkedSemester", message: "Выберите проверяемый семестр" };
  }
  if (trimmed.testingEndDate < trimmed.testingStartDate) {
    return { ok: false, field: "testingEndDate", message: "Дата окончания тестирования не может быть раньше даты начала" };
  }
  return { ok: true, request: { ...trimmed, academicYear, checkedSemester } };
}
