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
            const payments = await getPayments();
            const lastRead = localStorage.getItem(LAST_READ_KEY);
            const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;

            // Count payments that are pending_confirmation and were created after last read
            const unreadPayments = payments.filter((p: any) => {
                if (p.status !== 'pending_confirmation') return false;
                const createdTime = p.user_confirmed_at
                    ? new Date(p.user_confirmed_at).getTime()
                    : (p.created_at ? new Date(p.created_at).getTime() : 0);
                return createdTime > lastReadTime;
            });

            setUnreadCount(unreadPayments.length);
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
