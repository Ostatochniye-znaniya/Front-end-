export interface TechLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  service: string;
  message: string;
  traceId: string;
  details?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  previousState: string;
  newState: string;
  reason?: string;
}

export interface ProcessItem {
  id: string;
  processName: string;
  group: string;
  subject: string;
  teacher: string;
  department: string;
  status: 'Согласовано' | 'На согласовании' | 'Отклонено' | 'Срок истёк';
  scheduledDate: string;
  scheduledTime: string;
  isLocked: boolean;
  reportStatus: 'Не сдан' | 'Электронный сдан' | 'Бумажный сдан' | 'Подписан';
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'Администратор' | 'ЛПР' | 'Заведующий кафедрой' | 'Заместитель заведующего кафедрой' | 'Преподаватель' | 'Гость / Без роли';
  permissions: string[];
  status: 'active' | 'pending' | 'deactivated';
  lastLogin: string;
}

export interface SystemSettings {
  supportEmail: string;
  welcomeGuestText: string;
  accessRequestInstructions: string;
  notificationTemplate: string;
  autoLockDaysAfterExam: number;
  maintenanceMode: boolean;
  requireReasonForOverrides: boolean;
}

export const initialTechLogs: TechLog[] = [
  {
    id: "LOG-9281",
    timestamp: "2026-09-30 14:41:03",
    level: "error",
    service: "Report Generator",
    message: "PDFGenerationException: Не удалось сформировать итоговую ведомость для группы 221-111",
    traceId: "tr-9281-a7b2-cf01",
    details: "PdfRenderer.RenderDocument() -> Timeout waiting for Chromium rasterization pool. ExitCode 137. Subprocess killed by OOM protector."
  },
  {
    id: "LOG-9280",
    timestamp: "2026-09-30 14:35:19",
    level: "warning",
    service: "1C Integration",
    message: "ExternalSyncWarning: Время ответа шлюза 1C:Университет превысило лимит (3420 ms)",
    traceId: "tr-9280-c1e4-88aa",
    details: "GET /api/v2/disciplines/sync HTTP/1.1 -> Response time 3420ms > threshold 2000ms. Non-blocking fallback cache retained."
  },
  {
    id: "LOG-9279",
    timestamp: "2026-09-30 14:28:44",
    level: "error",
    service: "Auth Service",
    message: "TokenVerificationFailed: Истёкший срок действия SSO-сертификата провайдера identity.mospolytech.ru",
    traceId: "tr-9279-bb11-40ef",
    details: "JWTSecurityTokenExpired: ValidTo 2026-09-30T11:00:00Z. Client redirected to token renewal."
  },
  {
    id: "LOG-9278",
    timestamp: "2026-09-30 14:12:02",
    level: "info",
    service: "Schedule Worker",
    message: "CronTaskExecuted: Завершена автоматическая фиксация дат для 14 групп (окончание периода согласования)",
    traceId: "tr-9278-d4a9-7711",
    details: "Cron: autoLockScheduleJob processed 14 records in 124ms. Transitioned status to 'Согласовано'."
  },
  {
    id: "LOG-9277",
    timestamp: "2026-09-30 13:58:30",
    level: "warning",
    service: "Backend API",
    message: "RateLimitApproaching: Учебно-методический отдел отправил более 120 запросов ведомостей за 1 мин",
    traceId: "tr-9277-fe83-90bc",
    details: "Client IP 10.12.4.91 consumed 120/150 requests from quota window."
  },
  {
    id: "LOG-9276",
    timestamp: "2026-09-30 13:30:11",
    level: "error",
    service: "Backend API",
    message: "DatabaseDeadlock: Разрешена коллизия блокировок транзакций при сохранении оценки комиссии",
    traceId: "tr-9276-88a2-1133",
    details: "NpgsqlException: 40P01 deadlock detected on table 'student_grades'. Process 4108 was retried and succeeded."
  },
  {
    id: "LOG-9275",
    timestamp: "2026-09-30 12:45:00",
    level: "info",
    service: "Notification Bus",
    message: "EmailBatchDispatched: Разослано 24 уведомления преподавателям о начале сдачи отчетов",
    traceId: "tr-9275-aa33-5599",
    details: "SMTP relay smtp.mospolytech.ru delivered 24 messages with 0 bounce errors."
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: "AUD-5104",
    timestamp: "2026-09-30 14:32:10",
    user: "Смирнов А. В. (Администратор)",
    role: "Администратор",
    action: "Административный перенос даты",
    entity: "Группа 221-111 / Сети и телекоммуникации",
    previousState: "Дата: 15.06.2026 12:20 (Согласовано, заблокировано)",
    newState: "Дата: 19.06.2026 14:00 (Согласовано, заблокировано)",
    reason: "Служебная записка зам. декана № 84-ИТ: наложение расписания аудитории 1302"
  },
  {
    id: "AUD-5103",
    timestamp: "2026-09-30 13:50:00",
    user: "Смирнов А. В. (Администратор)",
    role: "Администратор",
    action: "Назначение роли пользователю",
    entity: "Сидорова Е. Н. (sidorova@mospolytech.ru)",
    previousState: "Роль: Гость / Без роли, permissions: none",
    newState: "Роль: Преподаватель, permissions: [schedule:view, reports:submit]",
    reason: "Приказ о приёме на работу преподавателя на кафедру ИТ"
  },
  {
    id: "AUD-5102",
    timestamp: "2026-09-30 11:20:15",
    user: "Кузнецов П. С. (ЛПР)",
    role: "ЛПР",
    action: "Согласование графика тестирования",
    entity: "Кафедра Информационных технологий (6 групп)",
    previousState: "Статус: На согласовании",
    newState: "Статус: Согласовано",
    reason: "План мероприятий кафедры утверждён"
  },
  {
    id: "AUD-5101",
    timestamp: "2026-09-30 10:14:40",
    user: "Иванов И. И. (Преподаватель)",
    role: "Преподаватель",
    action: "Загрузка электронного отчета",
    entity: "Отчёт проверки остаточных знаний № 221-111-СТ",
    previousState: "Статус: Не сдан",
    newState: "Статус: Электронный сдан",
    reason: "Плановая сдача результатов ведомости"
  },
  {
    id: "AUD-5100",
    timestamp: "2026-09-29 17:05:22",
    user: "Смирнов А. В. (Администратор)",
    role: "Администратор",
    action: "Деактивация пользователя",
    entity: "Ковалёв М. Ю. (kovalev@mospolytech.ru)",
    previousState: "Статус: Активен, Роль: Преподаватель",
    newState: "Статус: Деактивирован (сохранение в аудите)",
    reason: "Увольнение сотрудника, сохранение всех созданных отчетов в истории"
  },
  {
    id: "AUD-5099",
    timestamp: "2026-09-29 15:40:00",
    user: "Смирнов А. В. (Администратор)",
    role: "Администратор",
    action: "Предварительная регистрация",
    entity: "volkov.dean@mospolytech.ru",
    previousState: "Запись отсутствовала",
    newState: "Ожидание входа, назначена роль: Заведующий кафедрой",
    reason: "Новое назначение зав. кафедрой 'Сетевые технологии'"
  }
];

