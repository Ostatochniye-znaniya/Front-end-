import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    approveReport,
    approveSchedule,
    DocumentApiError,
    downloadDeanReport,
    downloadDeanSchedule,
    downloadReportFile,
    downloadScheduleDocument,
    getCurrentScheduleDocument,
    getDeanReportFilters,
    getDeanReports,
    getDeanScheduleFilters,
    getDeanSchedules,
    MAX_PDF_SIZE_MB,
    rejectReport,
    rejectSchedule,
    setPaperReportDelivery,
    uploadReportPdf,
    uploadSchedulePdf,
    validatePdfFile,
} from '@/services/documents';
import { captureDownloads, json, mockApi, mockXhr, pdf, text } from '@/tests/api';
import { makePdf, makeReport, makeSchedule } from '@/tests/dofFixtures';

const DEAN = '/csh/api/DeanDocuments';
const LIMIT = MAX_PDF_SIZE_MB * 1024 * 1024;

let api: ReturnType<typeof mockApi>;

beforeEach(() => {
    api = mockApi();
});

describe('validatePdfFile', () => {
    it.each([
        ['обычный PDF', 'a.pdf', 10, null],
        ['расширение в верхнем регистре', 'A.PDF', 10, null],
        ['ровно на лимите', 'a.pdf', LIMIT, null],
        ['на байт больше лимита', 'a.pdf', LIMIT + 1, 'Файл больше 20 МБ'],
        ['пустой файл', 'a.pdf', 0, 'Файл пустой'],
        ['другой формат', 'a.docx', 10, 'Можно загрузить только PDF-файл'],
        ['двойное расширение', 'a.pdf.exe', 10, 'Можно загрузить только PDF-файл'],
    ])('%s', (_name, fileName, size, expected) => {
        expect(validatePdfFile(makePdf(fileName, size))).toBe(expected);
    });
});

describe('списки декана', () => {
    it('getDeanReports передаёт все заданные фильтры', async () => {
        api.on(`GET ${DEAN}/GetReports`, () => json([makeReport()]));

        const result = await getDeanReports({
            departmentId: 3,
            academicYear: '2026/2027',
            status: 'pending',
            facultyId: 1,
        });

        expect(result).toEqual([makeReport()]);
        expect(api.requests[0].query).toEqual({
            departmentId: '3',
            academicYear: '2026/2027',
            status: 'pending',
            facultyId: '1',
        });
    });

    it('getDeanSchedules передаёт все заданные фильтры', async () => {
        api.on(`GET ${DEAN}/GetSchedules`, () => json([makeSchedule()]));

        await getDeanSchedules({ semesterId: 2, status: 'signed', facultyId: 1 });

        expect(api.requests[0].query).toEqual({ semesterId: '2', status: 'signed', facultyId: '1' });
    });

    it('не передаёт пустые фильтры', async () => {
        api.on(`GET ${DEAN}/GetReports`, () => json([]));
        api.on(`GET ${DEAN}/GetSchedules`, () => json([]));

        await getDeanReports({ departmentId: null, academicYear: '', status: undefined });
        await getDeanSchedules();

        expect(api.requests.map((r) => r.query)).toEqual([{}, {}]);
    });

    it('загружает значения фильтров', async () => {
        const reportFilters = { departments: [], academicYears: [], statuses: [] };
        const scheduleFilters = { semesters: [], statuses: [] };
        api.on(`GET ${DEAN}/GetReportFilters`, () => json(reportFilters));
        api.on(`GET ${DEAN}/GetScheduleFilters`, () => json(scheduleFilters));

        expect(await getDeanReportFilters()).toEqual(reportFilters);
        expect(await getDeanScheduleFilters()).toEqual(scheduleFilters);
    });
});

