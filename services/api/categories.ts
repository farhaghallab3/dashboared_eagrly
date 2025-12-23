import api from '../api';
import { Category } from '../../types';

export async function fetchCategories(params?: Record<string, any>) {
  const res = await api.get('/categories/', { params });
  const data = res.data;
  return Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
}

export async function createCategory(payload: Record<string, any> | FormData) {
  if (payload instanceof FormData) {
    const res = await api.post('/categories/', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  }
  const res = await api.post('/categories/', payload);
  return res.data;
}

export async function getCategory(id: number | string) {
  const res = await api.get(`/categories/${id}/`);
  return res.data;
}

export async function updateCategory(id: number | string, payload: Record<string, any> | FormData) {
  if (payload instanceof FormData) {
    const res = await api.put(`/categories/${id}/`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  }
  const res = await api.put(`/categories/${id}/`, payload);
  return res.data;
}

export async function deleteCategory(id: number | string) {
  const res = await api.delete(`/categories/${id}/`);
  return res.data;
}

export async function fetchCategoryProducts(id: number | string) {
  const res = await api.get(`/categories/${id}/products/`);
  return res.data;
}

export default {
  fetchCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  fetchCategoryProducts,
};
