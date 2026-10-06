const API_BASE_URL = '/csh/api';

// как MAX_UPLOAD_SIZE_MB на бэкенде
export const MAX_PDF_SIZE_MB = 20;

export type DocumentStatus = 'pending' | 'signed' | 'rejected';

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
    pending: 'Ожидает подписи',
    signed: 'Подписан',
    rejected: 'Отклонён',
};

export interface ReportDocument {
    id: number;
    academicYear: string | null;
    studyProgramCode: string | null;
    groupNumber: string | null;
    disciplineName: string | null;
    teacherName: string | null;
    departmentId: number | null;
    departmentName: string | null;
    status: DocumentStatus;
    statusLabel: string;
    fileName: string | null;
    uploadedAt: string | null;
    reviewComment: string | null;
    reviewedAt: string | null;
}

export interface ScheduleDocument {
    id: number;
    facultyId: number;
    semesterId: number;
    semesterYear: number;
    semesterPart: number;
    period: string;
    status: DocumentStatus;
    statusLabel: string;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
    reviewComment: string | null;
    reviewedAt: string | null;
}

export interface FilterOption {
    value: string;
    label: string;
}

export interface ReportFilterOptions {
    departments: FilterOption[];
    academicYears: FilterOption[];
    statuses: FilterOption[];
}

export interface ScheduleFilterOptions {
    semesters: FilterOption[];
    statuses: FilterOption[];
}

export interface ReportFilters {
    departmentId?: number | null;
    academicYear?: string | null;
    status?: DocumentStatus | null;
}

export interface ScheduleFilters {
    semesterId?: number | null;
    status?: DocumentStatus | null;
}

export type UploadProgressHandler = (percent: number) => void;

export class DocumentApiError extends Error {
    constructor(message: string, public readonly status: number) {
        super(message);
        this.name = 'DocumentApiError';
    }
}

function parseErrorText(text: string, status: number, fallback: string): DocumentApiError {
    try {
        const parsed = JSON.parse(text);
        const message = parsed?.error ?? parsed?.title;
        if (typeof message === 'string' && message) return new DocumentApiError(message, status);
    } catch {
        /* не JSON */
    }
    if (status === 413) return new DocumentApiError(`Файл больше ${MAX_PDF_SIZE_MB} МБ`, status);
    return new DocumentApiError(`${fallback} (HTTP ${status})`, status);
}

async function readError(response: Response, fallback: string): Promise<DocumentApiError> {
    return parseErrorText(await response.text().catch(() => ''), response.status, fallback);
}

function buildQuery(params: Record<string, string | number | null | undefined>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined && value !== '') search.set(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : '';
}

async function getJson<T>(path: string, fallback: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) throw await readError(response, fallback);
    return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown, fallback: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw await readError(response, fallback);
    return response.json() as Promise<T>;
}

function filenameFromResponse(response: Response, fallback: string): string {
    const header = response.headers.get('Content-Disposition');
    if (!header) return fallback;

    const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (encoded) {
        try {
            return decodeURIComponent(encoded[1]);
        } catch {
            /* битый заголовок */
        }
    }

    const plain = header.match(/filename="?([^";]+)"?/i);
    return plain ? plain[1] : fallback;
}

