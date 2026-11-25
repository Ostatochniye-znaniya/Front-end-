import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import SchedulePage from '@/app/dof/schedule/page';
import { captureDownloads, deferred, json, mockApi, mockXhr, pdf, text } from '@/tests/api';
import { makePdf, makeSchedule, makeScheduleRow } from '@/tests/dofFixtures';
import { openDropdown, rowOf, selectOption } from '@/tests/ui';

const SEMESTERS = 'GET /csh/api/Semester/GetSemesters';
const SCHEDULE = 'GET /csh/api/ScheduleApi/GetSchedule';
const PDF = 'GET /csh/api/ScheduleApi/DownloadPdf';
const CURRENT = 'GET /csh/api/ScheduleDocument/GetCurrent';

const AUTUMN = 'год 2026, осенний семестр';
const SPRING = 'год 2026, весенний семестр';

let api: ReturnType<typeof mockApi>;
let xhrs: ReturnType<typeof mockXhr>;
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
    user = userEvent.setup();
    api = mockApi();
    xhrs = mockXhr();
    api.on(SEMESTERS, () =>
        json([
            { id: 1, semesterYear: 2026, semesterPart: 1 },
            { id: 2, semesterYear: 2026, semesterPart: 2 },
        ])
    );
    api.on(SCHEDULE, () => json([makeScheduleRow()]));
    api.on(CURRENT, () => text('null'));
});

afterEach(() => {
    expect(api.unexpected).toEqual([]);
});

async function renderPage() {
    render(<SchedulePage />);
    await waitFor(() => expect(screen.queryByText('Загрузка…')).not.toBeInTheDocument());
}

async function renderWithSemester(label = AUTUMN) {
    await renderPage();
    await selectOption(user, 'Семестр', label);
    await waitFor(() => expect(screen.queryByText('Загрузка…')).not.toBeInTheDocument());
}

const dropzone = () => screen.getByText(/Перетащите сюда PDF|Отправляем файл/).closest('div')!;
const drop = (file: File) => fireEvent.drop(dropzone(), { dataTransfer: { files: [file] } });

const bodyRows = () => screen.getAllByRole('row').slice(1);
const cellTexts = (row: HTMLElement) =>
    within(row).getAllByRole('cell').map((cell) => cell.textContent);

describe('таблица графика', () => {
    it('показывает загрузку, затем строки с колонками как в PDF', async () => {
        render(<SchedulePage />);
        expect(screen.getByText('Загрузка…')).toBeInTheDocument();

        await screen.findByRole('table');

        expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
            '№',
            'Группа',
            'Наименование профиля подготовки',
            'Наименование дисциплины',
            'Институт / школа',
            'Кафедра',
            'ФИО ППС',
            'Дата и время',
            'Аудитория',
        ]);
        expect(cellTexts(bodyRows()[0])).toEqual([
            '1',
            '221-321',
            'Веб-технологии',
            'Базы данных',
            'ФИТ',
            'Информационная безопасность',
            'Иванов И.И.',
            '10.11.2026, 10:00',
            'Пр-2201',
        ]);
    });

    it('объединяет ячейки группы и нумерует группы, а не строки', async () => {
        api.on(SCHEDULE, () =>
            json([
                makeScheduleRow({ id: 1, groupName: 'А', disciplineName: 'Физика' }),
                makeScheduleRow({ id: 2, groupName: 'А', disciplineName: 'Химия', time: '12:00:00' }),
                makeScheduleRow({ id: 3, groupName: 'Б', disciplineName: 'История' }),
            ])
        );
        await renderPage();

        const [first, second, third] = bodyRows();
        for (const cell of within(first).getAllByRole('cell').slice(0, 3)) {
            expect(cell).toHaveAttribute('rowspan', '2');
        }
        expect(cellTexts(second)[0]).toBe('Химия');
        expect(cellTexts(third).slice(0, 2)).toEqual(['2', 'Б']);
    });

    it('аудитория важнее LMS; LMS — ссылка, если она есть, иначе текст', async () => {
        api.on(SCHEDULE, () =>
            json([
                makeScheduleRow({ id: 1, groupName: 'А', room: 'Пр-1', lmsUrl: 'https://lms.test/1' }),
                makeScheduleRow({ id: 2, groupName: 'Б', room: null, lmsUrl: 'https://lms.test/2' }),
                makeScheduleRow({ id: 3, groupName: 'В', room: null, lmsUrl: null }),
            ])
        );
        await renderPage();

        expect(cellTexts(rowOf('А')).at(-1)).toBe('Пр-1');
        const link = within(rowOf('Б')).getByRole('link', { name: 'LMS' });
        expect(link).toHaveAttribute('href', 'https://lms.test/2');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(cellTexts(rowOf('В')).at(-1)).toBe('LMS');
        expect(screen.getAllByRole('link')).toHaveLength(1);
    });

    it('сообщает об отсутствии данных', async () => {
        api.on(SCHEDULE, () => json([]));
        await renderPage();

        expect(screen.getByText('Нет данных для отображения')).toBeInTheDocument();
    });

    it('показывает ошибку загрузки графика', async () => {
        api.on(SCHEDULE, () => json({ error: 'База недоступна' }, 500));
        await renderPage();

        expect(screen.getByText('База недоступна')).toBeInTheDocument();
    });

    it('показывает ошибку загрузки семестров, не теряя таблицу', async () => {
        api.on(SEMESTERS, () => text('', 500));
        await renderPage();

        expect(
            await screen.findByText('Не удалось загрузить список семестров (HTTP 500)')
        ).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });
});

