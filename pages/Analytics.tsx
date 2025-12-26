import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import { MdTrendingUp, MdPeople, MdInventory2, MdCategory } from 'react-icons/md';
import Layout from '../components/Layout';
import { useAnalytics, useDashboardStats } from '../hooks/useStatistics';

const COLORS = ['#27e7dd', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Analytics: React.FC = () => {
    const [days, setDays] = useState(30);
    const { data: analytics, loading: analyticsLoading, error: analyticsError } = useAnalytics(days);
    const { data: stats, loading: statsLoading } = useDashboardStats();

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

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-white text-3xl font-bold leading-tight tracking-tight">Analytics</h1>
                    <p className="text-white/60 text-base font-normal leading-normal">
                        Deep insights into your platform's performance
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">Time Range:</span>
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                            <span className="text-primary text-xl"><MdInventory2 /></span>
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">Total Products</p>
                            <p className="text-white text-2xl font-bold">
                                {isLoading ? '...' : stats?.products?.total || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                            <span className="text-green-500 text-xl"><MdTrendingUp /></span>
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">New (Last {days} days)</p>
                            <p className="text-white text-2xl font-bold">
                                {isLoading ? '...' : stats?.products?.last_30_days || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                            <span className="text-blue-500 text-xl"><MdPeople /></span>
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">Total Users</p>
                            <p className="text-white text-2xl font-bold">
                                {isLoading ? '...' : stats?.users?.total || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                            <span className="text-purple-500 text-xl"><MdCategory /></span>
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">Categories</p>
                            <p className="text-white text-2xl font-bold">
                                {isLoading ? '...' : stats?.categories?.top_categories?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Timeline Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-white text-lg font-bold mb-4">Product Listings Over Time</h3>
                    <div className="h-[250px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-white/30"></div>
                            </div>
                        ) : productTimeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={productTimeline}>
                                    <defs>
                                        <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#27e7dd" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#27e7dd" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" stroke="#ffffff40" fontSize={12} />
                                    <YAxis stroke="#ffffff40" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#112120', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="products" stroke="#27e7dd" strokeWidth={2} fillOpacity={1} fill="url(#colorProducts)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/40">No data for selected period</div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-white text-lg font-bold mb-4">User Registrations Over Time</h3>
                    <div className="h-[250px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-white/30"></div>
                            </div>
                        ) : userTimeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={userTimeline}>
                                    <XAxis dataKey="date" stroke="#ffffff40" fontSize={12} />
                                    <YAxis stroke="#ffffff40" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#112120', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/40">No data for selected period</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Products by Category */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-white text-lg font-bold mb-4">Products by Category</h3>
                    <div className="h-[250px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-white/30"></div>
                            </div>
                        ) : categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical">
                                    <XAxis type="number" stroke="#ffffff40" fontSize={12} />
                                    <YAxis type="category" dataKey="name" stroke="#ffffff40" fontSize={11} width={80} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#112120', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {categoryData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/40">No category data</div>
                        )}
                    </div>
                </div>

                {/* Products by Status */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-white text-lg font-bold mb-4">Products by Status</h3>
                    <div className="h-[250px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-white/30"></div>
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
                                    <Tooltip contentStyle={{ backgroundColor: '#112120', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/40">No status data</div>
                        )}
                    </div>
                </div>

                {/* Products by University */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-white text-lg font-bold mb-4">Top Universities</h3>
                    <div className="h-[250px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-white/30"></div>
                            </div>
                        ) : universityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={universityData}>
                                    <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} angle={-20} textAnchor="end" height={50} />
                                    <YAxis stroke="#ffffff40" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#112120', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {universityData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/40">No university data</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Products Table */}
            {analytics?.top_products && analytics.top_products.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-white text-lg font-bold">Top Products</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/60">
                                    <th className="p-4 font-medium">ID</th>
                                    <th className="p-4 font-medium">Title</th>
                                    <th className="p-4 font-medium">Category</th>
                                    <th className="p-4 font-medium text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.top_products.map((product: any) => (
                                    <tr key={product.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-primary font-medium">#{product.id}</td>
                                        <td className="p-4 text-white/80">{product.title}</td>
                                        <td className="p-4 text-white/60">{product.category__name || 'Uncategorized'}</td>
                                        <td className="p-4 text-white/80 text-right">{product.price} EGP</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Date Range Info */}
            {analytics?.date_range && (
                <div className="mt-6 text-center text-white/40 text-sm">
                    Showing data from {new Date(analytics.date_range.start).toLocaleDateString()} to {new Date(analytics.date_range.end).toLocaleDateString()} ({analytics.date_range.days} days)
                </div>
            )}
        </Layout>
    );
};

export default Analytics;
