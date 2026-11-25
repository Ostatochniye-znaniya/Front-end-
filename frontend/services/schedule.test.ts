import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ALL_SEMESTERS_ID,
    downloadSchedulePdf,
    formatSemesterLabel,
    formatSemesterPeriod,
    getSchedule,
    getSemesters,
} from '@/services/schedule';
import { captureDownloads, json, mockApi, pdf, text } from '@/tests/api';
import { makeScheduleRow } from '@/tests/dofFixtures';

const SEMESTERS = 'GET /csh/api/Semester/GetSemesters';
const SCHEDULE = 'GET /csh/api/ScheduleApi/GetSchedule';
const PDF = 'GET /csh/api/ScheduleApi/DownloadPdf';

let api: ReturnType<typeof mockApi>;

beforeEach(() => {
    api = mockApi();
});

async function loadRows(...rows: Record<string, unknown>[]) {
    api.on(SCHEDULE, () => json(rows));
    return getSchedule(1, ALL_SEMESTERS_ID);
}

describe('подписи семестра', () => {
    it.each([
        [1, 'год 2026, весенний семестр'],
        [2, 'год 2026, осенний семестр'],
    ])('formatSemesterLabel: часть %i', (part, expected) => {
        expect(formatSemesterLabel(2026, part)).toBe(expected);
    });

    it.each([
        [1, 'в апреле-мае 2026 года'],
        [2, 'в ноябре-декабре 2026 года'],
    ])('formatSemesterPeriod: часть %i — тот же текст, что в PDF', (part, expected) => {
        expect(formatSemesterPeriod(2026, part)).toBe(expected);
    });
});

describe('getSemesters', () => {
    it('сортирует от свежих к старым, внутри года осенний выше весеннего', async () => {
        api.on(SEMESTERS, () =>
            json([
                { id: 1, semesterYear: 2025, semesterPart: 2 },
                { id: 2, semesterYear: 2026, semesterPart: 1 },
                { id: 3, semesterYear: 2026, semesterPart: 2 },
            ])
        );

        expect((await getSemesters()).map((s) => s.id)).toEqual([3, 2, 1]);
    });

    it('определяет сезон по semesterPart, а не по yearPart с обратной нумерацией', async () => {
        api.on(SEMESTERS, () =>
            json([{ id: 1, semesterYear: 2026, semesterPart: 1, yearPart: 2 }])
        );

        expect(await getSemesters()).toEqual([
            { id: 1, year: 2026, part: 1, label: 'год 2026, весенний семестр' },
        ]);
    });

    it('читает поля в PascalCase', async () => {
        api.on(SEMESTERS, () => json([{ Id: 7, SemesterYear: 2026, SemesterPart: 2 }]));

        expect((await getSemesters())[0]).toMatchObject({ id: 7, year: 2026, part: 2 });
    });

    it('возвращает пустой список, если пришёл не массив', async () => {
        api.on(SEMESTERS, () => json({}));

        expect(await getSemesters()).toEqual([]);
    });

    it('бросает ошибку с HTTP-кодом', async () => {
        api.on(SEMESTERS, () => text('', 503));

        await expect(getSemesters()).rejects.toThrow(
            'Не удалось загрузить список семестров (HTTP 503)'
        );
    });
});

