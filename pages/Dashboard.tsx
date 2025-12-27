import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, CartesianGrid, Legend
} from 'recharts';
import { MdAdd, MdDownload } from 'react-icons/md';
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

  // Calculate changes for stats (comparing last 30 days)
  const getChange = (current: number, previous: number) => {
    if (!current || !previous) return '+0.0%';
    const change = ((current - previous) / Math.abs(previous)) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  // Prepare chart data from real stats
  const productsByCategory = ((stats?.categories?.top_categories || [])).map((cat: any) => ({
    name: cat.name,
    value: cat.product_count
  }));

  const productsByStatus = [
    { name: 'Active', value: stats?.products?.active || 0, color: '#22c55e' },
    { name: 'Pending', value: stats?.products?.pending || 0, color: '#eab308' },
    { name: 'Inactive', value: stats?.products?.inactive || 0, color: '#6b7280' },
  ];

  // Export products CSV
  const [exporting, setExporting] = React.useState(false);

  const handleExportProducts = async () => {
    setExporting(true);
    try {
      const list = await getProducts({ page_size: 10000 });
      const rows = Array.isArray(list) ? list : (list && Array.isArray((list as any).results) ? (list as any).results : []);
      if (!rows.length) return;

      // Build printable HTML arranged as a table (user can Save as PDF from print dialog)
      const styles = `
        body{font-family:Inter, Arial, Helvetica, sans-serif; color:#0b0b0b}
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        h1{font-size:18px;margin:0}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}
        th{background:#f6f6f6}
        .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
        .card{border:1px solid #ddd;padding:8px}
        @media print { @page { size: A4 portrait; margin: 15mm } }
      `.trim();

      const headerHtml = `<div class="header"><h1>Products Export</h1><div>Generated: ${new Date().toLocaleString()}</div></div>`;

      // Create table rows
      const headers = ['ID', 'Title', 'Price', 'Status', 'Category', 'Seller', 'Created At'];
      const rowsHtml = rows.map((r: any) => `
        <tr>
          <td>${r.id ?? ''}</td>
          <td>${escapeHtml(String(r.title ?? ''))}</td>
          <td>${escapeHtml(String(r.price ?? ''))}</td>
          <td>${escapeHtml(String(r.status ?? ''))}</td>
          <td>${escapeHtml(String(r.category_name ?? r.category ?? ''))}</td>
          <td>${escapeHtml(String(r.seller_name ?? r.seller ?? ''))}</td>
          <td>${escapeHtml(String(r.created_at ?? ''))}</td>
        </tr>
      `).join('\n');

      const tableHtml = `
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      `;

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Products Export</title><style>${styles}</style></head><body>${headerHtml}${tableHtml}</body></html>`;

      const w = window.open('', '_blank');
      if (!w) throw new Error('Unable to open new window for export (popup blocked)');
      w.document.write(html);
      w.document.close();
      // Give browser a moment to render then trigger print
      setTimeout(() => {
        try {
          w.focus();
          w.print();
          // Do not auto-close so user can save the PDF; close after a short delay optional
          // w.close();
        } catch (err) {
          console.error('Print failed', err);
        }
      }, 500);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 style={{ color: 'var(--text-primary)' }} className="text-4xl font-bold leading-tight tracking-tight">Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-base font-normal leading-normal">Welcome back, here's a summary of your store's performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold hover:shadow-lg transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              color: 'var(--bg-primary)'
            }}
          >
            <MdAdd />
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
            {exporting ? <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }} /> : <MdDownload />}
            <span>{exporting ? ' PDF...' : 'Export Products (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Products" value={`${stats?.products?.total || 0}`} change={`+${stats?.products?.last_30_days || 0} this month`} isLoading={statsLoading} />
        <StatCard title="New Users" value={`${stats?.users?.total || 0}`} change={`+${stats?.users?.last_30_days || 0} this month`} isLoading={statsLoading} />
        <StatCard title="Pending Ads" value={`${stats?.products?.pending || 0}`} change="" isLoading={statsLoading} />
        <StatCard title="Active Products" value={`${stats?.products?.active || 0}`} change="" isLoading={statsLoading} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Products by Category */}
        <div
          className="flex flex-1 flex-col gap-3 rounded-2xl backdrop-blur-xl p-6 transition-all duration-300 hover:shadow-lg"
          style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium leading-normal uppercase tracking-wide">Products by Category</p>
              <p style={{ color: 'var(--text-primary)' }} className="tracking-tight text-3xl font-bold leading-tight mt-1">{stats?.products?.total || 0} Total</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }}></span>
                <span style={{ color: 'var(--text-secondary)' }} className="text-xs">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent-secondary)' }}></span>
                <span style={{ color: 'var(--text-secondary)' }} className="text-xs">Secondary</span>
              </div>
            </div>
          </div>
          <div className="h-[220px] w-full mt-4">
            {statsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary/40"></div>
              </div>
            ) : productsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productsByCategory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 255, 218, 0.1)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8892b0', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8892b0', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(100, 255, 218, 0.08)' }}
                    contentStyle={{
                      backgroundColor: '#0f1627',
                      borderColor: 'rgba(100, 255, 218, 0.3)',
                      color: '#fff',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(100, 255, 218, 0.15)'
                    }}
                    labelStyle={{ color: '#64ffda', fontWeight: 600 }}
                    formatter={(value: any) => [`${value} products`, 'Count']}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={50}>
                    {productsByCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#64ffda' : '#00c2ff'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#8892b0]">No category data yet</div>
            )}
          </div>
          {/* Category List */}
          {productsByCategory.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 pt-4 border-t border-primary/10">
              {productsByCategory.map((cat: any, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: index % 2 === 0 ? 'rgba(100, 255, 218, 0.1)' : 'rgba(0, 194, 255, 0.1)',
                    borderColor: index % 2 === 0 ? 'rgba(100, 255, 218, 0.3)' : 'rgba(0, 194, 255, 0.3)',
                    color: index % 2 === 0 ? '#64ffda' : '#00c2ff'
                  }}
                >
                  {cat.name}: {cat.value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Products by Status */}
        <div
          className="flex flex-1 flex-col gap-3 rounded-2xl backdrop-blur-xl p-6"
          style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium leading-normal uppercase tracking-wide">Products by Status</p>
              <p style={{ color: 'var(--text-primary)' }} className="tracking-tight text-3xl font-bold leading-tight mt-1">{stats?.products?.total || 0} Ads</p>
            </div>
          </div>
          <div className="h-[200px] w-full mt-4">
            {statsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary/40"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => entry.name}
                  >
                    {productsByStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f1627', borderColor: 'rgba(100, 255, 218, 0.2)', color: '#fff', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Sellers Section */}
      {stats?.sellers?.top_sellers && stats.sellers.top_sellers.length > 0 ? (
        <div className="flex flex-col rounded-2xl backdrop-blur-xl overflow-hidden" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">Top Sellers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th className="p-4 font-semibold uppercase tracking-wide text-xs">Seller</th>
                  <th className="p-4 font-semibold uppercase tracking-wide text-xs">Username</th>
                  <th className="p-4 font-semibold uppercase tracking-wide text-xs text-right">Products</th>
                </tr>
              </thead>
              <tbody>
                {stats.sellers.top_sellers.map((seller: any) => (
                  <tr key={seller.id} className="transition-all duration-300" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="p-4" style={{ color: 'var(--text-primary)', opacity: 0.8 }}>{seller.first_name || 'Unknown'} {seller.last_name || ''}</td>
                    <td className="p-4 font-medium" style={{ color: 'var(--accent-primary)' }}>{seller.username}</td>
                    <td className="p-4 text-right font-semibold" style={{ color: 'var(--text-primary)', opacity: 0.8 }}>{seller.product_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col rounded-2xl backdrop-blur-xl p-8 text-center" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No seller data available yet</p>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
