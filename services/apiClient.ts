import api from './api';
import { AuthResponse, Product, Payment } from '../types';

const API_PREFIX = '/'; // `api` instance already has baseURL pointing to /api

export async function login(username: string, password: string) {
  const { data } = await api.post<AuthResponse>(`/token/`, { username, password });
  if (data.access) localStorage.setItem('access_token', data.access);
  if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
  return data;
}

export async function refreshToken(refresh: string) {
  const { data } = await api.post<AuthResponse>(`/token/refresh/`, { refresh });
  if (data.access) localStorage.setItem('access_token', data.access);
  return data;
}

export async function getProducts(params?: Record<string, any>) {
  const { data } = await api.get<Product[]>(`/products/`, { params });
  return data;
}

export async function getPayments(params?: Record<string, any>): Promise<Payment[] | { results: Payment[]; count: number }> {
  const { data } = await api.get(`/payments/`, { params });
  return data;
}

export async function getProduct(id: number | string) {
  const { data } = await api.get<Product>(`/products/${id}/`);
  return data;
}

export async function createProduct(payload: Record<string, any> | FormData) {
  if (payload instanceof FormData) {
    // Let axios set the multipart boundary
    const { data } = await api.post(`/products/`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  }
  const { data } = await api.post(`/products/`, payload);
  return data;
}

export async function sendChatbotMessage(message: string) {
  const { data } = await api.post<{ reply: string }>(`/chatbot/chatbot/`, { message });
  return data;
}

export async function getPackages() {
  const { data } = await api.get(`/packages/`);
  // Handle both paginated and non-paginated responses
  return Array.isArray(data) ? data : (data.results || []);
}

export async function confirmPayment(paymentId: number, packageId: number, adminNotes?: string) {
  const { data } = await api.post(`/payments/${paymentId}/admin_confirm/`, {
    package_id: packageId,
    admin_notes: adminNotes || ''
  });
  return data;
}

export async function getPendingPaymentCount() {
  const { data } = await api.get<{ count: number }>(`/payments/pending_count/`);
  return data.count;
}

export default {
  login,
  refreshToken,
  getProducts,
  getPayments,
  getProduct,
  createProduct,
  sendChatbotMessage,
  getPackages,
  confirmPayment,
  getPendingPaymentCount,
  getContactMessages,
  updateContactMessage,
  deleteContactMessage,
};

export async function getContactMessages(params?: Record<string, any>) {
  const { data } = await api.get(`/contact/admin/`, { params });
  return data;
}

export async function updateContactMessage(id: number | string, data: Record<string, any>) {
  const response = await api.patch(`/contact/admin/${id}/`, data);
  return response.data;
}

export async function deleteContactMessage(id: number | string) {
  const response = await api.delete(`/contact/admin/${id}/`);
  return response.data;
}
