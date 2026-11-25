import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import DocumentsPage from '@/app/dof/documents/page';
import type { ReportDocument, ScheduleDocument } from '@/services/documents';
import { captureDownloads, deferred, json, mockApi, pdf, text } from '@/tests/api';
import { makeReport, makeSchedule } from '@/tests/dofFixtures';
import { openDropdown, rowOf, selectOption } from '@/tests/ui';

const DEAN = '/csh/api/DeanDocuments';
const REPORTS = `GET ${DEAN}/GetReports`;
const SCHEDULES = `GET ${DEAN}/GetSchedules`;
const REPORT_FILTERS = `GET ${DEAN}/GetReportFilters`;
const SCHEDULE_FILTERS = `GET ${DEAN}/GetScheduleFilters`;

const STATUSES = [
    { value: 'pending', label: 'Ожидает подписи' },
    { value: 'signed', label: 'Подписан' },
    { value: 'rejected', label: 'Отклонён' },
];

let api: ReturnType<typeof mockApi>;
let user: ReturnType<typeof userEvent.setup>;
let reports: ReportDocument[];
let schedules: ScheduleDocument[];

beforeEach(() => {
    user = userEvent.setup();
    reports = [makeReport()];
    schedules = [makeSchedule()];
    api = mockApi();
    api.on(REPORTS, () => json(reports));
    api.on(SCHEDULES, () => json(schedules));
    api.on(REPORT_FILTERS, () =>
        json({
            departments: [{ value: '3', label: 'Кафедра ИБ' }],
            academicYears: [{ value: '2026/2027', label: '2026/2027' }],
            statuses: STATUSES,
        })
    );
    api.on(SCHEDULE_FILTERS, () =>
        json({
            semesters: [{ value: '2', label: 'год 2026, осенний семестр' }],
            statuses: STATUSES,
        })
    );
});

afterEach(() => {
    expect(api.unexpected).toEqual([]);
});

const loaded = () =>
    waitFor(() => expect(screen.queryByText('Загрузка…')).not.toBeInTheDocument());

async function renderReports() {
    render(<DocumentsPage />);
    await loaded();
}

async function renderSchedules() {
    await renderReports();
    await user.click(screen.getByRole('tab', { name: 'Графики ПОЗ' }));
    await loaded();
}

const button = (row: HTMLElement, name: string) => within(row).getByRole('button', { name });
const headers = () => screen.getAllByRole('columnheader').map((th) => th.textContent);
const cellTexts = (row: HTMLElement) =>
    within(row).getAllByRole('cell').map((cell) => cell.textContent);
const column = (index: number) =>
    screen.getAllByRole('row').slice(1).map((row) => cellTexts(row)[index]);

