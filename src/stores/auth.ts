import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as authApi from '@/api/auth';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/api/types';

const REFRESH_KEY = 'tickethub:refresh';
const USER_KEY = 'tickethub:user';

function readUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as User | null;
  } catch {
    return null;
  }
}

/** Access-токен живе лише в пам'яті, refresh — у localStorage. */
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_KEY));
  const user = ref<User | null>(readUser());

  const isLoggedIn = computed(() => !!refreshToken.value && !!user.value);
  const role = computed(() => user.value?.role ?? null);

  function apply(res: AuthResponse) {
    accessToken.value = res.accessToken;
    refreshToken.value = res.refreshToken;
    user.value = res.user;
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  async function login(body: LoginRequest) {
    apply(await authApi.login(body));
  }

  async function register(body: RegisterRequest) {
    apply(await authApi.register(body));
  }

  async function refresh() {
    if (!refreshToken.value) throw new Error('Немає refresh-токена');
    const res = await authApi.refresh(refreshToken.value);
    apply(res);
    return res.accessToken;
  }

  function logout() {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return { accessToken, user, role, isLoggedIn, login, register, refresh, logout };
});
