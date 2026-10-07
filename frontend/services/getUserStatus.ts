import { NEXT_PUBLIC_MODE } from '@/config';
import { getUserData } from './getUserData';

const mode = NEXT_PUBLIC_MODE;

export interface UserStatusResponse {
    status: string;
    verbose: string;
}

const statusMap: Record<string, string> = {
    'student': 'Студент',
    'teacher': 'Преподаватель',
    'admin': 'Администратор',
    'lpr': 'Лицо, принимающее решения',
    'hod': 'Заведующий кафедрой',
    'guest': 'Гость',
};

const reverseStatusMap: Record<string, string> = {
    'студент': 'student',
    'student': 'student',
    'преподаватель': 'teacher',
    'teacher': 'teacher',
    'администратор': 'admin',
    'admin': 'admin',
    'лицо, принимающее решения': 'lpr',
    'лпр': 'lpr',
    'lpr': 'lpr',
    'заведующий кафедрой': 'hod',
    'заведующий': 'hod',
    'hod': 'hod',
    'гость': 'guest',
    'guest': 'guest',
};

import { isAuthenticated } from '@/api/client';

export async function getUserStatus(): Promise<UserStatusResponse> {
    if (typeof window !== 'undefined') {
        const hasSession = isAuthenticated();
        if (!hasSession) {
            throw new Error('Пользователь не авторизован');
        }
    }

    try {
        const userData = await getUserData();
        const rawRole = (
            userData.roles?.[0] ||
            userData.role ||
            userData.status ||
            ''
        ).toString().trim().toLowerCase();

        const mappedStatus = reverseStatusMap[rawRole] || (rawRole in statusMap ? rawRole : null);
        if (mappedStatus) {
            return {
                status: mappedStatus,
                verbose: statusMap[mappedStatus] || userData.status || mappedStatus,
            };
        }

        if (userData.status) {
            return {
                status: 'teacher',
                verbose: userData.status,
            };
        }
    } catch {
        // Fallback если сервер недоступен или пользователь не авторизован
    }

    return { status: 'guest', verbose: statusMap['guest'] };
}
