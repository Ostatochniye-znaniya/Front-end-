const API_BASE_URL = "/csh/api";

export interface CreateOrderRequest {
  orderDate: string;
  number: string;
  academicYear: number;
  checkedSemester: number;
  testingStartDate: string;
  testingEndDate: string;
  educationControlDepartmentHead: string;
  educationalMethodicalCenterHead: string;
  inspectionSummaryDeadline: string;
  surveySummaryDeadline: string;
  paperReportDeadline: string;
  electronicReportDeadline: string;
}

export interface OrderEssentials {
  id: string;
  number: string;
  name: string;
  academicYear: number;
  semester: number;
}

export function getOrderDownloadName(number: string, contentType: string): string {
  const extensions: Record<string, string> = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/msword": ".doc",
    "application/rtf": ".rtf",
    "text/rtf": ".rtf",
    "application/zip": ".zip",
  };
  const safeNumber = number.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim();
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
      const title = "title" in body ? body.title : undefined;

      if (typeof error === "string" && error) return error;
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

export async function getOrders(): Promise<OrderEssentials[]> {
  const response = await fetch(`${API_BASE_URL}/getOrdersEssentials`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Не удалось получить приказы"),
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Сервер вернул некорректный список приказов");
  }

  return data as OrderEssentials[];
}

export async function getOrderFile(id: string): Promise<Blob> {
  const response = await fetch(
    `${API_BASE_URL}/getOrder/${encodeURIComponent(id)}`,
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Не удалось получить файл приказа"),
    );
  }

  return response.blob();
}