describe('решения декана', () => {
    it.each([
        ['approveReport', () => approveReport(5), 'POST', 'ApproveReport/5/approve', undefined],
        ['rejectReport с комментарием', () => rejectReport(5, 'Нет подписи'), 'POST', 'RejectReport/5/reject', { comment: 'Нет подписи' }],
        ['rejectReport без комментария', () => rejectReport(5), 'POST', 'RejectReport/5/reject', { comment: null }],
        ['setPaperReportDelivery', () => setPaperReportDelivery(5, true), 'PUT', 'SetPaperDelivery/5/paper-delivery', { submitted: true }],
        ['approveSchedule', () => approveSchedule(5), 'POST', 'ApproveSchedule/5/approve', undefined],
        ['rejectSchedule с комментарием', () => rejectSchedule(5, 'Ошибка'), 'POST', 'RejectSchedule/5/reject', { comment: 'Ошибка' }],
        ['rejectSchedule без комментария', () => rejectSchedule(5), 'POST', 'RejectSchedule/5/reject', { comment: null }],
    ])('%s: адрес, метод и тело', async (_name, call, method, path, body) => {
        api.on(`${method} ${DEAN}/${path}`, () => json({ id: 5 }));

        expect(await call()).toEqual({ id: 5 });
        expect(api.requests).toHaveLength(1);
        expect(api.requests[0].body).toEqual(body);
    });
});

describe('ошибки API', () => {
    it.each([
        ['поле error', 409, JSON.stringify({ error: 'Отчёт уже рассмотрен' }), 'Отчёт уже рассмотрен'],
        ['поле title', 400, JSON.stringify({ title: 'Bad Request' }), 'Bad Request'],
        ['пустое тело', 500, '', 'Не удалось одобрить отчёт (HTTP 500)'],
        ['не JSON', 502, '<html>', 'Не удалось одобрить отчёт (HTTP 502)'],
        ['413 от nginx', 413, '<html>', 'Файл больше 20 МБ'],
    ])('%s', async (_name, status, body, message) => {
        api.on(`POST ${DEAN}/ApproveReport/1/approve`, () => text(body, status));

        const error = await approveReport(1).catch((e) => e);

        expect(error).toBeInstanceOf(DocumentApiError);
        expect(error).toMatchObject({ name: 'DocumentApiError', message, status });
    });

    it('PUT и GET тоже отдают DocumentApiError', async () => {
        api.on(`PUT ${DEAN}/SetPaperDelivery/1/paper-delivery`, () => text('', 404));
        api.on(`GET ${DEAN}/GetReports`, () => text('', 500));

        await expect(setPaperReportDelivery(1, false)).rejects.toThrow(
            'Не удалось обновить статус бумажного отчёта (HTTP 404)'
        );
        await expect(getDeanReports()).rejects.toThrow('Не удалось загрузить отчёты (HTTP 500)');
    });
});

describe('скачивание', () => {
    it.each([
        ['downloadDeanReport', () => downloadDeanReport(7), 'DeanDocuments/DownloadReport/7', 'Отчёт_7.pdf'],
        ['downloadDeanSchedule', () => downloadDeanSchedule(7), 'DeanDocuments/DownloadSchedule/7', 'График_ПОЗ.pdf'],
        ['downloadScheduleDocument', () => downloadScheduleDocument(7), 'ScheduleDocument/Download/7', 'График_ПОЗ.pdf'],
        ['downloadReportFile', () => downloadReportFile(7), 'ReportFile/Download/7', 'Отчёт_7.pdf'],
    ])('%s: адрес и имя файла по умолчанию', async (_name, call, path, fileName) => {
        const downloads = captureDownloads();
        api.on(`GET /csh/api/${path}`, () => pdf());

        await call();

        expect(downloads).toEqual([fileName]);
    });

    it.each([
        ['имя в UTF-8', "attachment; filename*=UTF-8''%D0%9E%D1%82%D1%87%D1%91%D1%82.pdf", 'Отчёт.pdf'],
        ['обычное имя', 'attachment; filename="r.pdf"', 'r.pdf'],
        ['битая кодировка', "attachment; filename=r.pdf; filename*=UTF-8''%E0%A4%A", 'r.pdf'],
        ['заголовок без имени', 'attachment', 'Отчёт_7.pdf'],
    ])('Content-Disposition: %s', async (_name, header, expected) => {
        const downloads = captureDownloads();
        api.on(`GET ${DEAN}/DownloadReport/7`, () => pdf(header));

        await downloadDeanReport(7);

        expect(downloads).toEqual([expected]);
    });

    it('освобождает blob через секунду, а не сразу', async () => {
        vi.useFakeTimers();
        captureDownloads();
        const revoke = vi.spyOn(URL, 'revokeObjectURL');
        api.on(`GET ${DEAN}/DownloadReport/7`, () => pdf());

        await downloadDeanReport(7);
        expect(revoke).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1000);
        expect(revoke).toHaveBeenCalledWith('blob:test');
    });

    it('при ошибке ничего не скачивает', async () => {
        const downloads = captureDownloads();
        api.on(`GET ${DEAN}/DownloadReport/7`, () => json({ error: 'Файл не найден' }, 404));

        await expect(downloadDeanReport(7)).rejects.toThrow('Файл не найден');
        expect(downloads).toEqual([]);
    });
});