export const initialProcesses: ProcessItem[] = [
  {
    id: "PROC-101",
    processName: "Проверка остаточных знаний (весенний семестр)",
    group: "221-111",
    subject: "Сети и телекоммуникации",
    teacher: "Иванов И. И.",
    department: "Информационные технологии",
    status: "Согласовано",
    scheduledDate: "15.06.2026",
    scheduledTime: "12:20",
    isLocked: true,
    reportStatus: "Электронный сдан"
  },
  {
    id: "PROC-102",
    processName: "Проверка остаточных знаний (весенний семестр)",
    group: "221-111",
    subject: "Back-end разработка",
    teacher: "Петров В. А.",
    department: "Информационные технологии",
    status: "Согласовано",
    scheduledDate: "18.06.2026",
    scheduledTime: "10:40",
    isLocked: true,
    reportStatus: "Не сдан"
  },
  {
    id: "PROC-103",
    processName: "Проверка остаточных знаний (весенний семестр)",
    group: "221-112",
    subject: "Базы данных и SQL",
    teacher: "Сидорова Е. Н.",
    department: "Информационные технологии",
    status: "На согласовании",
    scheduledDate: "20.06.2026",
    scheduledTime: "14:00",
    isLocked: false,
    reportStatus: "Не сдан"
  },
  {
    id: "PROC-104",
    processName: "Проверка остаточных знаний (весенний семестр)",
    group: "211-321",
    subject: "Операционные системы",
    teacher: "Михайлов К. Д.",
    department: "Вычислительная техника",
    status: "Отклонено",
    scheduledDate: "22.06.2026",
    scheduledTime: "09:00",
    isLocked: false,
    reportStatus: "Не сдан"
  },
  {
    id: "PROC-105",
    processName: "Проверка остаточных знаний (весенний семестр)",
    group: "231-105",
    subject: "Алгоритмы и структуры данных",
    teacher: "Федоров А. М.",
    department: "Прикладная математика",
    status: "Срок истёк",
    scheduledDate: "10.06.2026",
    scheduledTime: "16:00",
    isLocked: true,
    reportStatus: "Бумажный сдан"
  }
];

