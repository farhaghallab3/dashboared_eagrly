import api from '../api';
import { Product } from '../../types';

export async function fetchProducts(params?: Record<string, any>) {
  const res = await api.get('/products/', { params });
  // Unwrap DRF paginated response if necessary
  const data = res.data;
  return Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
}

export async function createProduct(payload: Record<string, any> | FormData) {
  try {
    if (payload instanceof FormData) {
      const res = await api.post('/products/', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data;
    }
    const res = await api.post('/products/', payload);
    return res.data;
  } catch (error: any) {
    if (error.response && error.response.status === 400 && error.response.data?.code === 'ad_limit_exceeded') {
      throw new Error(`Ad limit exceeded: ${error.response.data.message}`);
    }
    throw error;
  }
}

export async function getProduct(id: number | string) {
  const res = await api.get(`/products/${id}/`);
  return res.data;
}

export async function updateProduct(id: number | string, payload: Record<string, any> | FormData, options?: { usePut?: boolean }) {
  if (payload instanceof FormData) {
    const res = await api.patch(`/products/${id}/`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  }

  if (options && options.usePut) {
    const res = await api.put(`/products/${id}/`, payload);
    return res.data;
  }

  // Default to PATCH for partial JSON updates (status changes, partial fields)
  const res = await api.patch(`/products/${id}/`, payload);
  return res.data;
}

export async function deleteProduct(id: number | string) {
  const res = await api.delete(`/products/${id}/`);
  return res.data;
}

export async function fetchMyProducts() {
  const res = await api.get('/products/my_products/');
  return res.data;
}

export default {
  fetchProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  fetchMyProducts,
};
