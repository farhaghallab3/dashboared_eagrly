import api from '../api';
import { } from '../../types';

export async function fetchChats(params?: Record<string, any>) {
  const res = await api.get('/chats/', { params });
  const data = res.data;
  return Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
}

export async function createChat(payload: Record<string, any>) {
  const res = await api.post('/chats/', payload);
  return res.data;
}

export async function getChat(id: number | string) {
  const res = await api.get(`/chats/${id}/`);
  return res.data;
}

export default { fetchChats, createChat, getChat };