import { useState, useEffect, useCallback } from 'react';
import { Payment } from '../types';
import { getPayments } from '../services/apiClient';

export function usePayments(initialParams?: Record<string, any>) {
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  const fetchData = useCallback(async (params?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPayments(params);
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
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData({ ...initialParams, page: currentPage });
  }, [fetchData, initialParams, currentPage]);

  const refetch = (params?: Record<string, any>) => fetchData({ ...initialParams, ...params, page: currentPage });

  return { data, loading, error, refetch, currentPage, setCurrentPage, totalCount, pageSize } as const;
}

export default usePayments;