describe('фильтр по семестру', () => {
    it('предлагает все семестры от свежих к старым', async () => {
        await renderPage();

        expect(await openDropdown(user, 'Семестр')).toEqual(['Все семестры', AUTUMN, SPRING]);
    });

    it('без выбора запрашивает все семестры и не запрашивает документ', async () => {
        await renderPage();

        expect(api.calls(SCHEDULE).map((r) => r.query)).toEqual([
            { facultyId: '1', semesterId: '0' },
        ]);
        expect(api.calls(CURRENT)).toHaveLength(0);
        expect(screen.queryByText(/График проверки остаточных знаний/)).not.toBeInTheDocument();
    });

    it('после выбора перечитывает график и документ, показывает период в заголовке', async () => {
        await renderWithSemester();

        expect(api.calls(SCHEDULE).at(-1)?.query.semesterId).toBe('2');
        expect(api.calls(CURRENT).map((r) => r.query)).toEqual([{ semesterId: '2' }]);
        expect(
            screen.getByText('График проверки остаточных знаний в ноябре-декабре 2026 года')
        ).toBeInTheDocument();
    });

    it('отбрасывает опоздавший ответ прежнего семестра', async () => {
        const late = deferred<Response>();
        api.on(SCHEDULE, ({ query }) =>
            query.semesterId === '2'
                ? late.promise
                : json([makeScheduleRow({ groupName: `семестр ${query.semesterId}` })])
        );
        await renderPage();
        await selectOption(user, 'Семестр', AUTUMN);
        await selectOption(user, 'Семестр', SPRING);
        await screen.findByRole('cell', { name: 'семестр 1' });

        await act(async () => late.resolve(json([makeScheduleRow({ groupName: 'опоздавшая' })])));

        expect(screen.getByRole('cell', { name: 'семестр 1' })).toBeInTheDocument();
        expect(screen.queryByRole('cell', { name: 'опоздавшая' })).not.toBeInTheDocument();
    });
});

describe('пагинация', () => {
    const manyGroups = (count: number) =>
        Array.from({ length: count }, (_, i) => i + 1).flatMap((n) => {
            const groupName = `гр-${String(n).padStart(2, '0')}`;
            return [
                makeScheduleRow({ id: n * 10, groupName }),
                makeScheduleRow({ id: n * 10 + 1, groupName, time: '12:00:00' }),
            ];
        });

    it('режет по пять групп, не разрывая группу, и продолжает нумерацию', async () => {
        api.on(SCHEDULE, () => json(manyGroups(6)));
        await renderPage();
        expect(bodyRows()).toHaveLength(10);
        expect(screen.queryByRole('cell', { name: 'гр-06' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: '2' }));

        expect(bodyRows()).toHaveLength(2);
        expect(cellTexts(rowOf('гр-06')).slice(0, 2)).toEqual(['6', 'гр-06']);
    });

    it('при ровно пяти группах одна страница', async () => {
        api.on(SCHEDULE, () => json(manyGroups(5)));
        await renderPage();

        expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
    });

    it('возвращается на первую страницу при смене семестра', async () => {
        api.on(SCHEDULE, () => json(manyGroups(6)));
        await renderPage();
        await user.click(screen.getByRole('button', { name: '2' }));

        await selectOption(user, 'Семестр', AUTUMN);

        expect(await screen.findByRole('cell', { name: 'гр-01' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '1' })).toHaveClass('active');
    });
});

