import { useState, useEffect, useCallback } from 'react';
import * as productsApi from '../services/api/products';
import { Product } from '../types';

export function useMyProducts() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.fetchMyProducts();
      setData(res);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData } as const;
}

export default useMyProducts;
