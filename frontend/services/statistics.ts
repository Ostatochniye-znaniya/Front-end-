const API_BASE_URL = '/csh/api';

export interface StatisticsSemesterOption {
  id: number;
  label: string;
  isSpring: boolean;
}

export interface DepartmentStatistics {
  id: number;
  name: string;
  profilesCount: number;
  coursesCount: number;
  magistracyCount: number;
  groupNorm: number;
  groupFact: number;
  classNorm: number;
  classFact: number;
  eReportDone: number;
  eReportRemarks: number;
  pReportDone: number;
  pReportRemarks: number;
}

export interface FacultyStatistics {
  id: number;
  code: string;
  name: string;
  departments: DepartmentStatistics[];
}

export interface StatisticsSummary {
  semesterId: number;
  semesterLabel: string;
  isSpring: boolean;
  orderId: number | null;
  requiresPaperReports: boolean;
  faculties: FacultyStatistics[];
}

export interface DisciplineGroupStatistics {
  groupNumber: string;
  course: number;
  teacher: string;
  eReportStatus: 'done' | 'remarks' | 'pending';
  pReportStatus: 'done' | 'remarks' | 'pending';
  allPassed: boolean;
}

export interface DisciplineStatistics {
  id: number;
  title: string;
  course: number;
  semester: string;
  profilesCount: number;
  groupFact: number;
  classNorm: number;
  classFact: number;
  eReportDone: number;
  eReportRemarks: number;
  pReportDone: number;
  pReportRemarks: number;
  groups: DisciplineGroupStatistics[];
}

export interface DepartmentStatisticsDetails {
  departmentId: number;
  departmentName: string;
  facultyCode: string | null;
  semesterId: number;
  requiresPaperReports: boolean;
  disciplines: DisciplineStatistics[];
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error || body?.title || '';
    } catch {
      detail = '';
    }
    throw new Error(detail || `Ошибка загрузки статистики (HTTP ${response.status})`);
  }
  return response.json() as Promise<T>;
}

function query(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

export async function getStatisticsFilters(): Promise<{ semesters: StatisticsSemesterOption[] }> {
  return getJson('/Statistics/GetFilters');
}

export async function getStatisticsSummary(params: {
  semesterId?: number | null;
  facultyId?: number | null;
  departmentId?: number | null;
}): Promise<StatisticsSummary> {
  return getJson(`/Statistics/GetSummary${query(params)}`);
}

export async function getDepartmentStatisticsDetails(params: {
  semesterId?: number | null;
  departmentId?: number | null;
}): Promise<DepartmentStatisticsDetails> {
  return getJson(`/Statistics/GetDepartmentDetails${query(params)}`);
}
