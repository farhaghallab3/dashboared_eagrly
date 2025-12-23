import api from '../api';
import { Report } from '../../types';

export async function fetchReports(params?: Record<string, any>) {
  const res = await api.get('/reports/', { params });
  const data = res.data;
  return Array.isArray(data) ? data as Report[] : (data && Array.isArray(data.results) ? data.results as Report[] : []);
}

export async function createReport(payload: Record<string, any>) {
  const res = await api.post('/reports/', payload);
  return res.data as Report;
}

export async function getReport(id: number | string) {
  const res = await api.get(`/reports/${id}/`);
  return res.data as Report;
}

export async function updateReport(id: number | string, payload: Record<string, any>) {
  const res = await api.patch(`/reports/${id}/`, payload);
  return res.data as Report;
}

export async function deleteReport(id: number | string) {
  const res = await api.delete(`/reports/${id}/`);
  return res.data;
}

export default {
  fetchReports,
  createReport,
  getReport,
  updateReport,
  deleteReport,
};
