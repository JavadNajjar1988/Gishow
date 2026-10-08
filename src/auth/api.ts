export interface Account {
  id: number; full_name: string; mobile: string; national_code: string | null; is_active: boolean;
  roles: string[]; global_permissions: string[]; event_permissions: Record<string, string[]>;
  event_roles: {event_id: number; role: string}[];
}
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  return apiRequest<T>(path, {method, body: body === undefined ? undefined : JSON.stringify(body)});
}
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  const headers = new Headers(options.headers);
  headers.set('X-Gishow-Request', '1');
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  try {
    response = await fetch(`/api${path}`, {...options, credentials: 'include', headers});
  } catch { throw new ApiError(0, 'اتصال به سرور برقرار نشد.'); }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = typeof data.detail === 'string' ? data.detail : [404,405,501].includes(response.status)
      ? 'این عملیات هنوز به سرویس سرور متصل نیست؛ چیزی ذخیره نشد.' : response.status === 401
      ? 'برای ادامه وارد حساب شوید.' : response.status === 403 ? 'دسترسی لازم را ندارید.' : 'اطلاعات فرم معتبر نیست.';
    throw new ApiError(response.status, message);
  }
  return response.status === 204 ? undefined as T : response.json();
}
export function hasPermission(user: Account | null, code: string): boolean {
  return !!user && (user.global_permissions.includes(code) || Object.values(user.event_permissions).some(p => p.includes(code)));
}