export const initialUsers: UserItem[] = [
  {
    id: "USR-001",
    name: "Смирнов Алексей Васильевич",
    email: "smirnov.admin@mospolytech.ru",
    department: "Центр информационных технологий",
    role: "Администратор",
    permissions: ["admin:full", "system:settings", "audit:view", "emergency:override"],
    status: "active",
    lastLogin: "2026-09-30 14:40"
  },
  {
    id: "USR-002",
    name: "Кузнецов Павел Сергеевич",
    email: "kuznetsov.lpr@mospolytech.ru",
    department: "Учебно-методическое управление",
    role: "ЛПР",
    permissions: ["schedule:approve", "reports:approve_all", "audit:view"],
    status: "active",
    lastLogin: "2026-09-30 11:15"
  },
  {
    id: "USR-003",
    name: "Иванов Иван Иванович",
    email: "ivanov.teacher@mospolytech.ru",
    department: "Кафедра Информационных технологий",
    role: "Преподаватель",
    permissions: ["schedule:view", "reports:submit"],
    status: "active",
    lastLogin: "2026-09-30 10:10"
  },
  {
    id: "USR-004",
    name: "Захаров Борис Николаевич",
    email: "zakharov.head@mospolytech.ru",
    department: "Кафедра Информационных технологий",
    role: "Заведующий кафедрой",
    permissions: ["schedule:edit", "schedule:submit", "reports:department_view"],
    status: "active",
    lastLogin: "2026-09-29 18:22"
  },
  {
    id: "USR-005",
    name: "Петрова Анна Сергеевна",
    email: "petrova.deputy@mospolytech.ru",
    department: "Кафедра Информационных технологий",
    role: "Заместитель заведующего кафедрой",
    permissions: ["schedule:edit", "reports:department_view"],
    status: "active",
    lastLogin: "2026-09-29 16:04"
  },
  {
    id: "USR-006",
    name: "Орлов Дмитрий Сергеевич",
    email: "orlov.guest@mospolytech.ru",
    department: "Кафедра Вычислительной техники",
    role: "Гость / Без роли",
    permissions: ["schedule:view"],
    status: "pending",
    lastLogin: "2026-09-30 09:05"
  },
  {
    id: "USR-007",
    name: "Ковалёв Михаил Юрьевич",
    email: "kovalev.former@mospolytech.ru",
    department: "Кафедра Прикладной математики",
    role: "Преподаватель",
    permissions: [],
    status: "deactivated",
    lastLogin: "2026-09-20 12:00"
  }
];

export const initialSettings: SystemSettings = {
  supportEmail: "support-knowledge@mospolytech.ru",
  welcomeGuestText: "Добро пожаловать в систему проверки остаточных знаний Московского Политеха. Ваша учетная запись ожидает проверки и назначения прав администратором кафедры.",
  accessRequestInstructions: "Для назначения прав преподавателя или заведующего кафедрой обратитесь в учебно-методическое управление (ауд. А-201) или напишите на support-knowledge@mospolytech.ru.",
  notificationTemplate: "Уважаемый(ая) {userName}, тестирование остаточных знаний группы {groupName} по дисциплине '{subject}' назначено на {date} в {time}.",
  autoLockDaysAfterExam: 3,
  maintenanceMode: false,
  requireReasonForOverrides: true
};
