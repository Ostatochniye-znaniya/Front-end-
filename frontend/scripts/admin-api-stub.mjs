#!/usr/bin/env node
/**
 * Contract-compatible stand-in for KnowledgeApp admin API.
 * Routes match KnowledgeApp.API Controllers under /admin/*.
 * Point BACKEND_URL at this process for local frontend demos.
 */
import http from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.ADMIN_STUB_PORT || 5001);
const now = () => new Date().toISOString();

const filters = {
  processes: {
    approvalStatuses: [
      { value: 'approved', label: 'Согласовано' },
      { value: 'pending', label: 'На согласовании' },
      { value: 'rejected', label: 'Отклонено' },
    ],
    stages: [
      { value: 'not_assigned', label: 'Не назначен' },
      { value: 'time_selection', label: 'Выбор времени' },
      { value: 'approval', label: 'Согласование' },
      { value: 'testing', label: 'Тестирование' },
      { value: 'reporting', label: 'Отчётность' },
    ],
    reportStatuses: [
      { value: 'not_submitted', label: 'Не сдан' },
      { value: 'electronic', label: 'Электронный сдан' },
      { value: 'paper', label: 'Бумажный сдан' },
      { value: 'signed', label: 'Подписан' },
    ],
    semesters: [{ value: '1', label: 'Весна 2025' }],
    faculties: [{ value: '1', label: 'ФИТ' }],
    departments: [{ value: '4', label: 'Информационные технологии' }],
  },
  users: {
    roles: [
      { value: '1', label: 'Администратор' },
      { value: '2', label: 'ЛПР' },
      { value: '3', label: 'Заведующий кафедрой' },
      { value: '4', label: 'Преподаватель' },
      { value: '5', label: 'Гость' },
    ],
    departments: [{ value: '4', label: 'Информационные технологии' }],
    faculties: [{ value: '1', label: 'ФИТ' }],
    statuses: [
      { value: 'active', label: 'Активен' },
      { value: 'blocked', label: 'Заблокирован' },
    ],
  },
  audit: {
    users: [
      { value: '10', label: 'Иванов И. И.' },
      { value: '11', label: 'Петров В. А.' },
    ],
    actions: [
      { value: 'process_reschedule', label: 'Перенос даты процесса' },
      { value: 'process_rollback', label: 'Откат этапа процесса' },
      { value: 'user_role_change', label: 'Смена роли' },
      { value: 'user_status_change', label: 'Смена статуса' },
      { value: 'user_create', label: 'Создание пользователя' },
    ],
    entityTypes: [
      { value: 'process', label: 'Процесс' },
      { value: 'user', label: 'Пользователь' },
      { value: 'settings', label: 'Настройки' },
    ],
  },
  tech: {
    levels: [
      { value: 'error', label: 'ERROR' },
      { value: 'warning', label: 'WARN' },
      { value: 'info', label: 'INFO' },
    ],
    services: [
      { value: 'auth', label: 'Auth' },
      { value: 'pdf', label: 'PDF' },
      { value: 'gateway', label: 'Gateway' },
    ],
  },
};

let nextProcessId = 3;
let nextUserId = 13;
let nextAuditId = 3;
let nextTechId = 3;

