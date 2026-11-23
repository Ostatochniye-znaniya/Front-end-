import Link from 'next/link';

const screens = [
  { href: '/admin/processes', title: 'Панель администратора', description: 'Фронт ходит в ручки KnowledgeApp (/admin/processes, /users, /audit-logs, /tech-logs, /settings) через прокси /csh/api/admin. Локально: npm run admin-api-stub и BACKEND_URL=127.0.0.1:5001. На стенде укажите адрес живого API.' },
  { href: '/lpr/statistics', title: 'Статистика ЛПР', description: 'Демонстрационные данные по университету: факультеты и детализация по кафедрам, план/факт и состояние отчётов.' },
  { href: '/rod/statistics', title: 'Статистика декана', description: 'Роль Rod: сводка и кафедры одного факультета. Выбор факультета служит только для демонстрации.' },
  { href: '/department_responsible/statistics', title: 'Статистика ответственного', description: 'Роль DepartmentResponsible: тот же интерфейс статистики факультета, что у декана.' },
  { href: '/hod/statistics', title: 'Статистика завкафедры', description: 'Демонстрационные данные кафедры: дисциплины, группы, поиск и фильтр по курсу.' },
];

export default function DemoPage() {
  return (
    <main style={{ maxWidth: 1000, margin: '32px auto', padding: 24 }}>
      <h1 className="title">Демонстрация административной панели и статистики</h1>
      <p className="text">Открытие страницы не меняет учётную запись и не выдаёт права доступа.</p>
      <p role="note" className="text">Статистика пока работает на тестовых данных: серверный API сводных показателей не подключён. Админка работает только с API; сохранение считается успешным после ответа сервера.</p>
      <div style={{ display: 'grid', gap: 20, marginTop: 24 }}>
        {screens.map(screen => (
          <section key={screen.href} style={{ backgroundColor: 'var(--background-main-element-c)', border: '1px solid var(--secondary-border-c)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}><Link className="text-bold" href={screen.href}>{screen.title}</Link></h2>
            <p className="text">{screen.description}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