describe('вкладка отчётов', () => {
    it('открыта по умолчанию и показывает отчёты факультета', async () => {
        render(<DocumentsPage />);
        expect(screen.getByText('Загрузка…')).toBeInTheDocument();
        await loaded();

        expect(screen.getByRole('tab', { name: 'Отчёты преподавателей' })).toHaveAttribute('aria-selected', 'true');
        expect(api.calls(REPORTS).map((r) => r.query)).toEqual([{ facultyId: '1' }]);
        expect(api.calls(SCHEDULES)).toHaveLength(0);
        expect(headers()).toEqual([
            'Учебный год',
            'Код направления',
            'Номер группы',
            'Дисциплина',
            'ФИО преподавателя',
            'Электронный отчёт',
            'Бумажный отчёт',
            'Скачать',
            'Действия',
        ]);
        expect(cellTexts(rowOf('221-321')).slice(0, 7)).toEqual([
            '2026/2027',
            '09.03.01',
            '221-321',
            'Базы данных',
            'Иванов И.И.',
            'Ожидает подписи',
            'Не требуется',
        ]);
    });

    it('ставит прочерки вместо пустых полей', async () => {
        reports = [
            makeReport({
                academicYear: null,
                studyProgramCode: null,
                groupNumber: null,
                disciplineName: null,
                teacherName: null,
            }),
        ];
        await renderReports();

        expect(cellTexts(screen.getAllByRole('row')[1]).slice(0, 5)).toEqual(Array(5).fill('—'));
    });

    it.each([
        ['pending', 'capsule-warning', true],
        ['signed', 'capsule-success', false],
        ['rejected', 'capsule-danger', false],
        ['unknown', 'capsule-warning', false],
    ])('статус %s: цвет и доступность решения', async (status, capsule, enabled) => {
        reports = [makeReport({ status: status as ReportDocument['status'], statusLabel: 'Метка' })];
        await renderReports();
        const row = rowOf('221-321');

        expect(within(row).getByText('Метка').closest('.capsule')).toHaveClass(capsule);
        for (const name of ['Одобрить', 'Отклонить']) {
            expect((button(row, name) as HTMLButtonElement).disabled).toBe(!enabled);
        }
        expect(button(row, 'Скачать')).toBeEnabled();
    });

    it('сообщает об отсутствии документов', async () => {
        reports = [];
        await renderReports();

        expect(screen.getByText('Нет документов для отображения')).toBeInTheDocument();
    });

    it('показывает ошибку загрузки', async () => {
        api.on(REPORTS, () => json({ error: 'База недоступна' }, 500));
        await renderReports();

        expect(screen.getByText('База недоступна')).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
});

describe('вкладка графиков', () => {
    it('показывает графики факультета', async () => {
        await renderSchedules();

        expect(api.calls(SCHEDULES).map((r) => r.query)).toEqual([{ facultyId: '1' }]);
        expect(headers()).toEqual(['Период', 'Скачать', 'Действия', 'Статус']);
        expect(rowOf('в ноябре-декабре 2026 года')).toHaveTextContent('Ожидает подписи');
    });

    it('при возврате на отчёты загружает их заново', async () => {
        await renderSchedules();

        await user.click(screen.getByRole('tab', { name: 'Отчёты преподавателей' }));
        await loaded();

        expect(rowOf('221-321')).toBeInTheDocument();
        expect(api.calls(REPORTS)).toHaveLength(2);
    });

    it('опоздавший ответ отчётов не мешает вкладке графиков', async () => {
        const late = deferred<Response>();
        api.on(REPORTS, () => late.promise);
        render(<DocumentsPage />);
        await user.click(screen.getByRole('tab', { name: 'Графики ПОЗ' }));
        await loaded();

        await act(async () => late.resolve(json({ error: 'Поздняя ошибка' }, 500)));

        expect(rowOf('в ноябре-декабре 2026 года')).toBeInTheDocument();
        expect(screen.queryByText('Поздняя ошибка')).not.toBeInTheDocument();
    });
});

describe('фильтры', () => {
    it('добавляют вариант «любой» к значениям бэкенда', async () => {
        await renderReports();

        expect(await openDropdown(user, 'Кафедра')).toEqual(['Все кафедры', 'Кафедра ИБ']);
        expect(await openDropdown(user, 'Учебный год')).toEqual(['Все годы', '2026/2027']);
        expect(await openDropdown(user, 'Статус')).toEqual([
            'Любой статус',
            'Ожидает подписи',
            'Подписан',
            'Отклонён',
        ]);
    });

    it('отчёты: выбранные значения копятся в запросе и снимаются', async () => {
        await renderReports();

        await selectOption(user, 'Кафедра', 'Кафедра ИБ');
        await selectOption(user, 'Учебный год', '2026/2027');
        await selectOption(user, 'Статус', 'Подписан');
        await loaded();
        expect(api.calls(REPORTS).at(-1)?.query).toEqual({
            facultyId: '1',
            departmentId: '3',
            academicYear: '2026/2027',
            status: 'signed',
        });

        await selectOption(user, 'Кафедра', 'Все кафедры');
        await loaded();
        expect(api.calls(REPORTS).at(-1)?.query).not.toHaveProperty('departmentId');
    });

    it('графики: семестр и статус уходят в запрос', async () => {
        await renderSchedules();

        await selectOption(user, 'Семестр', 'год 2026, осенний семестр');
        await selectOption(user, 'Статус', 'Отклонён');
        await loaded();

        expect(api.calls(SCHEDULES).at(-1)?.query).toEqual({
            facultyId: '1',
            semesterId: '2',
            status: 'rejected',
        });
    });

    it('если значения не загрузились, остаётся «любой», а список работает', async () => {
        api.on(REPORT_FILTERS, () => text('', 500));
        await renderReports();

        expect(await openDropdown(user, 'Кафедра')).toEqual(['Все кафедры']);
        expect(rowOf('221-321')).toBeInTheDocument();
        expect(screen.queryByText(/Не удалось загрузить фильтры/)).not.toBeInTheDocument();
    });

    it('отбрасывает опоздавший ответ прежнего фильтра', async () => {
        const late = deferred<Response>();
        await renderReports();
        api.on(REPORTS, ({ query }) =>
            query.status === 'signed'
                ? late.promise
                : json([makeReport({ groupNumber: 'отклонённая' })])
        );
        await selectOption(user, 'Статус', 'Подписан');
        await selectOption(user, 'Статус', 'Отклонён');
        await screen.findByRole('cell', { name: 'отклонённая' });

        await act(async () => late.resolve(json([makeReport({ groupNumber: 'опоздавшая' })])));

        expect(screen.getByRole('cell', { name: 'отклонённая' })).toBeInTheDocument();
        expect(screen.queryByRole('cell', { name: 'опоздавшая' })).not.toBeInTheDocument();
    });
});

describe('решение по документу', () => {
    it.each([
        ['Одобрить', 'ApproveReport/1/approve', 'signed', 'Подписан', undefined],
        ['Отклонить', 'RejectReport/1/reject', 'rejected', 'Отклонён', { comment: null }],
    ] as const)('отчёт: %s', async (name, path, status, statusLabel, body) => {
        await renderReports();
        const updated = makeReport({ status, statusLabel });
        api.on(`POST ${DEAN}/${path}`, () => {
            reports = [updated];
            return json(updated);
        });

        await user.click(button(rowOf('221-321'), name));

        await waitFor(() => expect(rowOf('221-321')).toHaveTextContent(statusLabel));
        expect(api.calls(`POST ${DEAN}/${path}`).map((r) => r.body)).toEqual([body]);
        await waitFor(() => expect(api.calls(REPORTS)).toHaveLength(2));
        expect(button(rowOf('221-321'), 'Одобрить')).toBeDisabled();
    });

    it.each([
        ['Одобрить', 'ApproveSchedule/1/approve', 'signed', 'Подписан'],
        ['Отклонить', 'RejectSchedule/1/reject', 'rejected', 'Отклонён'],
    ] as const)('график: %s', async (name, path, status, statusLabel) => {
        await renderSchedules();
        const updated = makeSchedule({ status, statusLabel });
        api.on(`POST ${DEAN}/${path}`, () => {
            schedules = [updated];
            return json(updated);
        });

        await user.click(button(rowOf('в ноябре-декабре 2026 года'), name));

        await waitFor(() =>
            expect(rowOf('в ноябре-декабре 2026 года')).toHaveTextContent(statusLabel)
        );
        await waitFor(() => expect(api.calls(SCHEDULES)).toHaveLength(2));
    });

    it('пока запрос идёт, кнопки этой строки заблокированы, соседней — нет', async () => {
        reports = [makeReport({ id: 1, groupNumber: 'А' }), makeReport({ id: 2, groupNumber: 'Б' })];
        await renderReports();
        const response = deferred<Response>();
        api.on(`POST ${DEAN}/ApproveReport/1/approve`, () => response.promise);

        fireEvent.click(button(rowOf('А'), 'Одобрить'));

        for (const name of ['Одобрить', 'Отклонить', 'Скачать']) {
            expect(button(rowOf('А'), name)).toBeDisabled();
            expect(button(rowOf('Б'), name)).toBeEnabled();
        }
        await act(async () => response.resolve(json(makeReport({ id: 1, groupNumber: 'А' }))));
    });

    it('статус из ответа виден ещё до перечитывания, таблица не прячется', async () => {
        await renderReports();
        const reload = deferred<Response>();
        api.on(REPORTS, () => reload.promise);
        api.on(`POST ${DEAN}/ApproveReport/1/approve`, () =>
            json(makeReport({ status: 'signed', statusLabel: 'Подписан' }))
        );

        await user.click(button(rowOf('221-321'), 'Одобрить'));

        await waitFor(() => expect(rowOf('221-321')).toHaveTextContent('Подписан'));
        expect(button(rowOf('221-321'), 'Одобрить')).toBeDisabled();
        expect(screen.queryByText('Загрузка…')).not.toBeInTheDocument();
        await act(async () => reload.resolve(json(reports)));
    });

    it('строки остаются на местах, новые документы встают в конец', async () => {
        reports = ['А', 'Б', 'В'].map((groupNumber, i) => makeReport({ id: i + 1, groupNumber }));
        await renderReports();
        api.on(`POST ${DEAN}/ApproveReport/1/approve`, () => {
            const signed = { ...reports[0], status: 'signed' as const, statusLabel: 'Подписан' };
            reports = [makeReport({ id: 4, groupNumber: 'Новая' }), reports[2], reports[1], signed];
            return json(signed);
        });

        await user.click(button(rowOf('А'), 'Одобрить'));

        await screen.findByRole('cell', { name: 'Новая' });
        expect(column(2)).toEqual(['А', 'Б', 'В', 'Новая']);
    });

    it('смена фильтра после решения возвращает порядок бэкенда', async () => {
        reports = ['А', 'Б'].map((groupNumber, i) => makeReport({ id: i + 1, groupNumber }));
        await renderReports();
        api.on(`POST ${DEAN}/ApproveReport/1/approve`, () => {
            reports = [reports[1], { ...reports[0], status: 'signed', statusLabel: 'Подписан' }];
            return json(reports[1]);
        });
        await user.click(button(rowOf('А'), 'Одобрить'));
        await waitFor(() => expect(api.calls(REPORTS)).toHaveLength(2));
        expect(column(2)).toEqual(['А', 'Б']);

        await selectOption(user, 'Кафедра', 'Кафедра ИБ');
        await loaded();

        expect(column(2)).toEqual(['Б', 'А']);
    });

    it('при ошибке показывает её, не меняет строку и разрешает повтор', async () => {
        await renderReports();
        api.on(`POST ${DEAN}/ApproveReport/1/approve`, () =>
            json({ error: 'Отчёт уже рассмотрен' }, 409)
        );

        await user.click(button(rowOf('221-321'), 'Одобрить'));

        expect(await screen.findByText('Отчёт уже рассмотрен')).toBeInTheDocument();
        expect(rowOf('221-321')).toHaveTextContent('Ожидает подписи');
        expect(button(rowOf('221-321'), 'Одобрить')).toBeEnabled();
        expect(api.calls(REPORTS)).toHaveLength(1);
    });

    it('действие в другой строке не снимает блокировку с ожидающей', async () => {
        reports = [makeReport({ id: 1, groupNumber: 'А' }), makeReport({ id: 2, groupNumber: 'Б' })];
        await renderReports();
        captureDownloads();
        api.on(`POST ${DEAN}/ApproveReport/1/approve`, () => new Promise<Response>(() => {}));
        api.on(`GET ${DEAN}/DownloadReport/2`, () => pdf());
        fireEvent.click(button(rowOf('А'), 'Одобрить'));

        fireEvent.click(button(rowOf('Б'), 'Скачать'));
        await waitFor(() => expect(button(rowOf('Б'), 'Скачать')).toBeEnabled());

        expect(button(rowOf('А'), 'Одобрить')).toBeDisabled();
    });

    it('пока запрос идёт, кнопки графика заблокированы', async () => {
        await renderSchedules();
        const response = deferred<Response>();
        api.on(`POST ${DEAN}/ApproveSchedule/1/approve`, () => response.promise);
        const row = rowOf('в ноябре-декабре 2026 года');

        fireEvent.click(button(row, 'Одобрить'));

        for (const name of ['Одобрить', 'Отклонить', 'Скачать']) {
            expect(button(row, name)).toBeDisabled();
        }
        await act(async () => response.resolve(json(makeSchedule())));
        await waitFor(() => expect(button(row, 'Скачать')).toBeEnabled());
    });

    it('действие над отчётом не блокирует график с тем же id', async () => {
        await renderReports();
        const response = deferred<Response>();
        api.on(`POST ${DEAN}/ApproveReport/1/approve`, () => response.promise);
        fireEvent.click(button(rowOf('221-321'), 'Одобрить'));

        await user.click(screen.getByRole('tab', { name: 'Графики ПОЗ' }));
        await loaded();

        expect(button(rowOf('в ноябре-декабре 2026 года'), 'Одобрить')).toBeEnabled();
        await act(async () => response.resolve(json(makeReport({ status: 'signed' }))));
    });
});

describe('бумажный отчёт', () => {
    const PAPER = `PUT ${DEAN}/SetPaperDelivery/1/paper-delivery`;

    it.each([
        ['not_required', 'capsule-default'],
        ['pending', 'capsule-warning'],
        ['submitted', 'capsule-success'],
    ] as const)('цвет статуса %s', async (paperStatus, capsule) => {
        reports = [makeReport({ paperStatus, paperStatusLabel: 'Бумага' })];
        await renderReports();

        expect(screen.getByText('Бумага').closest('.capsule')).toHaveClass(capsule);
    });

    it.each(['pending', 'rejected'] as const)(
        'для статуса %s отметить сдачу нельзя',
        async (status) => {
            reports = [makeReport({ status })];
            await renderReports();

            expect(screen.queryByRole('button', { name: /отмет/i })).not.toBeInTheDocument();
        }
    );

    it('отметка ставится и снимается', async () => {
        reports = [
            makeReport({ status: 'signed', paperStatus: 'pending', paperStatusLabel: 'Ожидается' }),
        ];
        api.on(PAPER, ({ body }) => {
            const { submitted } = body as { submitted: boolean };
            reports = [
                makeReport({
                    status: 'signed',
                    paperStatus: submitted ? 'submitted' : 'pending',
                    paperStatusLabel: submitted ? 'Сдан' : 'Ожидается',
                }),
            ];
            return json(reports[0]);
        });
        await renderReports();

        await user.click(screen.getByRole('button', { name: 'Отметить сданным' }));
        await user.click(await screen.findByRole('button', { name: 'Отменить отметку' }));

        expect(await screen.findByRole('button', { name: 'Отметить сданным' })).toBeInTheDocument();
        expect(api.calls(PAPER).map((r) => r.body)).toEqual([
            { submitted: true },
            { submitted: false },
        ]);
    });
});

describe('скачивание', () => {
    it('отчёт скачивается без перечитывания списка', async () => {
        const downloads = captureDownloads();
        api.on(`GET ${DEAN}/DownloadReport/1`, () => pdf());
        await renderReports();

        await user.click(button(rowOf('221-321'), 'Скачать'));

        await waitFor(() => expect(downloads).toEqual(['Отчёт_1.pdf']));
        expect(api.calls(REPORTS)).toHaveLength(1);
    });

    it('график скачивается без перечитывания списка', async () => {
        const downloads = captureDownloads();
        api.on(`GET ${DEAN}/DownloadSchedule/1`, () => pdf());
        await renderSchedules();

        await user.click(button(rowOf('в ноябре-декабре 2026 года'), 'Скачать'));

        await waitFor(() => expect(downloads).toEqual(['График_ПОЗ.pdf']));
        expect(api.calls(SCHEDULES)).toHaveLength(1);
    });

    it('показывает ошибку скачивания и снимает блокировку', async () => {
        api.on(`GET ${DEAN}/DownloadReport/1`, () => json({ error: 'Файл не найден' }, 404));
        await renderReports();

        await user.click(button(rowOf('221-321'), 'Скачать'));

        expect(await screen.findByText('Файл не найден')).toBeInTheDocument();
        expect(button(rowOf('221-321'), 'Скачать')).toBeEnabled();
    });
});
