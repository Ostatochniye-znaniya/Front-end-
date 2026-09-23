/**
 * Сервисы страницы "Составление графика" (роль «Ответственный за подразделение»).
 *
 * Бэкенд: соседний репозиторий KnowledgeApp.
 * Nginx проксирует /csh/api/<путь> на API, срезая префикс (nginx/nginx.conf),
 * поэтому браузерный URL = '/csh/api' + маршрут контроллера.
 *
 * Семестры — ровно как в ТЗ:
 *   GET /csh/api/Semester/GetSemesters
 *   (SemesterController : BaseController → [Route("[controller]/[action]")])
 *
 * График и PDF описаны в ТЗ как ScheduleApi/GetSchedule и ScheduleApi/DownloadPdf,
 * но сейчас таких маршрутов на бэкенде нет: у ScheduleApiController атрибут
 * [Route("api/[controller]")] и методы [HttpGet] / [HttpGet("pdf")], то есть
 * фактические адреса — /csh/api/api/ScheduleApi и /csh/api/api/ScheduleApi/pdf.
 *
 * Поэтому каждый запрос сначала идёт по адресу из ТЗ и только на 404 откатывается
 * на фактический. Когда ручки из ТЗ появятся, фронт подхватит их без правок;
 * найденный рабочий адрес запоминается, чтобы не ходить в 404 на каждый запрос.
 *
 * В обоих фильтрах 0 означает «без фильтрации».
 */

const API_BASE_URL = '/csh/api';

/** Адреса в порядке предпочтения: сначала из ТЗ, затем фактический на стенде. */
const ENDPOINTS = {
    schedule: [
        `${API_BASE_URL}/ScheduleApi/GetSchedule`,
        `${API_BASE_URL}/api/ScheduleApi`,
    ],
    pdf: [
        `${API_BASE_URL}/ScheduleApi/DownloadPdf`,
        `${API_BASE_URL}/api/ScheduleApi/pdf`,
    ],
} as const;

type EndpointKey = keyof typeof ENDPOINTS;

/** Адрес, ответивший не-404: чтобы не перебирать варианты на каждый запрос. */
const resolvedEndpoint: Partial<Record<EndpointKey, string>> = {};

/**
 * Перебирает адреса ручки, пока один не ответит чем-то кроме 404.
 * Если все дали 404 — возвращает последний ответ, чтобы вызывающий показал ошибку.
 */
async function requestWithFallback(key: EndpointKey, query: string): Promise<Response> {
    const preferred = resolvedEndpoint[key];
    const candidates = preferred
        ? [preferred, ...ENDPOINTS[key].filter((url) => url !== preferred)]
        : [...ENDPOINTS[key]];

    let lastResponse: Response | null = null;

    for (const url of candidates) {
        const response = await fetch(`${url}${query}`);

        if (response.status === 404) {
            lastResponse = response;
            continue;
        }

        resolvedEndpoint[key] = url;
        return response;
    }

    // Все адреса отдали 404 — сбрасываем память, вдруг бэкенд переехал.
    delete resolvedEndpoint[key];
    return lastResponse as Response;
}

/** Значение фильтра «все семестры» — бэкенд трактует 0 как отсутствие фильтра. */
export const ALL_SEMESTERS_ID = 0;

/** Прочерк для незаполненных на бэкенде даты/времени проведения. */
const EMPTY_VALUE = '—';

export interface Semester {
    id: number;
    year: number;
    /** 1 — весенний (апрель-май), 2 — осенний (ноябрь-декабрь) — см. SemesterDto.GetPeriod() */
    part: number;
    /** Готовая подпись вида "год 2025, осенний семестр" */
    label: string;
}

export interface ScheduleRow {
    id: string;
    group: string;
    studyProgram: string;
    discipline: string;
    department: string;
    teacher: string;
    date: string;
    time: string;
}

type Raw = Record<string, unknown>;

/** Достаёт поле без учёта регистра: API отдаёт camelCase, но контракты описаны в PascalCase. */
function pick(raw: Raw, ...keys: string[]): unknown {
    for (const key of keys) {
        const match = Object.keys(raw).find(
            (k) => k.toLowerCase() === key.toLowerCase()
        );
        if (match === undefined) continue;
        const value = raw[match];
        if (value !== null && value !== undefined && value !== '') return value;
    }
    return undefined;
}

const asString = (value: unknown): string =>
    value === null || value === undefined ? '' : String(value);

/** Формат подписи семестра по ТЗ: "год <год>, <весенний/осенний> семестр". */
export function formatSemesterLabel(year: number, part: number): string {
    return `год ${year}, ${part === 1 ? 'весенний' : 'осенний'} семестр`;
}

