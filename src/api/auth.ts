import { api } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from './types';

export async function login(body: LoginRequest) {
  const { data } = await api.post<AuthResponse>('/auth/login', body);
  return data;
}

export async function register(body: RegisterRequest) {
  const { data } = await api.post<AuthResponse>('/auth/register', body);
  return data;
}

export async function refresh(refreshToken: string) {
  const { data } = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
  return data;
}
