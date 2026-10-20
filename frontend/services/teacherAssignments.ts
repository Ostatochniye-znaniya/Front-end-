/**
 * Сервис страницы «Выбор преподавателей» (роль «Руководитель подразделения (заведующий кафедрой)»).
 *
 * Бэкенд: KnowledgeApp, TestingAssignmentController (ТЗ, пп. 2.5–2.6).
 * Зав. кафедрой задаёт период проверки и назначает преподавателей; дату и пару внутри периода
 * выбирает преподаватель, остальные назначенные подтверждают или отклоняют (TeacherWorkflow).
 *
 *   GET  /csh/api/Testing/department-testings           — проверки кафедры текущего пользователя
 *   GET  /csh/api/Testing/{id}/available-teachers        — преподаватели дисциплины
 *   PUT  /csh/api/Testing/{id}/teacher-assignments       — { periodStart, periodEnd, teacherIds }
 *   POST /csh/api/Testing/{id}/external-request          — заявка кафедре другого факультета
 *   GET  /csh/api/Testing/pair-slots                     — сетка пар
 *
 * Ошибки бэкенд отдаёт как { error }, его и показываем пользователю.
 */

const API_BASE_URL = '/csh/api/Testing';

/**
 * own — дисциплина кафедры своего факультета, назначаем сами;
 * outgoing — дисциплина кафедры другого факультета, нужна заявка, назначает та кафедра;
 * incoming — заявка от кафедры другого факультета по дисциплине нашей кафедры, назначаем мы.
 */
export type TestingKind = 'own' | 'outgoing' | 'incoming';

/** pending — ещё не выбрал/не ответил; approved — выбрал время или подтвердил; rejected — отклонил. */
export type TeacherAssignmentStatus = 'pending' | 'approved' | 'rejected';

export type TeacherAssignment = {
    teacherId: number;
    teacherName: string | null;
    status: TeacherAssignmentStatus;
    comment: string | null;
    respondedAt: string | null;
};

export type DepartmentTesting = {
    testingId: number;
    groupId: number;
    groupName: string;
    groupDepartmentName: string | null;
    groupFacultyName: string | null;
    disciplineId: number;
    disciplineName: string;
    disciplineDepartmentName: string | null;
    kind: TestingKind;
    canManage: boolean;
    externalRequestSentAt: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    scheduledDate: string | null;
    scheduledTime: string | null;
    scheduledPair: number | null;
    teachers: TeacherAssignment[];
};

export type AvailableTeacher = {
    teacherId: number;
    teacherName: string | null;
};

export type PairSlot = {
    pairNumber: number;
    startsAt: string;
    endsAt: string;
};

/** Текст ошибки из ответа бэкенда ({ error } или { title }) или запасной вариант. */
async function errorMessage(res: Response, fallback: string): Promise<string> {
    try {
        const body = (await res.json()) as { error?: string; title?: string } | null;
        if (body?.error) return body.error;
        if (body?.title) return body.title;
    } catch {
        // тело не JSON — используем запасной текст
    }
    return `${fallback} (код ${res.status})`;
}

async function request<T>(path: string, fallback: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, init);
    if (!res.ok) throw new Error(await errorMessage(res, fallback));
    return (await res.json()) as T;
}

export function getDepartmentTestings(): Promise<DepartmentTesting[]> {
    return request('/department-testings', 'Не удалось загрузить список проверок');
}

export function getAvailableTeachers(testingId: number): Promise<AvailableTeacher[]> {
    return request(`/${testingId}/available-teachers`, 'Не удалось загрузить преподавателей');
}

export function getPairSlots(): Promise<PairSlot[]> {
    return request('/pair-slots', 'Не удалось загрузить сетку пар');
}

/** Задаёт период проверки и заменяет список назначенных преподавателей. */
export async function saveTeacherAssignments(
    testingId: number,
    periodStart: string,
    periodEnd: string,
    teacherIds: number[],
): Promise<void> {
    await request(`/${testingId}/teacher-assignments`, 'Не удалось сохранить назначение', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart, periodEnd, teacherIds }),
    });
}

/** Заявка кафедре другого факультета; повторная отправка ничего не меняет. */
export async function sendExternalRequest(testingId: number): Promise<string> {
    const body = await request<{ externalRequestSentAt: string }>(
        `/${testingId}/external-request`,
        'Не удалось отправить заявку',
        { method: 'POST' },
    );
    return body.externalRequestSentAt;
}
