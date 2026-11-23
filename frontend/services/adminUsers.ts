export interface AdminUser {
  id: number;
  name: string | null;
  email: string | null;
  departmentId: number | null;
  department: string | null;
  facultyId: number | null;
  faculty: string | null;
  roles: { id: number; name: string }[];
  role: string;
  status: string;
  statusLabel: string;
  lastLoginAt: string | null;
}

export interface UserPage {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts?: { value: string; label: string; count: number }[];
}

export interface UserFilters {
  roles: { value: string; label: string }[];
  departments: { value: string; label: string }[];
  faculties: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
}
