import api from '../api';
import { Package } from '../../types';

export async function fetchPackages(params?: Record<string, any>) {
  const res = await api.get('/packages/', { params });
  const data = res.data;
  return Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
}

export async function createPackage(payload: Record<string, any>) {
  const res = await api.post('/packages/', payload);
  return res.data;
}

export async function getPackage(id: number | string) {
  const res = await api.get(`/packages/${id}/`);
  return res.data;
}

export async function updatePackage(id: number | string, payload: Record<string, any>) {
  const res = await api.put(`/packages/${id}/`, payload);
  return res.data;
}

export async function deletePackage(id: number | string) {
  const res = await api.delete(`/packages/${id}/`);
  return res.data;
}

export default {
  fetchPackages,
  createPackage,
  getPackage,
  updatePackage,
  deletePackage,
};
