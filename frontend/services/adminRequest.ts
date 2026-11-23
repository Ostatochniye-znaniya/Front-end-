export async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  const token = localStorage.getItem('access_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`/csh/api/admin${path}`, {
    ...options,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!response.ok) {
    const data: { error?: string; detail?: string; title?: string } = await response.json().catch(() => ({}));
    const message = response.status === 401 ? 'Необходим вход в систему.'
      : response.status === 403 ? 'Нет доступа к панели администратора.'
      : data.error || data.detail || data.title || 'Не удалось выполнить запрос к API администратора.';
    throw new Error(`${message} (HTTP ${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
