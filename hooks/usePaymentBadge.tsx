import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getPayments } from '../services/apiClient';

interface PaymentBadgeContextType {
    unreadCount: number;
    markAsRead: () => void;
    refetch: () => void;
}

const PaymentBadgeContext = createContext<PaymentBadgeContextType | undefined>(undefined);

const LAST_READ_KEY = 'payments_last_read_timestamp';

export function PaymentBadgeProvider({ children }: { children: ReactNode }) {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        // Only fetch if user is authenticated
        const token = localStorage.getItem('access_token');
        if (!token) {
            setUnreadCount(0);
            return;
        }

        try {
            const { getPendingPaymentCount } = await import('../services/apiClient');
            const count = await getPendingPaymentCount();
            setUnreadCount(count);
        } catch (error) {
            // Silently ignore errors (likely auth issues)
            setUnreadCount(0);
        }
    }, []);

    const markAsRead = useCallback(() => {
        localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
        setUnreadCount(0);
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        // Poll every 30 seconds for new payments
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    return (
        <PaymentBadgeContext.Provider value={{ unreadCount, markAsRead, refetch: fetchUnreadCount }}>
            {children}
        </PaymentBadgeContext.Provider>
    );
}

export function usePaymentBadge() {
    const context = useContext(PaymentBadgeContext);
    if (context === undefined) {
        throw new Error('usePaymentBadge must be used within a PaymentBadgeProvider');
    }
    return context;
}

export default usePaymentBadge;