const db = {
  processes: [
    {
      id: 1,
      groupId: 101,
      groupName: '221-111',
      disciplineId: 1,
      disciplineName: 'Сети и телекоммуникации',
      departmentId: 4,
      departmentName: 'Информационные технологии',
      facultyName: 'ФИТ',
      semesterId: 1,
      semesterLabel: 'Весна 2025',
      teachers: [],
      teacherNames: 'Иванов И. И.',
      periodStart: null,
      periodEnd: null,
      scheduledDate: '2026-06-15',
      scheduledTime: '12:20:00',
      scheduledPair: null,
      isInPerson: true,
      room: 'А-301',
      lmsUrl: null,
      approvalStatus: 'approved',
      approvalStatusLabel: 'Согласовано',
      stage: 'testing',
      stageLabel: 'Тестирование',
      reportId: 1,
      reportStatus: 'electronic',
      reportStatusLabel: 'Электронный сдан',
      isLocked: false,
    },
    {
      id: 2,
      groupId: 102,
      groupName: '221-112',
      disciplineId: 2,
      disciplineName: 'Базы данных и SQL',
      departmentId: 4,
      departmentName: 'Информационные технологии',
      facultyName: 'ФИТ',
      semesterId: 1,
      semesterLabel: 'Весна 2025',
      teachers: [],
      teacherNames: 'Сидорова Е. Н.',
      periodStart: null,
      periodEnd: null,
      scheduledDate: '2026-06-20',
      scheduledTime: '14:00:00',
      scheduledPair: null,
      isInPerson: true,
      room: null,
      lmsUrl: null,
      approvalStatus: 'pending',
      approvalStatusLabel: 'На согласовании',
      stage: 'approval',
      stageLabel: 'Согласование',
      reportId: null,
      reportStatus: 'not_submitted',
      reportStatusLabel: 'Не сдан',
      isLocked: false,
    },
  ],
  users: [
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
      lastLoginAt: now(),
    },
    {
      id: 11,
      name: 'Петров Виктор Алексеевич',
      email: 'petrov@mospolytech.ru',
      departmentId: 4,
      department: 'Информационные технологии',
      facultyId: 1,
      faculty: 'ФИТ',
      roles: [{ id: 4, name: 'Преподаватель' }],
      role: 'Преподаватель',
      status: 'active',
      statusLabel: 'Активен',
      lastLoginAt: null,
    },
    {
      id: 12,
      name: 'Сидорова Елена Николаевна',
      email: 'sidorova@mospolytech.ru',
      departmentId: 4,
      department: 'Информационные технологии',
      facultyId: 1,
      faculty: 'ФИТ',
      roles: [{ id: 3, name: 'Заведующий кафедрой' }],
      role: 'Заведующий кафедрой',
      status: 'blocked',
      statusLabel: 'Заблокирован',
      lastLoginAt: null,
    },
  ],
  audit: [
    {
      id: 1,
      timestamp: now(),
      userId: 10,
      user: 'Иванов И. И.',
      role: 'Администратор',
      action: 'user_role_change',
      actionLabel: 'Смена роли',
      entityType: 'user',
      entityTypeLabel: 'Пользователь',
      entityId: '11',
      entity: 'Петров В. А.',
      previousState: 'Гость',
      newState: 'Преподаватель',
      reason: 'Назначение на дисциплину',
      ipAddress: '127.0.0.1',
    },
  ],
  tech: [
    {
      id: 1,
      timestamp: now(),
      level: 'error',
      service: 'pdf',
      category: 'generation',
      message: 'Не удалось сформировать PDF отчёта',
      traceId: 'trc-1001',
      requestMethod: 'POST',
      requestPath: '/reports/generate',
      hasDetails: true,
      details: 'NullReferenceException at PdfBuilder.Render()',
    },
    {
      id: 2,
      timestamp: now(),
      level: 'warning',
      service: 'auth',
      category: 'token',
      message: 'Истёк refresh token',
      traceId: 'trc-1002',
      requestMethod: 'POST',
      requestPath: '/auth/refresh',
      hasDetails: false,
      details: null,
    },
  ],
  settings: {
    supportEmail: 'support@mospolytech.ru',
    supportPhone: '+7 (495) 000-00-00',
    welcomeText: 'Добро пожаловать в систему проверки остаточных знаний.',
    accessRequestInstructions: 'Оставьте заявку через форму гостя или обратитесь к администратору.',
    notificationTemplate: 'Уважаемый(ая) {name}, статус вашего процесса изменён.',
    updatedAt: now(),
    updatedBy: 'Иванов И. И.',
  },
};

function addAudit(entry) {
  const row = { id: nextAuditId++, timestamp: now(), ipAddress: '127.0.0.1', ...entry };
  db.audit.unshift(row);
  return row;
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, cookie',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,OPTIONS',
  });
  res.end(payload);
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

function pageSlice(items, page, pageSize) {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 50);
  const start = (p - 1) * size;
  return {
    items: items.slice(start, start + size),
    total: items.length,
    page: p,
    pageSize: size,
  };
}

function includesCI(haystack, needle) {
  if (!needle) return true;
  return String(haystack ?? '').toLowerCase().includes(String(needle).toLowerCase());
}

