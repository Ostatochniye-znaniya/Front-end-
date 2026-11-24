/**
 * Сервисы страницы "Составление графика" (роль «Ответственный за подразделение»).
 *
 * Бэкенд: соседний репозиторий KnowledgeApp. Nginx проксирует /csh/api/<путь>
 * на API, срезая префикс (nginx/nginx.conf), а контроллеры наследуют
 * BaseController с [Route("[controller]/[action]")], поэтому адреса такие:
 *
 *   GET /csh/api/Semester/GetSemesters
 *   GET /csh/api/ScheduleApi/GetSchedule?facultyId={id}&semesterId={id}
 *   GET /csh/api/ScheduleApi/DownloadPdf?facultyId={id}&semesterId={id}
 *
 * В обоих фильтрах 0 означает «без фильтрации».
 */

const API_BASE_URL = '/csh/api';
const SCHEDULE_URL = `${API_BASE_URL}/ScheduleApi/GetSchedule`;
const SCHEDULE_PDF_URL = `${API_BASE_URL}/ScheduleApi/DownloadPdf`;

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
    /** Наименование профиля подготовки — programName */
    studyProgram: string;
    discipline: string;
    /** Институт / школа — facultyName */
    faculty: string;
    /** Кафедра — departmentName */
    department: string;
    /** ФИО ППС; при нескольких преподавателях бэкенд уже склеил их через запятую */
    teacher: string;
    /** Дата и время одной строкой, как в PDF: "10.11.2026, 10:00" */
    dateTime: string;
    /** Аудитория; пусто — значит тестирование идёт в LMS */
    room: string;
    /** Ссылка на LMS; пусто — «LMS» выводится обычным текстом */
    lmsUrl: string;
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
            // Сезон — только по semesterPart. У yearPart обратная нумерация
            // (половина учебного года: 2 — весна, см. AcademicPeriod на бэкенде),
            // а подписи и период в PDF бэкенд строит именно по semesterPart.
            const part = Number(pick(item, 'semesterPart') ?? 0);

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

/** Дата и время в одной ячейке, как в PDF: "10.11.2026, 10:00". */
function formatDateTime(dateValue: unknown, timeValue: unknown): string {
    const date = formatDate(dateValue);
    const time = formatTime(timeValue);

    if (date === EMPTY_VALUE) return EMPTY_VALUE;
    return time === EMPTY_VALUE ? date : `${date}, ${time}`;
}

/**
 * Период семестра для заголовка графика — тем же текстом, что уходит в PDF
 * (SemesterDto.GetPeriod на бэкенде).
 */
export function formatSemesterPeriod(year: number, part: number): string {
    return part === 1 ? `в апреле-мае ${year} года` : `в ноябре-декабре ${year} года`;
}

/** Ключ сортировки: строки идут как в PDF — сначала по группе, затем по дате и времени. */
function compareRows(a: Raw, b: Raw): number {
    // Посимвольно, как OrderBy(GroupName) на бэкенде: в PDF "211-7212" стоит
    // раньше "211-722". Числовое сравнение (numeric: true) переставило бы их.
    const groupA = asString(pick(a, 'groupName'));
    const groupB = asString(pick(b, 'groupName'));
    if (groupA !== groupB) return groupA < groupB ? -1 : 1;

    const dateA = asString(pick(a, 'date'));
    const dateB = asString(pick(b, 'date'));
    if (dateA !== dateB) return dateA < dateB ? -1 : 1;

    const timeA = asString(pick(a, 'time'));
    const timeB = asString(pick(b, 'time'));
    return timeA < timeB ? -1 : timeA > timeB ? 1 : 0;
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
    const response = await fetch(
        `${SCHEDULE_URL}?facultyId=${facultyId}&semesterId=${semesterId}`
    );
    if (!response.ok) {
        throw new Error(await readError(response, 'Не удалось загрузить график'));
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    // Поле number с бэкенда не используем: оно нумерует выборку до фильтрации
    // по факультету, поэтому у одного факультета в номерах будут дыры.
    // Нумерация на странице своя и считается по группам, как в PDF.
    return [...data]
        .sort(compareRows)
        .map((item: Raw, index): ScheduleRow => ({
            id: asString(pick(item, 'id') ?? index),
            group: asString(pick(item, 'groupName')),
            studyProgram: asString(pick(item, 'programName')),
            discipline: asString(pick(item, 'disciplineName')),
            faculty: asString(pick(item, 'facultyName')),
            department: asString(pick(item, 'departmentName')),
            teacher: asString(pick(item, 'teacherName')),
            dateTime: formatDateTime(pick(item, 'date'), pick(item, 'time')),
            room: asString(pick(item, 'room')),
            lmsUrl: asString(pick(item, 'lmsUrl')),
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
    const response = await fetch(
        `${SCHEDULE_PDF_URL}?facultyId=${facultyId}&semesterId=${semesterId}`
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
