export interface Account {
  id: number; full_name: string; mobile: string; national_code: string | null; is_active: boolean;
  roles: string[]; global_permissions: string[]; event_permissions: Record<string, string[]>;
  event_roles: {event_id: number; role: string}[];
}
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {method, credentials: 'include', headers: {
      'Content-Type': 'application/json', 'X-Gishow-Request': '1'
    }, body: body === undefined ? undefined : JSON.stringify(body)});
  } catch { throw new ApiError(0, 'اتصال به سرور برقرار نشد.'); }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(response.status, typeof data.detail === 'string' ? data.detail : 'اطلاعات فرم معتبر نیست.');
  }
  return response.status === 204 ? undefined as T : response.json();
}
export function hasPermission(user: Account | null, code: string): boolean {
  return !!user && (user.global_permissions.includes(code) || Object.values(user.event_permissions).some(p => p.includes(code)));
}