/**
 * Определяет часть учебного года. ТЗ называет у семестра три поля —
 * SemesterYear, SemesterPart и YearPart, но YearPart на бэкенде пока нет,
 * поэтому берём его, если появится, и откатываемся на SemesterPart.
 * Соглашение бэкенда: 1 — весенний (апрель-май), 2 — осенний (ноябрь-декабрь).
 * Словесное значение YearPart тоже понимаем — на случай, если его добавят строкой.
 */
function resolvePart(raw: Raw): number {
    const value = pick(raw, 'yearPart') ?? pick(raw, 'semesterPart');

    if (typeof value === 'string') {
        const text = value.toLowerCase();
        if (text.includes('весен') || text.includes('spring')) return 1;
        if (text.includes('осен') || text.includes('fall') || text.includes('autumn')) return 2;
    }

    const numeric = Number(value);
    return Number.isNaN(numeric) ? 0 : numeric;
}

export async function getSemesters(): Promise<Semester[]> {
    const response = await fetch(`${API_BASE_URL}/Semester/GetSemesters`);
    if (!response.ok) {
        throw new Error(`Не удалось загрузить список семестров (HTTP ${response.status})`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data
        .map((item: Raw, index): Semester => {
            const year = Number(pick(item, 'semesterYear') ?? 0);
            const part = resolvePart(item);

            return {
                id: Number(pick(item, 'id') ?? index),
                year,
                part,
                label: formatSemesterLabel(year, part),
            };
        })
        // Свежие семестры сверху: в пределах года весенний (апрель-май) идёт раньше осеннего
        .sort((a, b) => b.year - a.year || b.part - a.part);
}

/** Дата приходит как DateTime, а незаполненная — как DateTime.MinValue. */
function formatDate(value: unknown): string {
    const raw = asString(value);
    if (!raw) return EMPTY_VALUE;

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() < 1900) return EMPTY_VALUE;

    return parsed.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/** Время приходит как TimeSpan ("14:30:00"), а незаполненное — как TimeSpan.Zero. */
function formatTime(value: unknown): string {
    const raw = asString(value);
    if (!raw || raw.startsWith('00:00:00')) return EMPTY_VALUE;

    return raw.slice(0, 5);
}

/** Разбирает тело ошибки: API отвечает { error: "..." } и на 400, и на 500. */
async function readError(response: Response, fallback: string): Promise<string> {
    try {
        const text = await response.text();
        const parsed = JSON.parse(text);
        const message = parsed?.error ?? parsed?.title;
        if (typeof message === 'string' && message) return message;
    } catch {
        /* не JSON — отдаём текст по умолчанию */
    }
    return `${fallback} (HTTP ${response.status})`;
}

export async function getSchedule(
    facultyId: number,
    semesterId: number
): Promise<ScheduleRow[]> {
    const response = await requestWithFallback(
        'schedule',
        `?facultyId=${facultyId}&semesterId=${semesterId}`
    );
    if (!response.ok) {
        throw new Error(await readError(response, 'Не удалось загрузить график'));
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    // Поле number с бэкенда не используем: оно нумерует выборку до фильтрации
    // по факультету, поэтому у одного факультета в номерах будут дыры.
    return data.map((item: Raw, index): ScheduleRow => ({
        id: asString(pick(item, 'id') ?? index),
        group: asString(pick(item, 'groupName')),
        studyProgram: asString(pick(item, 'programName')),
        discipline: asString(pick(item, 'disciplineName')),
        department: asString(pick(item, 'departmentName')),
        teacher: asString(pick(item, 'teacherName')),
        date: formatDate(pick(item, 'date')),
        time: formatTime(pick(item, 'time')),
    }));
}

/** Достаёт имя файла из Content-Disposition — бэкенд отдаёт его в UTF-8. */
function filenameFromResponse(response: Response, fallback: string): string {
    const header = response.headers.get('Content-Disposition');
    if (!header) return fallback;

    const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (encoded) {
        try {
            return decodeURIComponent(encoded[1]);
        } catch {
            /* повреждённый заголовок — используем запасной вариант */
        }
    }

    const plain = header.match(/filename="?([^";]+)"?/i);
    return plain ? plain[1] : fallback;
}

/** Запрашивает PDF с теми же фильтрами и отдаёт его браузеру на скачивание. */
export async function downloadSchedulePdf(
    facultyId: number,
    semesterId: number
): Promise<void> {
    const response = await requestWithFallback(
        'pdf',
        `?facultyId=${facultyId}&semesterId=${semesterId}`
    );
    if (!response.ok) {
        throw new Error(await readError(response, 'Не удалось сформировать PDF'));
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = filenameFromResponse(response, 'Расписание_тестирований.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
}
