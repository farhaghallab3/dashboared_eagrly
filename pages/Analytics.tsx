import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import { MdTrendingUp, MdPeople, MdInventory2, MdCategory, MdAdd, MdClose, MdShowChart, MdBarChart, MdPieChart, MdTableChart, MdAspectRatio } from 'react-icons/md';
import { Toaster, toast } from 'react-hot-toast';
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

    // --- Widget System Setup ---
    const [showAddWidget, setShowAddWidget] = useState(false);

    type WidgetType =
        | 'stat_total_products'
        | 'stat_new_products'
        | 'stat_total_users'
        | 'stat_categories'
        | 'chart_product_timeline'
        | 'chart_user_timeline'
        | 'chart_category_dist'
        | 'chart_status_dist'
        | 'chart_university_dist'
        | 'table_top_products';

    interface Widget {
        id: string;
        type: WidgetType;
        colSpan: number;
    }

    const [widgets, setWidgets] = useState<Widget[]>([
        { id: '1', type: 'stat_total_products', colSpan: 3 },
        { id: '2', type: 'stat_new_products', colSpan: 3 },
        { id: '3', type: 'stat_total_users', colSpan: 3 },
        { id: '4', type: 'stat_categories', colSpan: 3 },
        { id: '5', type: 'chart_product_timeline', colSpan: 6 },
        { id: '6', type: 'chart_user_timeline', colSpan: 6 },
        { id: '7', type: 'chart_category_dist', colSpan: 4 },
        { id: '8', type: 'chart_status_dist', colSpan: 4 },
        { id: '9', type: 'chart_university_dist', colSpan: 4 },
        { id: '10', type: 'table_top_products', colSpan: 12 },
    ]);

    const getDefaultColSpan = (type: WidgetType): number => {
        switch (type) {
            case 'stat_total_products':
            case 'stat_new_products':
            case 'stat_total_users':
            case 'stat_categories':
                return 3;
            case 'chart_product_timeline':
            case 'chart_user_timeline':
                return 6;
            case 'chart_category_dist':
            case 'chart_status_dist':
            case 'chart_university_dist':
                return 4;
            case 'table_top_products':
                return 12;
            default:
                return 12;
        }
    };

    const addWidget = (type: WidgetType) => {
        if (widgets.some(w => w.type === type)) {
            toast.error('Widget already exists!', {
                style: {
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                }
            });
            return;
        }
        const newWidget: Widget = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            colSpan: getDefaultColSpan(type)
        };
        setWidgets([...widgets, newWidget]);
        setShowAddWidget(false);
    };

    const removeWidget = (id: string) => {
        setWidgets(widgets.filter(w => w.id !== id));
    };

    const toggleWidgetSize = (id: string) => {
        setWidgets(widgets.map(w => {
            if (w.id === id) {
                // Cycle sizes: 3 -> 4 -> 6 -> 8 -> 12 -> 3
                const sizes = [3, 4, 6, 8, 12];
                const currentIndex = sizes.indexOf(w.colSpan);
                const nextSize = sizes[(currentIndex + 1) % sizes.length];
                return { ...w, colSpan: nextSize };
            }
            return w;
        }));
    };

    // --- Drag and Drop Logic ---
    const [draggedItem, setDraggedItem] = useState<Widget | null>(null);

    const onDragStart = (e: React.DragEvent, widget: Widget) => {
        // Prevent drag if clicking the resize button
        if ((e.target as HTMLElement).closest('.resize-btn')) {
            e.preventDefault();
            return;
        }
        setDraggedItem(widget);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent, targetWidget: Widget) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === targetWidget.id) return;

        const newWidgets = [...widgets];
        const draggedIndex = newWidgets.findIndex(w => w.id === draggedItem.id);
        const targetIndex = newWidgets.findIndex(w => w.id === targetWidget.id);

        newWidgets.splice(draggedIndex, 1);
        newWidgets.splice(targetIndex, 0, draggedItem);

        setWidgets(newWidgets);
        setDraggedItem(null);
    };

    // --- Data Preparation ---
    const productTimeline = analytics?.product_timeline?.map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        products: item.count
    })) || [];

    const userTimeline = analytics?.user_timeline?.map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: item.count
    })) || [];

    const categoryData = analytics?.products_by_category?.map((cat, index) => ({
        name: cat.name,
        value: cat.product_count,
        color: COLORS[index % COLORS.length]
    })) || [];

    const statusData = analytics?.products_by_status?.map((status) => ({
        name: status.status.charAt(0).toUpperCase() + status.status.slice(1),
        value: status.count,
        color: status.status === 'active' ? '#22c55e' : status.status === 'pending' ? '#f59e0b' : '#6b7280'
    })) || [];

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

    // --- Widget Renderers ---
    const renderWidget = (widget: Widget) => {
        switch (widget.type) {
            case 'stat_total_products':
                return (
                    <div className="flex flex-col gap-2 rounded-xl p-4 sm:p-6 h-full" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
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
                );
            case 'stat_new_products':
                return (
                    <div className="flex flex-col gap-2 rounded-xl p-4 sm:p-6 h-full" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
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
                );
            case 'stat_total_users':
                return (
                    <div className="flex flex-col gap-2 rounded-xl p-4 sm:p-6 h-full" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
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
                );
            case 'stat_categories':
                return (
                    <div className="flex flex-col gap-2 rounded-xl p-4 sm:p-6 h-full" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
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
                );
            case 'chart_product_timeline':
                return (
                    <div className="rounded-xl p-4 sm:p-6 h-full" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Product Listings</h3>
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
                                        <XAxis dataKey="date" stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={10} tick={{ fontSize: 10 }} />
                                        <YAxis stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={10} tick={{ fontSize: 10 }} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Area type="monotone" dataKey="products" stroke="#64ffda" strokeWidth={2} fillOpacity={1} fill="url(#colorProducts)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>No data for selected period</div>
                            )}
                        </div>
                    </div>
                );
            case 'chart_user_timeline':
                return (
                    <div className="rounded-xl p-4 sm:p-6 h-full" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>User Registrations</h3>
                        <div className="h-[250px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border-color)' }}></div>
                                </div>
                            ) : userTimeline.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={userTimeline}>
                                        <XAxis dataKey="date" stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={10} tick={{ fontSize: 10 }} />
                                        <YAxis stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={10} tick={{ fontSize: 10 }} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>No data for selected period</div>
                            )}
                        </div>
                    </div>
                );
            case 'chart_category_dist':
                return (
                    <div className="rounded-xl p-4 sm:p-6 h-full" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Products by Category</h3>
                        <div className="h-[250px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border-color)' }}></div>
                                </div>
                            ) : categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryData} layout="vertical">
                                        <XAxis type="number" stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={10} tick={{ fontSize: 10 }} />
                                        <YAxis type="category" dataKey="name" stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={10} width={70} tick={{ fontSize: 10 }} />
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
                );
            case 'chart_status_dist':
                return (
                    <div className="rounded-xl p-4 sm:p-6 h-full" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
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
                                            innerRadius="50%"
                                            outerRadius="80%"
                                            dataKey="value"
                                            label={(entry) => `${entry.name}`}
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
                );
            case 'chart_university_dist':
                return (
                    <div className="rounded-xl p-4 sm:p-6 h-full" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Top Universities</h3>
                        <div className="h-[250px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border-color)' }}></div>
                                </div>
                            ) : universityData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={universityData}>
                                        <XAxis dataKey="name" stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={10} tick={{ fontSize: 10 }} />
                                        <YAxis stroke={theme === 'dark' ? '#ffffff40' : '#4a556840'} fontSize={10} tick={{ fontSize: 10 }} />
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
                );
            case 'table_top_products':
                return (
                    <div className="rounded-xl h-full" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
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
                                    {analytics?.top_products && analytics.top_products.length > 0 ? (
                                        analytics.top_products.map((product: any) => (
                                            <tr key={product.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td className="p-4 font-medium" style={{ color: 'var(--accent-primary)' }}>#{product.id}</td>
                                                <td className="p-4" style={{ color: 'var(--text-primary)', opacity: 0.8 }}>{product.title}</td>
                                                <td className="p-4" style={{ color: 'var(--text-secondary)' }}>{product.category__name || 'Uncategorized'}</td>
                                                <td className="p-4 text-right" style={{ color: 'var(--text-primary)', opacity: 0.8 }}>{product.price} EGP</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={4} className="p-6 text-center text-[#8892b0]">No active product data available</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    const getColSpanClass = (span: number) => {
        switch (span) {
            case 3: return 'col-span-12 sm:col-span-6 lg:col-span-3';
            case 4: return 'col-span-12 sm:col-span-6 lg:col-span-4';
            case 6: return 'col-span-12 lg:col-span-6';
            case 8: return 'col-span-12 lg:col-span-8';
            case 12: return 'col-span-12';
            default: return 'col-span-12';
        }
    };

    const renderWidgetWrapper = (widget: Widget, content: React.ReactNode) => (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, widget)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, widget)}
            className={`relative group h-full cursor-move transition-all duration-200 ${getColSpanClass(widget.colSpan)} ${draggedItem?.id === widget.id ? 'opacity-50 scale-95' : 'hover:-translate-y-1'}`}
        >
            <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button
                    onClick={() => toggleWidgetSize(widget.id)}
                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 resize-btn"
                    title="Resize Widget"
                >
                    <MdAspectRatio size={16} />
                </button>
                <button
                    onClick={() => removeWidget(widget.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    title="Remove Widget"
                >
                    <MdClose size={16} />
                </button>
            </div>
            {content}
        </div>
    );

    return (
        <Layout>
            <Toaster position="top-right" />

            {/* Add Widget Modal */}
            {showAddWidget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Add to Analysis</h3>
                            <button onClick={() => setShowAddWidget(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="transform rotate-45"><MdAdd size={24} /></div>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                            {[
                                { type: 'stat_total_products', label: 'Total Products', icon: <MdShowChart size={24} /> },
                                { type: 'stat_new_products', label: 'New Products', icon: <MdShowChart size={24} /> },
                                { type: 'stat_total_users', label: 'Total Users', icon: <MdShowChart size={24} /> },
                                { type: 'stat_categories', label: 'Total Categories', icon: <MdShowChart size={24} /> },
                                { type: 'chart_product_timeline', label: 'Product Timeline', icon: <MdBarChart size={24} /> },
                                { type: 'chart_user_timeline', label: 'User Timeline', icon: <MdBarChart size={24} /> },
                                { type: 'chart_category_dist', label: 'Category Dist.', icon: <MdBarChart size={24} /> },
                                { type: 'chart_status_dist', label: 'Status Dist.', icon: <MdPieChart size={24} /> },
                                { type: 'chart_university_dist', label: 'University Dist.', icon: <MdBarChart size={24} /> },
                                { type: 'table_top_products', label: 'Top Products', icon: <MdTableChart size={24} /> },
                            ].map((item) => {
                                const isAdded = widgets.some(w => w.type === item.type);
                                return (
                                    <button
                                        key={item.type}
                                        onClick={() => !isAdded && addWidget(item.type as WidgetType)}
                                        disabled={isAdded}
                                        className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${isAdded ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                        style={{
                                            borderColor: isAdded ? 'var(--accent-primary)' : 'var(--border-color)',
                                            backgroundColor: isAdded ? 'rgba(255, 179, 0, 0.1)' : 'var(--hover-bg)'
                                        }}
                                    >
                                        <span style={{ color: 'var(--accent-primary)' }}>{item.icon}</span>
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                                        {isAdded && (
                                            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
                                                ✓ Added
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

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
                    <button
                        onClick={() => setShowAddWidget(true)}
                        className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold hover:shadow-lg transition-all duration-300 ml-2"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                            color: 'var(--bg-primary)'
                        }}
                    >
                        <MdAdd size={20} />
                        <span>Add Widget</span>
                    </button>
                </div>
            </div>

            {analyticsError && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
                    Error loading analytics: {analyticsError}
                </div>
            )}

            {/* Dynamic Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-max pb-10">
                {widgets.map((widget) => (
                    <React.Fragment key={widget.id}>
                        {renderWidgetWrapper(widget, renderWidget(widget))}
                    </React.Fragment>
                ))}
            </div>

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
