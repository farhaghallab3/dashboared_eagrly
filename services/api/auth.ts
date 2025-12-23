import api from '../api';
import { AuthResponse } from '../../types';

export async function obtainToken(username: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/token/', { username, password });
  console.log(data);
  
  if (data.access) localStorage.setItem('access_token', data.access);
  if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
  return data;
}

export async function refreshToken(refresh: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/token/refresh/', { refresh });
  if (data.access) localStorage.setItem('access_token', data.access);
  return data;
}

export default {
  obtainToken,
  refreshToken,
};