describe('getSchedule', () => {
    it('передаёт факультет и семестр, 0 означает «без фильтра»', async () => {
        api.on(SCHEDULE, () => json([]));

        await getSchedule(1, ALL_SEMESTERS_ID);

        expect(api.requests[0].query).toEqual({ facultyId: '1', semesterId: '0' });
    });

    it('раскладывает ответ бэкенда по полям строки', async () => {
        const rows = await loadRows(makeScheduleRow({ id: 42, lmsUrl: 'https://lms.test/1' }));

        expect(rows).toEqual([
            {
                id: '42',
                group: '221-321',
                studyProgram: 'Веб-технологии',
                discipline: 'Базы данных',
                faculty: 'ФИТ',
                department: 'Информационная безопасность',
                teacher: 'Иванов И.И.',
                dateTime: '10.11.2026, 10:00',
                room: 'Пр-2201',
                lmsUrl: 'https://lms.test/1',
            },
        ]);
    });

    it('читает поля в PascalCase', async () => {
        const [row] = await loadRows({ GroupName: '221-321', DisciplineName: 'Физика' });

        expect(row).toMatchObject({ group: '221-321', discipline: 'Физика' });
    });

    it('заменяет отсутствующие поля пустой строкой, а id — порядковым номером', async () => {
        const [row] = await loadRows({ groupName: '221-321', room: null });

        expect(row).toMatchObject({ id: '0', room: '', lmsUrl: '', teacher: '', dateTime: '—' });
    });

    it.each([
        ['дата и время', '2026-11-10T00:00:00', '14:30:00', '10.11.2026, 14:30'],
        ['нет времени', '2026-11-10T00:00:00', null, '10.11.2026'],
        ['TimeSpan.Zero', '2026-11-10T00:00:00', '00:00:00', '10.11.2026'],
        ['нет даты', null, '10:00:00', '—'],
        ['DateTime.MinValue', '0001-01-01T00:00:00', '10:00:00', '—'],
        ['нечитаемая дата', 'не дата', '10:00:00', '—'],
    ])('форматирует дату и время: %s', async (_name, date, time, expected) => {
        const [row] = await loadRows(makeScheduleRow({ date, time }));

        expect(row.dateTime).toBe(expected);
    });

    it('сортирует группы посимвольно, как PDF: 211-7212 раньше 211-722', async () => {
        const rows = await loadRows(
            makeScheduleRow({ id: 1, groupName: '211-722' }),
            makeScheduleRow({ id: 2, groupName: '211-7212' })
        );

        expect(rows.map((r) => r.group)).toEqual(['211-7212', '211-722']);
    });

    it('внутри группы сортирует по дате, затем по времени', async () => {
        const rows = await loadRows(
            makeScheduleRow({ id: 1, date: '2026-11-11T00:00:00', time: '09:00:00' }),
            makeScheduleRow({ id: 2, date: '2026-11-10T00:00:00', time: '12:00:00' }),
            makeScheduleRow({ id: 3, date: '2026-11-10T00:00:00', time: '10:00:00' })
        );

        expect(rows.map((r) => r.id)).toEqual(['3', '2', '1']);
    });

    it('сохраняет порядок бэкенда для полностью совпавших ключей', async () => {
        const rows = await loadRows(makeScheduleRow({ id: 9 }), makeScheduleRow({ id: 4 }));

        expect(rows.map((r) => r.id)).toEqual(['9', '4']);
    });

    it('возвращает пустой список, если пришёл не массив', async () => {
        api.on(SCHEDULE, () => json(null));

        expect(await getSchedule(1, 1)).toEqual([]);
    });

    it.each([
        ['поле error', json.bind(null, { error: 'Факультет не найден' }, 400), 'Факультет не найден'],
        ['поле title', json.bind(null, { title: 'Bad Request' }, 400), 'Bad Request'],
        ['пустой error', json.bind(null, { error: '' }, 500), 'Не удалось загрузить график (HTTP 500)'],
        ['не JSON', text.bind(null, '<html>', 502), 'Не удалось загрузить график (HTTP 502)'],
    ])('текст ошибки: %s', async (_name, respond, expected) => {
        api.on(SCHEDULE, () => respond());

        await expect(getSchedule(1, 1)).rejects.toThrow(expected);
    });
});

describe('downloadSchedulePdf', () => {
    it.each([
        ['имя в UTF-8', "attachment; filename=x.pdf; filename*=UTF-8''%D0%93%D1%80%D0%B0%D1%84%D0%B8%D0%BA.pdf", 'График.pdf'],
        ['имя в кавычках', 'attachment; filename="plan.pdf"', 'plan.pdf'],
        ['битая кодировка', "attachment; filename=plan.pdf; filename*=UTF-8''%E0%A4%A", 'plan.pdf'],
        ['заголовка нет', undefined, 'Расписание_тестирований.pdf'],
    ])('имя файла: %s', async (_name, header, expected) => {
        const downloads = captureDownloads();
        api.on(PDF, () => pdf(header));

        await downloadSchedulePdf(1, 2);

        expect(api.requests[0].query).toEqual({ facultyId: '1', semesterId: '2' });
        expect(downloads).toEqual([expected]);
    });

    it('убирает за собой ссылку и blob', async () => {
        captureDownloads();
        const revoke = vi.spyOn(URL, 'revokeObjectURL');
        api.on(PDF, () => pdf());

        await downloadSchedulePdf(1, 2);

        expect(document.querySelector('a')).toBeNull();
        expect(revoke).toHaveBeenCalledWith('blob:test');
    });

    it('при ошибке показывает текст бэкенда и ничего не скачивает', async () => {
        const downloads = captureDownloads();
        api.on(PDF, () => json({ error: 'Нет данных для формирования отчета' }, 400));

        await expect(downloadSchedulePdf(1, 2)).rejects.toThrow(
            'Нет данных для формирования отчета'
        );
        expect(downloads).toEqual([]);
    });
});
