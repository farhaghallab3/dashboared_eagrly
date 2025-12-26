import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { MdAdd, MdDownload } from 'react-icons/md';
import Layout from '../components/Layout';
import { useDashboardStats } from '../hooks/useStatistics';
import { getProducts } from '../services/apiClient';

const StatCard = ({ title, value, change, isNegative = false, isLoading = false }: any) => (
  <div className="flex flex-1 flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-6">
    <p className="text-white/80 text-base font-medium leading-normal">{title}</p>
    <p className="text-white tracking-tight text-3xl font-bold leading-tight">{isLoading ? <span className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin border-white/30" /> : value}</p>
    <p className={`${isNegative ? 'text-red-400' : 'text-primary'} text-base font-medium leading-normal`}>
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-white text-3xl font-bold leading-tight tracking-tight">Admin Dashboard</h1>
          <p className="text-white/60 text-base font-normal leading-normal">Welcome back, here's a summary of your store's performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center gap-2 rounded-lg bg-primary/20 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/30 transition">
            <MdAdd />
            <span>Add Widget</span>
          </button>
          <button onClick={handleExportProducts} disabled={statsLoading || exporting} className="flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5 transition disabled:opacity-50">
            {exporting ? <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white/30" /> : <MdDownload />}
            <span>{exporting ? ' PDF...' : 'Export Products (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total Products" value={`${stats?.products?.total || 0}`} change={`+${stats?.products?.last_30_days || 0} this month`} isLoading={statsLoading} />
        <StatCard title="New Users" value={`${stats?.users?.total || 0}`} change={`+${stats?.users?.last_30_days || 0} this month`} isLoading={statsLoading} />
        <StatCard title="Pending Ads" value={`${stats?.products?.pending || 0}`} change="" isLoading={statsLoading} />
        <StatCard title="Active Products" value={`${stats?.products?.active || 0}`} change="" isLoading={statsLoading} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Products by Category */}
        <div className="flex flex-1 flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-base font-medium leading-normal">Products by Category</p>
              <p className="text-white tracking-tight text-[32px] font-bold leading-tight truncate">{stats?.products?.total || 0} Total</p>
            </div>
          </div>
          <div className="h-[200px] w-full mt-4">
            {statsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-white/30"></div>
              </div>
            ) : productsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productsByCategory}>
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#112120', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {productsByCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#27e7dd' : 'rgba(39, 231, 221, 0.5)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">No category data yet</div>
            )}
          </div>
        </div>

        {/* Products by Status */}
        <div className="flex flex-1 flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-base font-medium leading-normal">Products by Status</p>
              <p className="text-white tracking-tight text-[32px] font-bold leading-tight truncate">{stats?.products?.total || 0} Ads</p>
            </div>
          </div>
          <div className="h-[200px] w-full mt-4">
            {statsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-white/30"></div>
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
                  <Tooltip contentStyle={{ backgroundColor: '#112120', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Sellers Section */}
      {stats?.sellers?.top_sellers && stats.sellers.top_sellers.length > 0 ? (
        <div className="flex flex-col rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-white text-lg font-bold">Top Sellers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/60">
                  <th className="p-4 font-medium">Seller</th>
                  <th className="p-4 font-medium">Username</th>
                  <th className="p-4 font-medium text-right">Products</th>
                </tr>
              </thead>
              <tbody>
                {stats.sellers.top_sellers.map((seller: any) => (
                  <tr key={seller.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white/80">{seller.first_name || 'Unknown'} {seller.last_name || ''}</td>
                    <td className="p-4 text-primary font-medium">{seller.username}</td>
                    <td className="p-4 text-white/80 text-right">{seller.product_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-white/40">No seller data available yet</p>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
