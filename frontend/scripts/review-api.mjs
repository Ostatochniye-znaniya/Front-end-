#!/usr/bin/env node
import http from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.REVIEW_API_PORT || 5001);

const semesters = [
  { id: 3, label: '2026, весенний семестр', isSpring: true },
  { id: 2, label: '2025, осенний семестр', isSpring: false },
  { id: 1, label: '2025, весенний семестр', isSpring: true },
];

const summaries = {
  1: {
    semesterId: 1,
    semesterLabel: '2025, весенний семестр',
    isSpring: true,
    orderId: 10,
    requiresPaperReports: true,
    faculties: [
      {
        id: 1,
        code: 'ФИТ',
        name: 'Факультет информационных технологий',
        departments: [
          {
            id: 4,
            name: 'Кафедра «Информационные технологии»',
            profilesCount: 3,
            coursesCount: 3,
            magistracyCount: 1,
            groupNorm: 19,
            groupFact: 18,
            classNorm: 28,
            classFact: 26,
            eReportDone: 18,
            eReportRemarks: 1,
            pReportDone: 17,
            pReportRemarks: 0,
          },
          {
            id: 5,
            name: 'Кафедра «Прикладная информатика»',
            profilesCount: 2,
            coursesCount: 3,
            magistracyCount: 1,
            groupNorm: 13,
            groupFact: 12,
            classNorm: 20,
            classFact: 19,
            eReportDone: 11,
            eReportRemarks: 2,
            pReportDone: 10,
            pReportRemarks: 1,
          },
        ],
      },
    ],
  },
  2: {
    semesterId: 2,
    semesterLabel: '2025, осенний семестр',
    isSpring: false,
    orderId: 11,
    requiresPaperReports: false,
    faculties: [
      {
        id: 1,
        code: 'ФИТ',
        name: 'Факультет информационных технологий',
        departments: [
          {
            id: 4,
            name: 'Кафедра «Информационные технологии»',
            profilesCount: 3,
            coursesCount: 3,
            magistracyCount: 1,
            groupNorm: 18,
            groupFact: 17,
            classNorm: 24,
            classFact: 22,
            eReportDone: 20,
            eReportRemarks: 0,
            pReportDone: 0,
            pReportRemarks: 0,
          },
        ],
      },
    ],
  },
  3: {
    semesterId: 3,
    semesterLabel: '2026, весенний семестр',
    isSpring: true,
    orderId: 12,
    requiresPaperReports: true,
    faculties: [],
  },
};