describe('скачивание PDF', () => {
    it('скачивает график выбранного семестра и блокирует кнопку на время формирования', async () => {
        const downloads = captureDownloads();
        const response = deferred<Response>();
        api.on(PDF, () => response.promise);
        await renderWithSemester();

        fireEvent.click(screen.getByRole('button', { name: 'Скачать PDF' }));
        expect(screen.getByRole('button', { name: 'Формируется…' })).toBeDisabled();

        await act(async () => response.resolve(pdf('attachment; filename="plan.pdf"')));
        expect(await screen.findByRole('button', { name: 'Скачать PDF' })).toBeEnabled();
        expect(downloads).toEqual(['plan.pdf']);
        expect(api.calls(PDF)[0].query).toEqual({ facultyId: '1', semesterId: '2' });
    });

    it('показывает ошибку, оставляя таблицу и кнопку рабочими', async () => {
        api.on(PDF, () => json({ error: 'Нет данных для формирования отчета' }, 400));
        await renderPage();

        await user.click(screen.getByRole('button', { name: 'Скачать PDF' }));

        expect(await screen.findByText('Нет данных для формирования отчета')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Скачать PDF' })).toBeEnabled();
    });
});

describe('отправка на подпись', () => {
    it('без выбранного семестра зона отключена', async () => {
        await renderPage();

        expect(dropzone()).toHaveAttribute('aria-disabled', 'true');
        expect(
            screen.getByText('Выберите конкретный семестр, чтобы отправить график')
        ).toBeInTheDocument();
        drop(makePdf());
        expect(xhrs).toHaveLength(0);
    });

    it('отправляет файл, показывает прогресс и статус документа', async () => {
        await renderWithSemester();

        drop(makePdf());
        await screen.findByText('Отправляем файл…');
        expect(dropzone()).toHaveAttribute('aria-disabled', 'true');
        expect(xhrs[0].form?.get('semesterId')).toBe('2');

        act(() => xhrs[0].progress(1, 2));
        expect(document.querySelector('.upload-progress-bar')).toHaveStyle({ width: '50%' });

        await act(async () => xhrs[0].respond(200, makeSchedule()));
        expect(await screen.findByText('график.pdf')).toBeInTheDocument();
        expect(screen.getByText('Ожидает подписи').closest('.capsule')).toHaveClass('capsule-warning');
        expect(document.querySelector('.upload-progress')).toBeNull();
        expect(dropzone()).toHaveAttribute('aria-disabled', 'false');
    });

    it('не отправляет неподходящий файл', async () => {
        await renderWithSemester();

        drop(makePdf('график.docx'));

        expect(await screen.findByText('Можно загрузить только PDF-файл')).toBeInTheDocument();
        expect(xhrs).toHaveLength(0);
    });

    it('показывает ошибку бэкенда и убирает её при следующей попытке', async () => {
        await renderWithSemester();

        drop(makePdf());
        await act(async () => xhrs[0].respond(409, { error: 'График уже подписан' }));
        expect(await screen.findByText('График уже подписан')).toBeInTheDocument();
        expect(dropzone()).toHaveAttribute('aria-disabled', 'false');

        drop(makePdf());
        expect(screen.queryByText('График уже подписан')).not.toBeInTheDocument();
    });
});

describe('ранее отправленный график', () => {
    it.each([
        ['pending', 'Ожидает подписи', 'capsule-warning', 'false'],
        ['signed', 'Подписан', 'capsule-success', 'true'],
        ['rejected', 'Отклонён', 'capsule-danger', 'false'],
    ] as const)('статус %s', async (status, statusLabel, capsule, disabled) => {
        api.on(CURRENT, () => json(makeSchedule({ status, statusLabel })));
        await renderWithSemester();

        expect((await screen.findByText(statusLabel)).closest('.capsule')).toHaveClass(capsule);
        expect(dropzone()).toHaveAttribute('aria-disabled', disabled);
    });

    it('подписанный график заменить нельзя', async () => {
        api.on(CURRENT, () => json(makeSchedule({ status: 'signed', statusLabel: 'Подписан' })));
        await renderWithSemester();

        expect(
            await screen.findByText('График на этот семестр уже подписан деканом')
        ).toBeInTheDocument();
        drop(makePdf());
        expect(xhrs).toHaveLength(0);
    });

    it('показывает комментарий декана', async () => {
        api.on(CURRENT, () =>
            json(makeSchedule({ status: 'rejected', statusLabel: 'Отклонён', reviewComment: 'Нет печати' }))
        );
        await renderWithSemester();

        expect(await screen.findByText('Комментарий декана: Нет печати')).toBeInTheDocument();
    });

    it('молчит про 404, но показывает остальные ошибки', async () => {
        api.on(CURRENT, ({ query }) => text('', query.semesterId === '2' ? 404 : 500));
        await renderWithSemester(AUTUMN);
        expect(screen.queryByText(/Не удалось получить статус графика/)).not.toBeInTheDocument();

        await selectOption(user, 'Семестр', SPRING);
        expect(
            await screen.findByText('Не удалось получить статус графика (HTTP 500)')
        ).toBeInTheDocument();
    });

    it('сбрасывает документ сразу при смене семестра, не дожидаясь ответа', async () => {
        const next = deferred<Response>();
        api.on(CURRENT, ({ query }) =>
            query.semesterId === '2' ? json(makeSchedule()) : next.promise
        );
        await renderWithSemester(AUTUMN);
        await screen.findByText('график.pdf');

        await selectOption(user, 'Семестр', SPRING);

        expect(screen.queryByText('график.pdf')).not.toBeInTheDocument();
        await act(async () => next.resolve(text('null')));
    });
});

describe('смена семестра во время отправки файла', () => {
    async function uploadAndSwitch() {
        await renderWithSemester(AUTUMN);
        drop(makePdf());
        await screen.findByText('Отправляем файл…');
        await selectOption(user, 'Семестр', SPRING);
        await waitFor(() => expect(screen.queryByText('Загрузка…')).not.toBeInTheDocument());
    }

    it('документ прежнего семестра не появляется у нового', async () => {
        await uploadAndSwitch();

        await act(async () => xhrs[0].respond(200, makeSchedule()));

        expect(screen.queryByText('график.pdf')).not.toBeInTheDocument();
    });

    it('прогресс прежней загрузки не появляется у нового семестра', async () => {
        await uploadAndSwitch();

        act(() => xhrs[0].progress(1, 2));

        expect(screen.queryByText('Отправляем файл…')).not.toBeInTheDocument();
    });

    it('ошибка прежней загрузки не появляется у нового семестра', async () => {
        await uploadAndSwitch();

        await act(async () => xhrs[0].respond(500, { error: 'Хранилище недоступно' }));

        expect(screen.queryByText('Хранилище недоступно')).not.toBeInTheDocument();
    });

    it('завершение прежней загрузки не прерывает загрузку нового семестра', async () => {
        await uploadAndSwitch();
        drop(makePdf());
        act(() => xhrs[1].progress(1, 4));

        await act(async () => xhrs[0].respond(200, makeSchedule()));

        expect(xhrs[1].form?.get('semesterId')).toBe('1');
        expect(document.querySelector('.upload-progress-bar')).toHaveStyle({ width: '25%' });
    });

    it('после возврата к прежнему семестру итог его загрузки виден', async () => {
        await uploadAndSwitch();
        await selectOption(user, 'Семестр', AUTUMN);
        await waitFor(() => expect(screen.queryByText('Загрузка…')).not.toBeInTheDocument());

        await act(async () => xhrs[0].respond(200, makeSchedule()));

        expect(screen.getByText('график.pdf')).toBeInTheDocument();
    });
});