describe('getCurrentScheduleDocument', () => {
    const ROUTE = 'GET /csh/api/ScheduleDocument/GetCurrent';

    it('возвращает документ семестра', async () => {
        api.on(ROUTE, () => json(makeSchedule()));

        expect(await getCurrentScheduleDocument(2)).toEqual(makeSchedule());
        expect(api.requests[0].query).toEqual({ semesterId: '2' });
    });

    it.each([['null', 'null'], ['пустое тело', ''], ['пробелы', '  \n']])(
        'документа нет: %s',
        async (_name, body) => {
            api.on(ROUTE, () => text(body));

            expect(await getCurrentScheduleDocument(2)).toBeNull();
        }
    );

    it('сохраняет HTTP-код ошибки — страница по нему отличает 404', async () => {
        api.on(ROUTE, () => text('', 404));

        await expect(getCurrentScheduleDocument(2)).rejects.toMatchObject({ status: 404 });
    });
});

describe('загрузка файлов', () => {
    let xhrs: ReturnType<typeof mockXhr>;

    beforeEach(() => {
        xhrs = mockXhr();
    });

    it('uploadSchedulePdf отправляет семестр и файл', async () => {
        const file = makePdf();
        const promise = uploadSchedulePdf(2, file);
        const [xhr] = xhrs;

        expect([xhr.method, xhr.url]).toEqual(['POST', '/csh/api/ScheduleDocument/Upload']);
        expect(xhr.form?.get('semesterId')).toBe('2');
        expect((xhr.form?.get('file') as File).name).toBe('график.pdf');

        xhr.respond(200, makeSchedule());
        expect(await promise).toEqual(makeSchedule());
    });

    it('uploadReportPdf отправляет файл по id отчёта', async () => {
        const promise = uploadReportPdf(9, makePdf('r.pdf'));
        const [xhr] = xhrs;

        expect(xhr.url).toBe('/csh/api/ReportFile/Upload/9');
        expect((xhr.form?.get('file') as File).name).toBe('r.pdf');

        xhr.respond(200, makeReport({ id: 9 }));
        expect(await promise).toMatchObject({ id: 9 });
    });

    it('сообщает прогресс в целых процентах и пропускает события без длины', async () => {
        const onProgress = vi.fn();
        const promise = uploadSchedulePdf(2, makePdf(), onProgress);

        xhrs[0].progress(1, 3);
        xhrs[0].progress(1, 0, false);
        xhrs[0].progress(3, 3);
        xhrs[0].respond(200, makeSchedule());
        await promise;

        expect(onProgress.mock.calls).toEqual([[33], [100]]);
    });

    it.each([
        ['ошибка бэкенда', 409, JSON.stringify({ error: 'График уже подписан' }), 'График уже подписан'],
        ['413 от nginx', 413, '<html>', 'Файл больше 20 МБ'],
        ['прочая ошибка', 500, '', 'Не удалось загрузить файл (HTTP 500)'],
        ['успех с нечитаемым телом', 200, '<html>', 'Некорректный ответ сервера'],
    ])('%s', async (_name, status, body, message) => {
        const promise = uploadSchedulePdf(2, makePdf());
        xhrs[0].respond(status, body);

        await expect(promise).rejects.toMatchObject({ message, status });
    });

    it.each([
        ['onerror', 'Сеть недоступна, файл не отправлен'],
        ['onabort', 'Загрузка отменена'],
        ['ontimeout', 'Сервер не ответил, файл не отправлен'],
    ] as const)('сбой соединения: %s', async (event, message) => {
        const promise = uploadSchedulePdf(2, makePdf());
        xhrs[0][event]?.();

        await expect(promise).rejects.toMatchObject({ message, status: 0 });
    });
});
