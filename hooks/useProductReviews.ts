import { useEffect, useState } from 'react';
import * as reviewsApi from '../services/api/reviews';
import { Review } from '../types';

export default function useProductReviews(productId?: number | string) {
  const [data, setData] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [opState, setOpState] = useState<{ creating?: boolean; updatingId?: number | null; deletingId?: number | null }>({});

  const fetch = async (params?: Record<string, any>) => {
    setLoading(true);
    try {
      const p = params ?? (productId ? { product: productId } : undefined);
      const items = await reviewsApi.fetchReviews(p);
      setData(items);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetch();
  }, [productId]);

  const createItem = async (payload: Record<string, any>) => {
    setOpState(s => ({ ...s, creating: true }));
    try {
      const res = await reviewsApi.createReview(payload);
      setData(prev => [res, ...prev]);
      return res;
    } finally {
      setOpState(s => ({ ...s, creating: false }));
    }
  };

  const updateItem = async (id: number | string, payload: Record<string, any>) => {
    setOpState(s => ({ ...s, updatingId: Number(id) }));
    try {
      const res = await reviewsApi.updateReview(id, payload);
      setData(prev => prev.map(r => (r.id === res.id ? res : r)));
      return res;
    } finally {
      setOpState(s => ({ ...s, updatingId: null }));
    }
  };

  const deleteItem = async (id: number | string) => {
    setOpState(s => ({ ...s, deletingId: Number(id) }));
    try {
      await reviewsApi.deleteReview(id);
      setData(prev => prev.filter(r => r.id !== Number(id)));
    } finally {
      setOpState(s => ({ ...s, deletingId: null }));
    }
  };

  return { data, loading, error, opState, fetch, createItem, updateItem, deleteItem };
}
