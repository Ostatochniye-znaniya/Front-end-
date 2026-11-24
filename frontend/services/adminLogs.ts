import { adminRequest } from './adminRequest';

export interface FilterOption { value: string; label: string }
export interface LogPage<T> { items: T[]; total: number; page: number; pageSize: number }
export interface AuditLog {
  id: number; timestamp: string; userId: number | null; user: string; role: string | null;
  action: string; actionLabel: string; entityType: string; entityTypeLabel: string;
  entityId: string | null; entity: string | null; previousState: string | null;
  newState: string | null; reason: string | null; ipAddress: string | null;
}
export interface AuditFilters { users: FilterOption[]; actions: FilterOption[]; entityTypes: FilterOption[] }
export interface TechLog {
  id: number; timestamp: string; level: string; service: string; category: string;
  message: string; traceId: string | null; requestMethod: string | null;
  requestPath: string | null; hasDetails: boolean;
}
export interface TechLogDetails extends Omit<TechLog, 'hasDetails'> { details: string | null }
export interface TechFilters { levels: FilterOption[]; services: FilterOption[] }
export interface TechLogPage extends LogPage<TechLog> { levelCounts: { value: string; label: string; count: number }[] }
export interface AuditQuery {
  dateFrom: string; dateTo: string; userId: string; action: string; entityType: string;
  entityId: string; search: string; page: number; pageSize: number;
}
export interface TechQuery {
  dateFrom: string; dateTo: string; level: string; service: string; traceId: string;
  search: string; page: number; pageSize: number;
}
function queryString(query: AuditQuery | TechQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '') params.set(key, String(value));
  });
  return params.toString();
}
export const getAuditLogs = (query: AuditQuery, signal?: AbortSignal) =>
  adminRequest<LogPage<AuditLog>>(`/audit-logs?${queryString(query)}`, { signal });
export const getAuditFilters = (signal?: AbortSignal) => adminRequest<AuditFilters>('/audit-logs/filters', { signal });
export const getTechLogs = (query: TechQuery, signal?: AbortSignal) =>
  adminRequest<TechLogPage>(`/tech-logs?${queryString(query)}`, { signal });
export const getTechFilters = (signal?: AbortSignal) => adminRequest<TechFilters>('/tech-logs/filters', { signal });
export const getTechLog = (id: number, signal?: AbortSignal) => adminRequest<TechLogDetails>(`/tech-logs/${id}`, { signal });
