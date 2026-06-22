import { api, setToken } from './client';
import type { AuthResponse, User } from '../types';

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  setToken(data.accessToken);
  return data;
}

export async function register(email: string, password: string, name?: string) {
  const { data } = await api.post<AuthResponse>('/auth/register', {
    email,
    password,
    name,
  });
  setToken(data.accessToken);
  return data;
}

export async function getMe() {
  const { data } = await api.get<User>('/auth/me');
  return data;
}
