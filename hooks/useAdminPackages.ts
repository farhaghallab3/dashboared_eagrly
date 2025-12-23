import { useCallback, useEffect, useState } from 'react';
import * as packagesApi from '../services/api/packages';
import { Package } from '../types';

export function useAdminPackages(initialParams?: Record<string, any>) {
  const [data, setData] = useState<Package[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [opState, setOpState] = useState<{ creating?: boolean; updatingId?: number | string | null; deletingId?: number | string | null }>({});

  const fetchAll = useCallback(async (params?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await packagesApi.fetchPackages(params);
      const items = Array.isArray(res) ? res : (res && res.results ? res.results : []);
      setData(items);
      return items;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(initialParams).catch(() => {});
  }, [fetchAll, initialParams]);

  const createItem = async (payload: Record<string, any>) => {
    setLoading(true);
    setOpState(s => ({ ...s, creating: true }));
    setError(null);
    try {
      await packagesApi.createPackage(payload);
      const list = await fetchAll(initialParams);
      return list;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
      setOpState(s => ({ ...s, creating: false }));
    }
  };

  const updateItem = async (id: number | string, payload: Record<string, any>) => {
    setLoading(true);
    setOpState(s => ({ ...s, updatingId: id }));
    setError(null);
    try {
      await packagesApi.updatePackage(id, payload);
      const list = await fetchAll(initialParams);
      return list;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
      setOpState(s => ({ ...s, updatingId: null }));
    }
  };

  const deleteItem = async (id: number | string) => {
    setLoading(true);
    setOpState(s => ({ ...s, deletingId: id }));
    setError(null);
    try {
      await packagesApi.deletePackage(id);
      const list = await fetchAll(initialParams);
      return list;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
      setOpState(s => ({ ...s, deletingId: null }));
    }
  };

  const refetch = () => fetchAll(initialParams);

  return { data, loading, error, opState, createItem, updateItem, deleteItem, refetch } as const;
}

export default useAdminPackages;