async function handle(req, res) {
  if (req.method === 'OPTIONS') {
    return json(res, 204, null);
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const q = url.searchParams;

  try {
    if (req.method === 'GET' && path === '/admin/processes/filters') {
      return json(res, 200, filters.processes);
    }

    if (req.method === 'GET' && path === '/admin/processes') {
      let items = [...db.processes];
      const search = q.get('search') || '';
      const approvalStatus = q.getAll('approvalStatus').filter(Boolean);
      const stage = q.getAll('stage').filter(Boolean);
      const reportStatus = q.getAll('reportStatus').filter(Boolean);
      if (search) {
        items = items.filter((p) =>
          includesCI(p.groupName, search) ||
          includesCI(p.disciplineName, search) ||
          includesCI(p.teacherNames, search) ||
          includesCI(p.departmentName, search));
      }
      if (approvalStatus.length) items = items.filter((p) => approvalStatus.includes(p.approvalStatus));
      if (stage.length) items = items.filter((p) => stage.includes(p.stage));
      if (reportStatus.length) items = items.filter((p) => reportStatus.includes(p.reportStatus));
      const semesterId = q.get('semesterId');
      const facultyId = q.get('facultyId');
      const departmentId = q.get('departmentId');
      if (semesterId) items = items.filter((p) => String(p.semesterId) === semesterId);
      if (facultyId) items = items.filter((p) => facultyId === '1');
      if (departmentId) items = items.filter((p) => String(p.departmentId) === departmentId);
      const page = pageSlice(items, q.get('page'), q.get('pageSize'));
      const approvalStatusCounts = filters.processes.approvalStatuses.map((o) => ({
        value: o.value,
        label: o.label,
        count: items.filter((p) => p.approvalStatus === o.value).length,
      }));
      return json(res, 200, { ...page, approvalStatusCounts });
    }

    if (req.method === 'POST' && /^\/admin\/processes\/(\d+)\/reschedule$/.test(path)) {
      const id = Number(path.match(/\/(\d+)\//)[1]);
      const body = await readBody(req);
      const process = db.processes.find((p) => p.id === id);
      if (!process) return json(res, 404, { title: 'Процесс не найден' });
      if (!body?.reason?.trim()) return json(res, 400, { title: 'Укажите причину переноса' });
      if (!body?.date || !body?.time) return json(res, 400, { title: 'Укажите дату и время' });
      if (process.approvalStatus !== 'approved') {
        return json(res, 409, { title: 'Перенос доступен только для согласованных процессов' });
      }
      const previous = `${process.scheduledDate} ${process.scheduledTime}`;
      process.scheduledDate = body.date;
      process.scheduledTime = body.time.length === 5 ? `${body.time}:00` : body.time;
      addAudit({
        userId: 10,
        user: 'Иванов И. И.',
        role: 'Администратор',
        action: 'process_reschedule',
        actionLabel: 'Перенос даты процесса',
        entityType: 'process',
        entityTypeLabel: 'Процесс',
        entityId: String(process.id),
        entity: process.groupName,
        previousState: previous,
        newState: `${process.scheduledDate} ${process.scheduledTime}`,
        reason: body.reason.trim(),
      });
      return json(res, 200, process);
    }

    if (req.method === 'POST' && /^\/admin\/processes\/(\d+)\/rollback$/.test(path)) {
      const id = Number(path.match(/\/(\d+)\//)[1]);
      const body = await readBody(req);
      const process = db.processes.find((p) => p.id === id);
      if (!process) return json(res, 404, { title: 'Процесс не найден' });
      if (!body?.comment?.trim()) return json(res, 400, { title: 'Укажите причину отката' });
      if (['not_assigned', 'time_selection'].includes(process.stage)) {
        return json(res, 409, { title: 'Откат с текущего этапа невозможен' });
      }
      const previous = process.stageLabel;
      process.stage = 'approval';
      process.stageLabel = 'Согласование';
      process.approvalStatus = 'pending';
      process.approvalStatusLabel = 'На согласовании';
      addAudit({
        userId: 10,
        user: 'Иванов И. И.',
        role: 'Администратор',
        action: 'process_rollback',
        actionLabel: 'Откат этапа процесса',
        entityType: 'process',
        entityTypeLabel: 'Процесс',
        entityId: String(process.id),
        entity: process.groupName,
        previousState: previous,
        newState: process.stageLabel,
        reason: body.comment.trim(),
      });
      return json(res, 200, process);
    }

    if (req.method === 'GET' && path === '/admin/users/filters') {
      return json(res, 200, filters.users);
    }

    if (req.method === 'GET' && path === '/admin/users') {
      let items = [...db.users];
      const search = q.get('search') || '';
      const roleId = q.get('roleId');
      const departmentId = q.get('departmentId');
      const facultyId = q.get('facultyId');
      const status = q.getAll('status').filter(Boolean);
      if (search) {
        items = items.filter((u) =>
          includesCI(u.name, search) ||
          includesCI(u.email, search) ||
          includesCI(u.department, search) ||
          includesCI(u.faculty, search));
      }
      if (roleId) items = items.filter((u) => u.roles.some((r) => String(r.id) === roleId));
      if (departmentId) items = items.filter((u) => String(u.departmentId) === departmentId);
      if (facultyId) items = items.filter((u) => String(u.facultyId) === facultyId);
      if (status.length) items = items.filter((u) => status.includes(u.status));
      const page = pageSlice(items, q.get('page'), q.get('pageSize'));
      const statusCounts = filters.users.statuses.map((o) => ({
        value: o.value,
        label: o.label,
        count: items.filter((u) => u.status === o.value).length,
      }));
      return json(res, 200, { ...page, statusCounts });
    }

    if (req.method === 'POST' && path === '/admin/users') {
      const body = await readBody(req);
      if (!body?.name?.trim() || !body?.email?.trim()) {
        return json(res, 400, { title: 'Укажите ФИО и email' });
      }
      const role = filters.users.roles.find((r) => r.value === String(body.roleId ?? ''));
      const user = {
        id: nextUserId++,
        name: body.name.trim(),
        email: body.email.trim(),
        departmentId: body.departmentId ?? null,
        department: filters.users.departments.find((d) => d.value === String(body.departmentId ?? ''))?.label ?? null,
        facultyId: body.facultyId ?? null,
        faculty: filters.users.faculties.find((f) => f.value === String(body.facultyId ?? ''))?.label ?? null,
        roles: role ? [{ id: Number(role.value), name: role.label }] : [],
        role: role?.label ?? 'Без роли',
        status: 'active',
        statusLabel: 'Активен',
        lastLoginAt: null,
      };
      db.users.unshift(user);
      addAudit({
        userId: 10,
        user: 'Иванов И. И.',
        role: 'Администратор',
        action: 'user_create',
        actionLabel: 'Создание пользователя',
        entityType: 'user',
        entityTypeLabel: 'Пользователь',
        entityId: String(user.id),
        entity: user.name,
        previousState: null,
        newState: user.role,
        reason: null,
      });
      return json(res, 201, user);
    }

    if (req.method === 'PATCH' && /^\/admin\/users\/(\d+)\/role$/.test(path)) {
      const id = Number(path.match(/\/(\d+)\//)[1]);
      const body = await readBody(req);
      const user = db.users.find((u) => u.id === id);
      if (!user) return json(res, 404, { title: 'Пользователь не найден' });
      const role = filters.users.roles.find((r) => r.value === String(body?.roleId ?? ''));
      if (!role) return json(res, 400, { title: 'Укажите роль' });
      const previous = user.role;
      user.roles = [{ id: Number(role.value), name: role.label }];
      user.role = role.label;
      addAudit({
        userId: 10,
        user: 'Иванов И. И.',
        role: 'Администратор',
        action: 'user_role_change',
        actionLabel: 'Смена роли',
        entityType: 'user',
        entityTypeLabel: 'Пользователь',
        entityId: String(user.id),
        entity: user.name,
        previousState: previous,
        newState: user.role,
        reason: body?.reason ?? null,
      });
      return json(res, 200, user);
    }

    if (req.method === 'PATCH' && /^\/admin\/users\/(\d+)\/status$/.test(path)) {
      const id = Number(path.match(/\/(\d+)\//)[1]);
      const body = await readBody(req);
      const user = db.users.find((u) => u.id === id);
      if (!user) return json(res, 404, { title: 'Пользователь не найден' });
      const status = body?.status;
      if (status !== 'active' && status !== 'blocked') {
        return json(res, 400, { title: 'Статус должен быть active или blocked.' });
      }
      if (status === 'blocked' && id === 10) {
        return json(res, 409, { title: 'Нельзя заблокировать самого себя.' });
      }
      const previous = user.statusLabel;
      user.status = status;
      user.statusLabel = status === 'blocked' ? 'Заблокирован' : 'Активен';
      addAudit({
        userId: 10,
        user: 'Иванов И. И.',
        role: 'Администратор',
        action: 'user_status_change',
        actionLabel: 'Смена статуса',
        entityType: 'user',
        entityTypeLabel: 'Пользователь',
        entityId: String(user.id),
        entity: user.name,
        previousState: previous,
        newState: user.statusLabel,
        reason: body?.reason ?? null,
      });
      return json(res, 200, user);
    }

    if (req.method === 'GET' && path === '/admin/audit-logs/filters') {
      return json(res, 200, filters.audit);
    }

    if (req.method === 'GET' && path === '/admin/audit-logs') {
      let items = [...db.audit];
      const search = q.get('search') || '';
      const userId = q.get('userId');
      const action = q.get('action');
      const entityType = q.get('entityType');
      const entityId = q.get('entityId');
      if (userId) items = items.filter((a) => String(a.userId) === userId);
      if (action) items = items.filter((a) => a.action === action);
      if (entityType) items = items.filter((a) => a.entityType === entityType);
      if (entityId) items = items.filter((a) => a.entityId === entityId);
      if (search) {
        items = items.filter((a) =>
          includesCI(a.user, search) ||
          includesCI(a.entity, search) ||
          includesCI(a.reason, search) ||
          includesCI(a.previousState, search) ||
          includesCI(a.newState, search));
      }
      return json(res, 200, pageSlice(items, q.get('page'), q.get('pageSize')));
    }

    if (req.method === 'GET' && path === '/admin/tech-logs/filters') {
      return json(res, 200, filters.tech);
    }

    if (req.method === 'GET' && path === '/admin/tech-logs') {
      let items = [...db.tech];
      const levels = q.getAll('level').filter(Boolean);
      const service = q.get('service');
      const traceId = q.get('traceId');
      const search = q.get('search') || '';
      const beforeLevel = [...items];
      if (service) items = items.filter((t) => t.service === service);
      if (traceId) items = items.filter((t) => includesCI(t.traceId, traceId));
      if (search) items = items.filter((t) => includesCI(t.message, search) || includesCI(t.category, search));
      const levelCounts = filters.tech.levels.map((o) => ({
        value: o.value,
        label: o.label,
        count: items.filter((t) => t.level === o.value).length,
      }));
      if (levels.length) items = items.filter((t) => levels.includes(t.level));
      void beforeLevel;
      return json(res, 200, { ...pageSlice(items, q.get('page'), q.get('pageSize')), levelCounts });
    }

    if (req.method === 'GET' && /^\/admin\/tech-logs\/(\d+)$/.test(path)) {
      const id = Number(path.split('/').pop());
      const row = db.tech.find((t) => t.id === id);
      if (!row) return json(res, 404, { title: 'Запись не найдена' });
      const { hasDetails, ...rest } = row;
      void hasDetails;
      return json(res, 200, rest);
    }

    if (req.method === 'GET' && path === '/admin/settings') {
      return json(res, 200, db.settings);
    }

    if (req.method === 'PUT' && path === '/admin/settings') {
      const body = await readBody(req);
      db.settings = {
        ...db.settings,
        supportEmail: body?.supportEmail ?? null,
        supportPhone: body?.supportPhone ?? null,
        welcomeText: body?.welcomeText ?? null,
        accessRequestInstructions: body?.accessRequestInstructions ?? null,
        notificationTemplate: body?.notificationTemplate ?? null,
        updatedAt: now(),
        updatedBy: 'Иванов И. И.',
      };
      return json(res, 200, db.settings);
    }

    if (req.method === 'GET' && path === '/health') {
      return json(res, 200, { ok: true, service: 'knowledgeapp-admin-stub' });
    }

    return json(res, 404, { title: `Нет ручки ${req.method} ${path}` });
  } catch (error) {
    return json(res, 500, { title: error instanceof Error ? error.message : 'stub error' });
  }
}

const server = http.createServer((req, res) => {
  handle(req, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`KnowledgeApp admin stub on http://127.0.0.1:${PORT}`);
  console.log('Set BACKEND_URL=127.0.0.1:' + PORT);
});
