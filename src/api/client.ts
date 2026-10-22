import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { mockAdapter } from './mock/adapter';

export const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
  adapter: useMocks ? mockAdapter : undefined,
});

/*
 * Інтерсептори підключаються з main.ts після створення Pinia й роутера,
 * щоб API-шар не залежав від них напряму.
 */
interface AuthHooks {
  getToken: () => string | null;
  refresh: () => Promise<string>;
  onAuthFailed: () => void;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export function installAuthInterceptors(hooks: AuthHooks) {
  api.interceptors.request.use((config) => {
    const token = hooks.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // При 401 токен оновлюється один раз для всіх паралельних запитів.
  let refreshing: Promise<string> | null = null;

  api.interceptors.response.use(undefined, async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (!original || error.response?.status !== 401 || original._retry) throw error;
    if (original.url?.startsWith('/auth/')) throw error;
    original._retry = true;

    refreshing ??= hooks.refresh().finally(() => (refreshing = null));
    try {
      const token = await refreshing;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch {
      hooks.onAuthFailed();
      throw error;
    }
  });
}

/** Людське повідомлення з будь-якої помилки запиту. */
export function errorMessage(error: unknown, fallback = 'Щось пішло не так. Спробуйте ще раз.') {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Немає з’єднання із сервером.';
    const data = error.response.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}