const departmentDetails = {
  1: {
    departmentId: 4,
    departmentName: 'Информационные технологии',
    facultyCode: 'ФИТ',
    semesterId: 1,
    requiresPaperReports: true,
    disciplines: [
      {
        id: 101,
        title: 'Сети и телекоммуникации',
        course: 2,
        semester: '2025, весенний семестр',
        profilesCount: 2,
        groupFact: 2,
        classNorm: 2,
        classFact: 2,
        eReportDone: 1,
        eReportRemarks: 1,
        pReportDone: 1,
        pReportRemarks: 0,
        groups: [
          {
            groupNumber: '221-111',
            course: 2,
            teacher: 'Иванов И. И.',
            eReportStatus: 'done',
            pReportStatus: 'done',
            allPassed: true,
          },
          {
            groupNumber: '221-112',
            course: 2,
            teacher: 'Петров В. А.',
            eReportStatus: 'remarks',
            pReportStatus: 'pending',
            allPassed: false,
          },
        ],
      },
    ],
  },
};

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,OPTIONS',
  });
  res.end(body == null ? '' : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const processes = [
  {
    id: 1,
    groupName: '221-111',
    disciplineName: 'Сети и телекоммуникации',
    departmentName: 'Информационные технологии',
    facultyName: 'ФИТ',
    semesterLabel: 'Весна 2025',
    teacherNames: 'Иванов И. И.',
    scheduledDate: '2026-06-15',
    scheduledTime: '12:20:00',
    approvalStatus: 'approved',
    approvalStatusLabel: 'Согласовано',
    stage: 'testing',
    stageLabel: 'Тестирование',
    reportStatus: 'electronic',
    reportStatusLabel: 'Электронный сдан',
    isLocked: false,
  },
];

async function handle(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, null);
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'GET' && path === '/Statistics/GetFilters') {
    return json(res, 200, { semesters });
  }

  if (req.method === 'GET' && path === '/Statistics/GetSummary') {
    const semesterId = Number(url.searchParams.get('semesterId') || semesters[0].id);
    const summary = summaries[semesterId] || summaries[1];
    return json(res, 200, summary);
  }

  if (req.method === 'GET' && path === '/Statistics/GetDepartmentDetails') {
    const semesterId = Number(url.searchParams.get('semesterId') || 1);
    const details = departmentDetails[semesterId] || departmentDetails[1];
    return json(res, 200, { ...details, semesterId, requiresPaperReports: summaries[semesterId]?.requiresPaperReports ?? true });
  }

  if (req.method === 'GET' && path === '/admin/processes') {
    return json(res, 200, {
      items: processes,
      total: processes.length,
      page: 1,
      pageSize: 50,
      approvalStatusCounts: [],
    });
  }

  if (req.method === 'GET' && path === '/admin/processes/filters') {
    return json(res, 200, {
      approvalStatuses: [{ value: 'approved', label: 'Согласовано' }],
      stages: [{ value: 'testing', label: 'Тестирование' }],
      reportStatuses: [{ value: 'electronic', label: 'Электронный сдан' }],
      semesters: [{ value: '1', label: 'Весна 2025' }],
      faculties: [{ value: '1', label: 'ФИТ' }],
      departments: [{ value: '4', label: 'Информационные технологии' }],
    });
  }

  if (req.method === 'POST' && /^\/admin\/processes\/\d+\/reschedule$/.test(path)) {
    const body = await readBody(req);
    const process = processes[0];
    process.scheduledDate = body.date;
    process.scheduledTime = body.time.length === 5 ? `${body.time}:00` : body.time;
    return json(res, 200, process);
  }

  if (req.method === 'GET' && path === '/admin/users') {
    return json(res, 200, {
      items: [
        {
          id: 10,
          name: 'Иванов Иван Иванович',
          email: 'ivanov@mospolytech.ru',
          departmentId: 4,
          department: 'Информационные технологии',
          facultyId: 1,
          faculty: 'ФИТ',
          roles: [{ id: 1, name: 'Администратор' }],
          role: 'Администратор',
          status: 'active',
          statusLabel: 'Активен',
          lastLoginAt: null,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
      statusCounts: [],
    });
  }

  if (req.method === 'GET' && path === '/admin/users/filters') {
    return json(res, 200, {
      roles: [{ value: '1', label: 'Администратор' }],
      departments: [{ value: '4', label: 'Информационные технологии' }],
      faculties: [{ value: '1', label: 'ФИТ' }],
      statuses: [
        { value: 'active', label: 'Активен' },
        { value: 'blocked', label: 'Заблокирован' },
      ],
    });
  }

  if (req.method === 'GET' && (path === '/admin/audit-logs' || path === '/admin/tech-logs')) {
    return json(res, 200, { items: [], total: 0, page: 1, pageSize: 50, levelCounts: [] });
  }

  if (req.method === 'GET' && (path === '/admin/audit-logs/filters' || path === '/admin/tech-logs/filters')) {
    return json(res, 200, { users: [], actions: [], entityTypes: [], levels: [], services: [] });
  }

  if (req.method === 'GET' && path === '/admin/settings') {
    return json(res, 200, {
      supportEmail: 'support@mospolytech.ru',
      supportPhone: '+7 (495) 000-00-00',
      welcomeText: 'Добро пожаловать',
      accessRequestInstructions: null,
      notificationTemplate: null,
      updatedAt: new Date().toISOString(),
      updatedBy: 'review-api',
    });
  }

  if (req.method === 'PUT' && path === '/admin/settings') {
    const body = await readBody(req);
    return json(res, 200, { ...body, updatedAt: new Date().toISOString(), updatedBy: 'review-api' });
  }

  if (req.method === 'GET' && path === '/health') {
    return json(res, 200, { ok: true, mode: 'review-api' });
  }

  return json(res, 404, { title: `Нет ручки ${req.method} ${path}` });
}

http.createServer((req, res) => {
  handle(req, res).catch((error) => json(res, 500, { title: String(error) }));
}).listen(PORT, '127.0.0.1', () => {
  console.log(`review-api http://127.0.0.1:${PORT}`);
});
