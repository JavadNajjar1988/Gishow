import { AuthSession, UserRole, LoginCredentials, RecoveryCredentials } from '../types';

/**
 * Standard API error structure from backend
 */
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  detail?: any;
}

/**
 * Custom error class capturing backend HTTP responses
 */
export class BackendError extends Error {
  status: number;
  code?: string;
  detail?: any;

  constructor(message: string, status: number = 500, code?: string, detail?: any) {
    super(message);
    this.name = 'BackendError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

/**
 * Base HTTP request helper communicating with /api
 * Preserves cookie sessions (credentials: 'include') and standard headers.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `/api${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('X-Requested-With', 'XMLHttpRequest');

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Preserve cookie sessions across browser requests
    });

    if (res.status === 401) {
      throw new BackendError('نشست کاربری شما معتبر نیست یا منقضی شده است. لطفاً مجدداً وارد شوید.', 401, 'UNAUTHORIZED');
    }

    if (res.status === 403) {
      throw new BackendError('شما مجوز دسترسی به این بخش یا این رویداد را ندارید.', 403, 'FORBIDDEN');
    }

    if (res.status === 404) {
      throw new BackendError(`سرویس یا مسیر درخواستی در سرور یافت نشد (${url}). این قابلیت هنوز در سرور پیاده‌سازی نشده است.`, 404, 'NOT_FOUND');
    }

    if (!res.ok) {
      let errorMsg = `خطای سرور (${res.status})`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMsg = errorData.message;
        }
      } catch {
        // Fallback to text
        const text = await res.text();
        if (text) errorMsg = text;
      }
      throw new BackendError(errorMsg, res.status);
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof BackendError) {
      throw err;
    }
    // Network failure
    throw new BackendError(
      'ارتباط با سرور برقرار نشد. لطفاً وضعیت شبکه یا اتصال سرور را بررسی نمایید.',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Authentication API Endpoints
 */
export const authApi = {
  // Get current active session
  async getCurrentSession(): Promise<AuthSession> {
    return apiRequest<AuthSession>('/auth/me', { method: 'GET' });
  },

  // Login with mobile and password
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    return apiRequest<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Logout current session
  async logout(): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  // Recover account using personal security code (recovery code)
  async recoverWithCode(credentials: RecoveryCredentials): Promise<AuthSession> {
    return apiRequest<AuthSession>('/auth/recover', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};
