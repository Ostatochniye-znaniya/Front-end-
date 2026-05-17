const mode = process.env.NEXT_PUBLIC_MODE || 'development';

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
};

export async function getUserStatus(): Promise<UserStatusResponse> {
    if (mode === 'development') {
        const mockStatus = 'teacher';
        return Promise.resolve({ status: mockStatus, verbose: statusMap[mockStatus] });
    }
    else {
        throw new Error('Заменить на настоящую реализацию получения статуса пользователя');
    }
}
