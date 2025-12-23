import { useEffect, useState } from 'react';
import * as reportsApi from '../services/api/reports';
import { Report } from '../types';

export default function useReports(initialParams?: Record<string, any>) {
  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [opState, setOpState] = useState<{ creating?: boolean; updatingId?: number | null; deletingId?: number | null }>({});

  const fetch = async (params?: Record<string, any>) => {
    setLoading(true);
    try {
      const items = await reportsApi.fetchReports(params ?? initialParams);
      setData(items);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const createItem = async (payload: Record<string, any>) => {
    setOpState(s => ({ ...s, creating: true }));
    try {
      const res = await reportsApi.createReport(payload);
      setData(prev => [res, ...prev]);
      return res;
    } finally {
      setOpState(s => ({ ...s, creating: false }));
    }
  };

  const updateItem = async (id: number | string, payload: Record<string, any>) => {
    setOpState(s => ({ ...s, updatingId: Number(id) }));
    try {
      const res = await reportsApi.updateReport(id, payload);
      setData(prev => prev.map(p => (p.id === res.id ? res : p)));
      return res;
    } finally {
      setOpState(s => ({ ...s, updatingId: null }));
    }
  };

  const deleteItem = async (id: number | string) => {
    setOpState(s => ({ ...s, deletingId: Number(id) }));
    try {
      await reportsApi.deleteReport(id);
      setData(prev => prev.filter(p => p.id !== Number(id)));
    } finally {
      setOpState(s => ({ ...s, deletingId: null }));
    }
  };

  return { data, loading, error, opState, fetch, createItem, updateItem, deleteItem };
}
