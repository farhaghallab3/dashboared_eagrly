import api from '../api';
import { } from '../../types';

export async function fetchMessages(params?: Record<string, any>) {
  const res = await api.get('/messages/', { params });
  const data = res.data;
  return Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
}

export async function createMessage(payload: Record<string, any>) {
  const res = await api.post('/messages/', payload);
  return res.data;
}

export default { fetchMessages, createMessage };