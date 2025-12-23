import api from '../api';
import { Review } from '../../types';

export async function fetchReviews(params?: Record<string, any>) {
  const res = await api.get('/reviews/', { params });
  const data = res.data;
  return Array.isArray(data) ? data as Review[] : (data && Array.isArray(data.results) ? data.results as Review[] : []);
}

export async function createReview(payload: Record<string, any>) {
  const res = await api.post('/reviews/', payload);
  return res.data as Review;
}

export async function getReview(id: number | string) {
  const res = await api.get(`/reviews/${id}/`);
  return res.data as Review;
}

export async function updateReview(id: number | string, payload: Record<string, any>) {
  const res = await api.patch(`/reviews/${id}/`, payload);
  return res.data as Review;
}

export async function deleteReview(id: number | string) {
  const res = await api.delete(`/reviews/${id}/`);
  return res.data;
}

export default {
  fetchReviews,
  createReview,
  getReview,
  updateReview,
  deleteReview,
};
