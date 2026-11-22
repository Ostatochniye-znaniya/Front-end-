import { DocumentApiError, type FilterOption, type ReportDocument, type ReportFilterOptions } from "./documents";

const BASE_URL = "/csh/api/LprReports";

export interface LprReport extends ReportDocument {
  fileVersion: string;
  doneInElectronicForm: boolean | null;
  allDone: boolean | null;
}

export interface LprReportFilters {
  facultyId?: number;
  departmentId?: number;
  academicYear?: string;
  status?: string;
}

export interface LprReportFilterOptions extends ReportFilterOptions {
  faculties: FilterOption[];
}

function query(values: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  return search.size ? `?${search}` : "";
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${BASE_URL}/${path}`, { cache: "no-store", ...init });
  if (!response.ok) {
    let message = `Не удалось обработать отчёт (HTTP ${response.status})`;
    try {
      const body = await response.json();
      message = body.error ?? body.detail ?? message;
    } catch { /* Ответ прокси может не быть JSON. */ }
    throw new DocumentApiError(message, response.status);
  }
  return response;
}

export async function getLprReports(filters: LprReportFilters, signal?: AbortSignal): Promise<LprReport[]> {
  return (await request(`GetReports${query({ ...filters })}`, { signal })).json();
}

export async function getLprReportFilters(facultyId?: number, signal?: AbortSignal): Promise<LprReportFilterOptions> {
  return (await request(`GetFilters${query({ facultyId })}`, { signal })).json();
}

export async function reviewLprReport(report: LprReport, approved: boolean, comment?: string): Promise<LprReport> {
  return (await request(`${approved ? "Approve" : "Reject"}/${report.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileVersion: report.fileVersion, comment }),
  })).json();
}

export async function getLprReportFile(report: LprReport, signal?: AbortSignal): Promise<Blob> {
  return (await request(`Download/${report.id}${query({ fileVersion: report.fileVersion })}`, { signal })).blob();
}

export async function downloadLprReport(report: LprReport): Promise<void> {
  const file = await getLprReportFile(report);
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = report.fileName?.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_") || `Отчёт_${report.id}`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
