import { useState, useEffect } from 'react';
import api from '../services/api';

interface DashboardStats {
    products: {
        total: number;
        active: number;
        pending: number;
        inactive: number;
        last_30_days: number;
    };
    categories: {
        top_categories: Array<{
            id: number;
            name: string;
            product_count: number;
        }>;
    };
    sellers: {
        top_sellers: Array<{
            id: number;
            username: string;
            first_name: string;
            last_name: string;
            product_count: number;
        }>;
    };
    users: {
        total: number;
        last_30_days: number;
    };
}

interface AnalyticsData {
    product_timeline: Array<{ date: string; count: number }>;
    products_by_category: Array<{ id: number; name: string; product_count: number }>;
    products_by_status: Array<{ status: string; count: number }>;
    products_by_university: Array<{ university: string; count: number }>;
    user_timeline: Array<{ date: string; count: number }>;
    top_products: Array<{
        id: number;
        title: string;
        price: string;
        category__name: string;
    }>;
    date_range: {
        start: string;
        end: string;
        days: number;
    };
}

interface ApprovalStats {
    pending_timeline: Array<{ date: string; count: number }>;
    total_pending: number;
    recently_approved: number;
    pending_by_seller: Array<{
        seller__username: string;
        seller__id: number;
        count: number;
    }>;
}

export function useDashboardStats() {
    const [data, setData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const response = await api.get('/products/dashboard_stats/');
                setData(response.data);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch dashboard stats');
                console.error('Dashboard stats error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { data, loading, error };
}

export function useAnalytics(days: number = 30) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const response = await api.get('/products/analytics/', {
                    params: { days }
                });
                setData(response.data);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch analytics');
                console.error('Analytics error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [days]);

    return { data, loading, error, refetch: () => setLoading(true) };
}

export function useApprovalStats() {
    const [data, setData] = useState<ApprovalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const response = await api.get('/products/approval_stats/');
                setData(response.data);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch approval stats');
                console.error('Approval stats error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { data, loading, error };
}
