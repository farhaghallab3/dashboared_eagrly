import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { getProducts } from '../services/apiClient';

export function useProducts(initialParams?: Record<string, any>) {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async (params?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProducts(params);
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

export default useProducts;