async function downloadFile(path: string, fallbackName: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) throw await readError(response, 'Не удалось скачать файл');

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = filenameFromResponse(response, fallbackName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

// у fetch нет прогресса загрузки, поэтому XHR
function uploadForm<T>(path: string, form: FormData, onProgress?: UploadProgressHandler): Promise<T> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}${path}`);

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText) as T);
                } catch {
                    reject(new DocumentApiError('Некорректный ответ сервера', xhr.status));
                }
                return;
            }
            reject(parseErrorText(xhr.responseText, xhr.status, 'Не удалось загрузить файл'));
        };
        xhr.onerror = () => reject(new DocumentApiError('Сеть недоступна, файл не отправлен', 0));
        xhr.onabort = () => reject(new DocumentApiError('Загрузка отменена', 0));
        xhr.ontimeout = () => reject(new DocumentApiError('Сервер не ответил, файл не отправлен', 0));

        xhr.send(form);
    });
}

export function validatePdfFile(file: File): string | null {
    if (!file.name.toLowerCase().endsWith('.pdf')) return 'Можно загрузить только PDF-файл';
    if (file.size === 0) return 'Файл пустой';
    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) return `Файл больше ${MAX_PDF_SIZE_MB} МБ`;
    return null;
}

export function getDeanReports(filters: ReportFilters = {}): Promise<ReportDocument[]> {
    const query = buildQuery({
        departmentId: filters.departmentId,
        academicYear: filters.academicYear,
        status: filters.status,
    });
    return getJson(`/DeanDocuments/GetReports${query}`, 'Не удалось загрузить отчёты');
}

export function getDeanReportFilters(): Promise<ReportFilterOptions> {
    return getJson('/DeanDocuments/GetReportFilters', 'Не удалось загрузить фильтры');
}

export function downloadDeanReport(reportId: number): Promise<void> {
    return downloadFile(`/DeanDocuments/DownloadReport/${reportId}`, `Отчёт_${reportId}.pdf`);
}

export function approveReport(reportId: number): Promise<ReportDocument> {
    return postJson(`/DeanDocuments/ApproveReport/${reportId}`, undefined, 'Не удалось одобрить отчёт');
}

export function rejectReport(reportId: number, comment?: string): Promise<ReportDocument> {
    return postJson(`/DeanDocuments/RejectReport/${reportId}`, { comment: comment ?? null }, 'Не удалось отклонить отчёт');
}

export function getDeanSchedules(filters: ScheduleFilters = {}): Promise<ScheduleDocument[]> {
    const query = buildQuery({ semesterId: filters.semesterId, status: filters.status });
    return getJson(`/DeanDocuments/GetSchedules${query}`, 'Не удалось загрузить графики');
}

export function getDeanScheduleFilters(): Promise<ScheduleFilterOptions> {
    return getJson('/DeanDocuments/GetScheduleFilters', 'Не удалось загрузить фильтры');
}

export function downloadDeanSchedule(documentId: number): Promise<void> {
    return downloadFile(`/DeanDocuments/DownloadSchedule/${documentId}`, 'График_ПОЗ.pdf');
}

export function approveSchedule(documentId: number): Promise<ScheduleDocument> {
    return postJson(`/DeanDocuments/ApproveSchedule/${documentId}`, undefined, 'Не удалось одобрить график');
}

export function rejectSchedule(documentId: number, comment?: string): Promise<ScheduleDocument> {
    return postJson(`/DeanDocuments/RejectSchedule/${documentId}`, { comment: comment ?? null }, 'Не удалось отклонить график');
}

export function uploadSchedulePdf(
    semesterId: number,
    file: File,
    onProgress?: UploadProgressHandler
): Promise<ScheduleDocument> {
    const form = new FormData();
    form.append('semesterId', String(semesterId));
    form.append('file', file);
    return uploadForm('/ScheduleDocument/Upload', form, onProgress);
}

export async function getCurrentScheduleDocument(semesterId: number): Promise<ScheduleDocument | null> {
    const response = await fetch(`${API_BASE_URL}/ScheduleDocument/GetCurrent${buildQuery({ semesterId })}`);
    if (!response.ok) throw await readError(response, 'Не удалось получить статус графика');

    const text = await response.text();
    return text.trim() ? (JSON.parse(text) as ScheduleDocument | null) : null;
}

export function downloadScheduleDocument(documentId: number): Promise<void> {
    return downloadFile(`/ScheduleDocument/Download/${documentId}`, 'График_ПОЗ.pdf');
}

export function uploadReportPdf(
    reportId: number,
    file: File,
    onProgress?: UploadProgressHandler
): Promise<ReportDocument> {
    const form = new FormData();
    form.append('file', file);
    return uploadForm(`/ReportFile/Upload/${reportId}`, form, onProgress);
}

export function downloadReportFile(reportId: number): Promise<void> {
    return downloadFile(`/ReportFile/Download/${reportId}`, `Отчёт_${reportId}.pdf`);
}
