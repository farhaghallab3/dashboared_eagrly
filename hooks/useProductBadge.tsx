import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { fetchPendingCount } from '../services/api/products';

interface ProductBadgeContextType {
    pendingCount: number;
    refetch: () => void;
}

const ProductBadgeContext = createContext<ProductBadgeContextType | undefined>(undefined);

export function ProductBadgeProvider({ children }: { children: ReactNode }) {
    const [pendingCount, setPendingCount] = useState(0);

    const fetchCount = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setPendingCount(0);
            return;
        }

        try {
            const count = await fetchPendingCount();
            setPendingCount(count);
        } catch (error) {
            console.error('Failed to fetch pending products count', error);
        }
    }, []);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [fetchCount]);

    return (
        <ProductBadgeContext.Provider value={{ pendingCount, refetch: fetchCount }}>
            {children}
        </ProductBadgeContext.Provider>
    );
}

export function useProductBadge() {
    const context = useContext(ProductBadgeContext);
    if (context === undefined) {
        throw new Error('useProductBadge must be used within a ProductBadgeProvider');
    }
    return context;
}

export default useProductBadge;
