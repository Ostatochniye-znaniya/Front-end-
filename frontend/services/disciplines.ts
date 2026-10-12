/**
 * Сервис страницы «Выбор дисциплин» (роль «Руководитель подразделения (заведующий кафедрой)»).
 *
 * Бэкенд: KnowledgeApp, GroupDisciplineController (ТЗ, п. 2.4).
 * Отдельной таблицы под выбор нет: на шаге 2.2 ЛПР выбирает группы, для них создаются
 * тестирования (testing) с группой и семестром, а здесь в них записываются дисциплины.
 *
 *   GET /csh/api/GroupDiscipline/GetGroups?departmentId=        — группы с выбранными дисциплинами
 *   GET /csh/api/GroupDiscipline/GetAvailableDisciplines/{id}   — дисциплины кафедры группы
 *   PUT /csh/api/GroupDiscipline/SetDisciplines/{id}            — { disciplineIds: number[] }, заменяет выбор
 *
 * Семестр не передаём: бэкенд берёт самый поздний.
 * Ошибки бэкенд отдаёт как { message }, его и показываем пользователю.
 */

const API_BASE_URL = '/csh/api/GroupDiscipline';

/** Верхняя граница по ТЗ; фактический лимит группы приходит с бэка (maxDisciplines). */
export const MAX_DISCIPLINES_PER_GROUP = 2;

export type Discipline = {
    id: number;
    name: string;
    departmentId: number | null;
};

export type DisciplineGroupRow = {
    id: number;
    group: string;
    faculty: string;
    department: string;
    spec: string;
    /** Сколько дисциплин можно выбрать (не больше двух и не больше числа тестирований группы). */
    maxDisciplines: number;
    disciplines: Discipline[];
};

type GroupDisciplinesResponse = {
    groupId: number;
    groupNumber: string;
    studyProgramName: string | null;
    departmentName: string | null;
    facultyName: string | null;
    maxDisciplines: number;
    disciplines: Discipline[];
};

/** Текст ошибки из ответа бэкенда ({ message }) или запасной вариант. */
async function errorMessage(res: Response, fallback: string): Promise<string> {
    try {
        const body = (await res.json()) as { message?: string } | null;
        if (body?.message) return body.message;
    } catch {
        // тело не JSON — используем запасной текст
    }
    return `${fallback} (код ${res.status})`;
}

/** Группы, выбранные для проверки в текущем семестре, со сводкой выбранных дисциплин. */
export async function getGroups(departmentId?: number): Promise<DisciplineGroupRow[]> {
    const query = departmentId ? `?departmentId=${departmentId}` : '';
    const res = await fetch(`${API_BASE_URL}/GetGroups${query}`);
    if (!res.ok) throw new Error(await errorMessage(res, 'Не удалось загрузить список групп'));

    const data = (await res.json()) as GroupDisciplinesResponse[];
    return data.map(g => ({
        id: g.groupId,
        group: g.groupNumber,
        faculty: g.facultyName ?? '—',
        department: g.departmentName ?? '—',
        spec: g.studyProgramName ?? '—',
        maxDisciplines: g.maxDisciplines,
        disciplines: g.disciplines,
    }));
}

/** Дисциплины, из которых заведующий кафедрой выбирает для группы. */
export async function getAvailableDisciplines(groupId: number): Promise<Discipline[]> {
    const res = await fetch(`${API_BASE_URL}/GetAvailableDisciplines/${groupId}`);
    if (!res.ok) throw new Error(await errorMessage(res, 'Не удалось загрузить список дисциплин'));
    return (await res.json()) as Discipline[];
}

/** Заменяет выбор дисциплин группы целиком. */
export async function saveGroupDisciplines(groupId: number, disciplineIds: number[]): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/SetDisciplines/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplineIds }),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Не удалось сохранить выбор'));
}
