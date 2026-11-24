export interface ProcessItem {
  id: number;
  groupName: string | null;
  disciplineName: string | null;
  departmentName: string | null;
  teacherNames: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  approvalStatus: string;
  approvalStatusLabel: string;
  stage: string;
  stageLabel: string;
  reportStatusLabel: string;
  isLocked: boolean;
}

export interface ProcessPage {
  items: ProcessItem[];
  total: number;
  page: number;
  pageSize: number;
  approvalStatusCounts?: { value: string; label: string; count: number }[];
}

export interface ProcessFilters {
  approvalStatuses: { value: string; label: string }[];
  stages: { value: string; label: string }[];
  reportStatuses: { value: string; label: string }[];
  semesters: { value: string; label: string }[];
  faculties: { value: string; label: string }[];
  departments: { value: string; label: string }[];
}
