import { useCallback, useEffect, useState } from 'react';
import * as productsApi from '../services/api/products';
import { Product } from '../types';

export function useAdminProducts(initialParams?: Record<string, any>) {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [opState, setOpState] = useState<{ creating?: boolean; updatingId?: number | string | null; deletingId?: number | string | null }>({});
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  const fetchAll = useCallback(async (params?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.fetchProducts(params);
      if (Array.isArray(res)) {
        setData(res);
        setTotalCount(res.length);
      } else if (res && res.results) {
        setData(res.results);
        setTotalCount(res.count || res.results.length);
      } else {
        setData([]);
        setTotalCount(0);
      }
      return Array.isArray(res) ? res : (res?.results || []);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll({ ...initialParams, page: currentPage }).catch(() => { });
  }, [fetchAll, initialParams, currentPage]);

  const createItem = async (payload: Record<string, any> | FormData) => {
    setLoading(true);
    setOpState(s => ({ ...s, creating: true }));
    setError(null);
    try {
      await productsApi.createProduct(payload);
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

  const updateItem = async (id: number | string, payload: Record<string, any> | FormData) => {
    setLoading(true);
    setOpState(s => ({ ...s, updatingId: id }));
    setError(null);
    try {
      await productsApi.updateProduct(id, payload);
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
      await productsApi.deleteProduct(id);
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

  const refetch = (params?: Record<string, any>) => fetchAll(params ?? initialParams);

  return { data, loading, error, opState, createItem, updateItem, deleteItem, refetch, currentPage, setCurrentPage, totalCount, pageSize } as const;
}

export default useAdminProducts;
