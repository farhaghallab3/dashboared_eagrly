import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, CartesianGrid, Legend
} from 'recharts';
import { MdAdd, MdDownload, MdBarChart, MdPieChart, MdTableChart, MdShowChart, MdClose, MdAspectRatio } from 'react-icons/md';
import { Toaster, toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { useDashboardStats } from '../hooks/useStatistics';
import { getProducts } from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';

const StatCard = ({ title, value, change, isNegative = false, isLoading = false }: any) => (
  <div
    className="flex flex-1 flex-col gap-3 rounded-2xl backdrop-blur-xl p-6 transition-all duration-300 hover:shadow-lg"
    style={{
      border: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-card)',
      boxShadow: 'var(--card-hover-shadow)'
    }}
  >
    <p style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium leading-normal uppercase tracking-wide">{title}</p>
    <p style={{ color: 'var(--text-primary)' }} className="tracking-tight text-3xl font-bold leading-tight">
      {isLoading ? <span className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }} /> : value}
    </p>
    <p className="text-sm font-medium leading-normal" style={{ color: isNegative ? '#ef4444' : 'var(--accent-primary)' }}>
      {change}
    </p>
  </div>
);

const Dashboard: React.FC = () => {
  const { data: stats, loading: statsLoading } = useDashboardStats();
  const [showAddWidget, setShowAddWidget] = React.useState(false);

  // Widget Types
  type WidgetType = 'stat_total_products' | 'stat_new_users' | 'stat_pending' | 'stat_active' | 'chart_category' | 'chart_status' | 'table_sellers';

  interface Widget {
    id: string;
    type: WidgetType;
    colSpan: number;
  }

  // Initial State
  const [widgets, setWidgets] = React.useState<Widget[]>([
    { id: '1', type: 'stat_total_products', colSpan: 3 },
    { id: '2', type: 'stat_new_users', colSpan: 3 },
    { id: '3', type: 'stat_pending', colSpan: 3 },
    { id: '4', type: 'stat_active', colSpan: 3 },
    { id: '5', type: 'chart_category', colSpan: 6 },
    { id: '6', type: 'chart_status', colSpan: 6 },
    { id: '7', type: 'table_sellers', colSpan: 12 },
  ]);

  const getDefaultColSpan = (type: WidgetType): number => {
    switch (type) {
      case 'stat_total_products':
      case 'stat_new_users':
      case 'stat_pending':
      case 'stat_active':
        return 3;
      case 'chart_category':
      case 'chart_status':
        return 6;
      case 'table_sellers':
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

  const toggleWidgetSize = (id: string) => {
    setWidgets(widgets.map(w => {
      if (w.id === id) {
        // Cycle sizes
        const sizes = [3, 4, 6, 8, 12];
        const currentIndex = sizes.indexOf(w.colSpan);
        const nextSize = sizes[(currentIndex + 1) % sizes.length];
        return { ...w, colSpan: nextSize };
      }
      return w;
    }));
  };

  const [draggedItem, setDraggedItem] = React.useState<Widget | null>(null);

  const onDragStart = (e: React.DragEvent, widget: Widget) => {
    // Prevent drag if clicking the resize button
    if ((e.target as HTMLElement).closest('.resize-btn')) {
      e.preventDefault();
      return;
    }
    setDraggedItem(widget);
    e.dataTransfer.effectAllowed = 'move';
    // Set a transparent drag image or similar if needed, default is usually fine
    // e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const onDrop = (e: React.DragEvent, targetWidget: Widget) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetWidget.id) return;

    const newWidgets = [...widgets];
    const draggedIndex = newWidgets.findIndex(w => w.id === draggedItem.id);
    const targetIndex = newWidgets.findIndex(w => w.id === targetWidget.id);

    // Remove dragged item
    newWidgets.splice(draggedIndex, 1);

    // Insert at new position (adjusting for removal if dragging forward)
    // If we dragged from index 0 to index 2 (Forward):
    // Original: [A, B, C]. Drag A to C.
    // draggedIndex=0, targetIndex=2.
    // After splice(0, 1): [B, C].
    // Target C is now at index 1. 
    // We want to insert 'A' such that it pushes 'C' to the right? No, users usually expect insert-before or insert-after depending on half-way point.
    // Simple "Insert Before Target" logic:
    // If targetIndex > draggedIndex, we need to decrement targetIndex by 1 because the array shifted left.
    // If targetIndex < draggedIndex, the array shift happened after the target, so targetIndex is stable.
    const insertionIndex = targetIndex;

    // Wait, let's verify visual logic.
    // [A, B, C]. targetIndex = 2 (C). 
    // draggedIndex = 0 (A).
    // splice(0, 1) -> [B, C].
    // insertionIndex = 2-1 = 1.
    // splice(1, 0, A) -> [B, A, C]. 
    // Effect: A moved between B and C.
    // If I wanted to swap with C (replace C's visual slot): I should insert AT C's new index?
    // C's new index is 1. If I insert at 1, I get [B, A, C].
    // If I drop ON C, usually I expect to take C's place, pushing C forward.
    // So [B, A, C].
    // This seems correct for "Insert Before".

    newWidgets.splice(insertionIndex, 0, draggedItem);

    setWidgets(newWidgets);
    setDraggedItem(null);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  // Helper to get nested values safely
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // Export products CSV (Existing logic)
  const [exporting, setExporting] = React.useState(false);
  const handleExportProducts = async () => {
    setExporting(true);
    try {
      const list = await getProducts({ page_size: 10000 });
      const rows = Array.isArray(list) ? list : (list && Array.isArray((list as any).results) ? (list as any).results : []);
      if (!rows.length) return;

      const styles = `
        body{font-family:Inter, Arial, Helvetica, sans-serif; color:#0b0b0b}
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        h1{font-size:18px;margin:0}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}
        th{background:#f6f6f6}
        @media print { @page { size: A4 portrait; margin: 15mm } }
      `.trim();

      const headerHtml = `<div class="header"><h1>Products Export</h1><div>Generated: ${new Date().toLocaleString()}</div></div>`;
      const headers = ['ID', 'Title', 'Price', 'Status', 'Category', 'Seller', 'Created At'];
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Products Export</title><style>${styles}</style></head><body>
        ${headerHtml}
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map((r: any) => `
              <tr>
                <td>${r.id ?? ''}</td>
                <td>${String(r.title ?? '').replace(/</g, '&lt;')}</td>
                <td>${String(r.price ?? '').replace(/</g, '&lt;')}</td>
                <td>${String(r.status ?? '').replace(/</g, '&lt;')}</td>
                <td>${String(r.category_name ?? r.category ?? '').replace(/</g, '&lt;')}</td>
                <td>${String(r.seller_name ?? r.seller ?? '').replace(/</g, '&lt;')}</td>
                <td>${String(r.created_at ?? '').replace(/</g, '&lt;')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </body></html>`;

      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
        setTimeout(() => { w.focus(); w.print(); }, 500);
      }
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  // Prepare chart data
  const productsByCategory = ((stats?.categories?.top_categories || [])).map((cat: any) => ({
    name: cat.name,
    value: cat.product_count
  }));

  const productsByStatus = [
    { name: 'Active', value: stats?.products?.active || 0, color: 'var(--chart-primary)' },
    { name: 'Pending', value: stats?.products?.pending || 0, color: 'var(--chart-secondary)' },
    { name: 'Inactive', value: stats?.products?.inactive || 0, color: 'var(--chart-muted)' },
  ];

  // Render Widget Helper
  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      // ... (stats cases unchanged) ...
      case 'stat_total_products':
        return (
          <div className="min-h-[140px] h-full">
            <StatCard title="Total Products" value={`${stats?.products?.total || 0}`} change={`+${stats?.products?.last_30_days || 0} this month`} isLoading={statsLoading} />
          </div>
        );
      case 'stat_new_users':
        return (
          <div className="min-h-[140px] h-full">
            <StatCard title="New Users" value={`${stats?.users?.total || 0}`} change={`+${stats?.users?.last_30_days || 0} this month`} isLoading={statsLoading} />
          </div>
        );
      case 'stat_pending':
        return (
          <div className="min-h-[140px] h-full">
            <StatCard title="Pending Ads" value={`${stats?.products?.pending || 0}`} change="" isLoading={statsLoading} />
          </div>
        );
      case 'stat_active':
        return (
          <div className="min-h-[140px] h-full">
            <StatCard title="Active Products" value={`${stats?.products?.active || 0}`} change="" isLoading={statsLoading} />
          </div>
        );
      case 'chart_category':
        return (
          <div className="min-h-[350px] h-full flex flex-col gap-3 rounded-2xl backdrop-blur-xl p-4 sm:p-6 transition-all duration-300 hover:shadow-lg"
            style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium leading-normal uppercase tracking-wide">Products by Category</p>
                <p style={{ color: 'var(--text-primary)' }} className="tracking-tight text-3xl font-bold leading-tight mt-1">{stats?.products?.total || 0} Total</p>
              </div>
            </div>
            <div className="flex-1 w-full mt-4" style={{ minHeight: '300px' }}>
              {statsLoading ? (
                <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary/40"></div></div>
              ) : productsByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productsByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 255, 218, 0.1)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8892b0', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8892b0', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(100, 255, 218, 0.08)' }} contentStyle={{ backgroundColor: '#0f1627', borderColor: 'rgba(100, 255, 218, 0.8)', color: '#fff', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#fff' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {productsByCategory.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--chart-primary)' : 'var(--chart-secondary)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-[#8892b0]">No category data yet</div>}
            </div>
          </div>
        );
      case 'chart_status':
        return (
          <div className="min-h-[350px] h-full flex flex-col gap-3 rounded-2xl backdrop-blur-xl p-4 sm:p-6 transition-all duration-300 hover:shadow-lg"
            style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium leading-normal uppercase tracking-wide">Products by Status</p>
              </div>
            </div>
            <div className="flex-1 w-full mt-4" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={productsByStatus} cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" fill="#8884d8" dataKey="value" label={(entry) => entry.name}>
                    {productsByStatus.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f1627', borderColor: 'rgba(100, 255, 218, 0.8)', color: '#fff', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'table_sellers':
        return (
          <div className="min-h-[200px] h-full flex flex-col rounded-2xl backdrop-blur-xl"
            style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">Top Sellers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}><th className="p-4">Seller</th><th className="p-4">Username</th><th className="p-4 text-right">Products</th></tr></thead>
                <tbody>
                  {(stats?.sellers?.top_sellers || []).length > 0 ? stats.sellers.top_sellers.map((seller: any) => (
                    <tr key={seller.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td className="p-4" style={{ color: 'var(--text-primary)' }}>{seller.first_name} {seller.last_name}</td>
                      <td className="p-4" style={{ color: 'var(--accent-primary)' }}>{seller.username}</td>
                      <td className="p-4 text-right" style={{ color: 'var(--text-primary)' }}>{seller.product_count}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="p-6 text-center text-[#8892b0]">No seller data available yet</td></tr>
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
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Add to Dashboard</h3>
              <button onClick={() => setShowAddWidget(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <div className="transform rotate-45"><MdAdd size={24} /></div>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'stat_total_products', label: 'Total Products', icon: <MdShowChart size={24} /> },
                { type: 'stat_new_users', label: 'New Users', icon: <MdShowChart size={24} /> },
                { type: 'stat_pending', label: 'Pending Ads', icon: <MdShowChart size={24} /> },
                { type: 'stat_active', label: 'Active Products', icon: <MdShowChart size={24} /> },
                { type: 'chart_category', label: 'By Category', icon: <MdBarChart size={24} /> },
                { type: 'chart_status', label: 'By Status', icon: <MdPieChart size={24} /> },
                { type: 'table_sellers', label: 'Top Sellers', icon: <MdTableChart size={24} /> },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => addWidget(item.type as WidgetType)}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border transition-all hover:scale-105"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--hover-bg)' }}
                >
                  <span style={{ color: 'var(--accent-primary)' }}>{item.icon}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 style={{ color: 'var(--text-primary)' }} className="text-4xl font-bold leading-tight tracking-tight">Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-base font-normal leading-normal">Welcome back, here's a summary of your store's performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddWidget(true)}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold hover:shadow-lg transition-all duration-300 transform active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              color: 'var(--bg-primary)'
            }}
          >
            <MdAdd size={20} />
            <span>Add Widget</span>
          </button>
          <button
            onClick={handleExportProducts}
            disabled={statsLoading || exporting}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-300 disabled:opacity-50"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--hover-bg)',
              color: 'var(--accent-primary)'
            }}
          >
            {exporting ? <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }} /> : <MdDownload size={20} />}
            <span>{exporting ? ' PDF...' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-max pb-10">
        {widgets.map((widget) => (
          <React.Fragment key={widget.id}>
            {renderWidgetWrapper(widget, renderWidget(widget))}
          </React.Fragment>
        ))}
      </div>
    </Layout>
  );
};

export default Dashboard;
