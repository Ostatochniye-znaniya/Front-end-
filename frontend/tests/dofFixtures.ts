import type { ReportDocument, ScheduleDocument } from '@/services/documents';

export function makeReport(overrides: Partial<ReportDocument> = {}): ReportDocument {
    return {
        id: 1,
        academicYear: '2026/2027',
        studyProgramCode: '09.03.01',
        groupNumber: '221-321',
        disciplineName: 'Базы данных',
        teacherName: 'Иванов И.И.',
        departmentId: 3,
        departmentName: 'Информационная безопасность',
        status: 'pending',
        statusLabel: 'Ожидает подписи',
        fileName: 'report.pdf',
        uploadedAt: '2026-11-20T10:00:00',
        reviewComment: null,
        reviewedAt: null,
        paperStatus: 'not_required',
        paperStatusLabel: 'Не требуется',
        doneInPaperForm: null,
        ...overrides,
    };
}

export function makeSchedule(overrides: Partial<ScheduleDocument> = {}): ScheduleDocument {
    return {
        id: 1,
        facultyId: 1,
        semesterId: 2,
        semesterYear: 2026,
        semesterPart: 2,
        period: 'в ноябре-декабре 2026 года',
        status: 'pending',
        statusLabel: 'Ожидает подписи',
        fileName: 'график.pdf',
        fileSize: 1024,
        uploadedAt: '2026-11-20T10:00:00',
        reviewComment: null,
        reviewedAt: null,
        ...overrides,
    };
}

/** Строка GET /ScheduleApi/GetSchedule в том виде, в каком её отдаёт бэкенд. */
export function makeScheduleRow(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        number: 1,
        groupName: '221-321',
        programName: 'Веб-технологии',
        disciplineName: 'Базы данных',
        facultyName: 'ФИТ',
        departmentName: 'Информационная безопасность',
        teacherName: 'Иванов И.И.',
        date: '2026-11-10T00:00:00',
        time: '10:00:00',
        room: 'Пр-2201',
        lmsUrl: null,
        ...overrides,
    };
}

export function makePdf(name = 'график.pdf', size = 8): File {
    const file = new File(['%PDF-1.4'], name, { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: size });
    return file;
}
