import { useState, useEffect, useCallback } from 'react';
import { Payment } from '../types';
import { getPayments } from '../services/apiClient';

export function usePayments(initialParams?: Record<string, any>) {
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async (params?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPayments(params);
      setData(res);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(initialParams);
  }, [fetchData, initialParams]);

  return { data, loading, error, refetch: fetchData } as const;
}

export default usePayments;
