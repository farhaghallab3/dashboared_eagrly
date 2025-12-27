import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import { MdTrendingUp, MdPeople, MdInventory2, MdCategory } from 'react-icons/md';
import Layout from '../components/Layout';
import { useAnalytics, useDashboardStats } from '../hooks/useStatistics';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#64ffda', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Analytics: React.FC = () => {
    const [days, setDays] = useState(30);
    const { data: analytics, loading: analyticsLoading, error: analyticsError } = useAnalytics(days);
    const { data: stats, loading: statsLoading } = useDashboardStats();
    const { theme } = useTheme();

    const isLoading = analyticsLoading || statsLoading;

    // Prepare timeline data for charts
    const productTimeline = analytics?.product_timeline?.map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        products: item.count
    })) || [];

    const userTimeline = analytics?.user_timeline?.map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: item.count
    })) || [];

    // Category distribution
    const categoryData = analytics?.products_by_category?.map((cat, index) => ({
        name: cat.name,
        value: cat.product_count,
        color: COLORS[index % COLORS.length]
    })) || [];

    // Status distribution
    const statusData = analytics?.products_by_status?.map((status) => ({
        name: status.status.charAt(0).toUpperCase() + status.status.slice(1),
        value: status.count,
        color: status.status === 'active' ? '#22c55e' : status.status === 'pending' ? '#f59e0b' : '#6b7280'
    })) || [];

    // University distribution
    const universityData = analytics?.products_by_university?.slice(0, 5).map((uni, index) => ({
        name: uni.university || 'Not Specified',
        value: uni.count,
        color: COLORS[index % COLORS.length]
    })) || [];

    const tooltipStyle = {
        backgroundColor: theme === 'dark' ? '#0f1627' : '#ffffff',
        borderColor: 'var(--border-color)',
        color: theme === 'dark' ? '#fff' : '#1a202c'
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold leading-tight tracking-tight" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
                    <p className="text-base font-normal leading-normal" style={{ color: 'var(--text-secondary)' }}>
                        Deep insights into your platform's performance
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Time Range:</span>
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="rounded-lg px-3 py-2 text-sm"
                        style={{
                            backgroundColor: 'var(--input-bg)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                        <option value={365}>Last year</option>
                    </select>
                </div>
            </div>

            {analyticsError && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
                    Error loading analytics: {analyticsError}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col gap-2 rounded-xl p-6" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(100, 255, 218, 0.2)' }}>
                            <span style={{ color: 'var(--accent-primary)' }} className="text-xl"><MdInventory2 /></span>
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Products</p>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {isLoading ? '...' : stats?.products?.total || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl p-6" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                            <span className="text-green-500 text-xl"><MdTrendingUp /></span>
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>New (Last {days} days)</p>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {isLoading ? '...' : stats?.products?.last_30_days || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl p-6" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                            <span className="text-blue-500 text-xl"><MdPeople /></span>
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Users</p>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {isLoading ? '...' : stats?.users?.total || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl p-6" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                            <span className="text-purple-500 text-xl"><MdCategory /></span>
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Categories</p>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {isLoading ? '...' : stats?.categories?.top_categories?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Timeline Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="rounded-xl p-6" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Product Listings Over Time</h3>
                    <div className="h-[250px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border-color)' }}></div>
                            </div>
                        ) : productTimeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={productTimeline}>
                                    <defs>
                                        <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#64ffda" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#64ffda" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={12} />
                                    <YAxis stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={12} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Area type="monotone" dataKey="products" stroke="#64ffda" strokeWidth={2} fillOpacity={1} fill="url(#colorProducts)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>No data for selected period</div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl p-6" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>User Registrations Over Time</h3>
                    <div className="h-[250px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border-color)' }}></div>
                            </div>
                        ) : userTimeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={userTimeline}>
                                    <XAxis dataKey="date" stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={12} />
                                    <YAxis stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={12} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>No data for selected period</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Products by Category */}
                <div className="rounded-xl p-6" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Products by Category</h3>
                    <div className="h-[250px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border-color)' }}></div>
                            </div>
                        ) : categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical">
                                    <XAxis type="number" stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={12} />
                                    <YAxis type="category" dataKey="name" stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={11} width={80} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {categoryData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>No category data</div>
                        )}
                    </div>
                </div>

                {/* Products by Status */}
                <div className="rounded-xl p-6" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Products by Status</h3>
                    <div className="h-[250px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border-color)' }}></div>
                            </div>
                        ) : statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        dataKey="value"
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                        labelLine={false}
                                    >
                                        {statusData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>No status data</div>
                        )}
                    </div>
                </div>

                {/* Products by University */}
                <div className="rounded-xl p-6" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Top Universities</h3>
                    <div className="h-[250px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border-color)' }}></div>
                            </div>
                        ) : universityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={universityData}>
                                    <XAxis dataKey="name" stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={10} />
                                    <YAxis stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={12} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {universityData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>No university data</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Products Table */}
            {analytics?.top_products && analytics.top_products.length > 0 && (
                <div className="rounded-xl" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                    <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Top Products</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                    <th className="p-4 font-medium">ID</th>
                                    <th className="p-4 font-medium">Title</th>
                                    <th className="p-4 font-medium">Category</th>
                                    <th className="p-4 font-medium text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.top_products.map((product: any) => (
                                    <tr key={product.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td className="p-4 font-medium" style={{ color: 'var(--accent-primary)' }}>#{product.id}</td>
                                        <td className="p-4" style={{ color: 'var(--text-primary)', opacity: 0.8 }}>{product.title}</td>
                                        <td className="p-4" style={{ color: 'var(--text-secondary)' }}>{product.category__name || 'Uncategorized'}</td>
                                        <td className="p-4 text-right" style={{ color: 'var(--text-primary)', opacity: 0.8 }}>{product.price} EGP</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Date Range Info */}
            {analytics?.date_range && (
                <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Showing data from {new Date(analytics.date_range.start).toLocaleDateString()} to {new Date(analytics.date_range.end).toLocaleDateString()} ({analytics.date_range.days} days)
                </div>
            )}
        </Layout>
    );
};

export default Analytics;
