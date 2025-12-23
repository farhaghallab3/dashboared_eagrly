import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { MdAdd, MdDownload, MdSearch } from 'react-icons/md';
import Layout from '../components/Layout';
import usePayments from '../hooks/usePayments';
import useProducts from '../hooks/useProducts';
import api from '../services/api';
import { getProducts } from '../services/apiClient';

// Mock Data
const revenueData = [
  { name: 'Week 1', value: 30000 },
  { name: 'Week 2', value: 45000 },
  { name: 'Week 3', value: 38000 },
  { name: 'Week 4', value: 55000 },
];

const productData = [
  { name: 'Prod A', value: 400 },
  { name: 'Prod B', value: 300 },
  { name: 'Prod C', value: 550 },
  { name: 'Prod D', value: 200 },
  { name: 'Prod E', value: 600 },
];

// recent orders will come from payments (most recent first)

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
  const { data: payments, loading: paymentsLoading } = usePayments();
  const { data: products, loading: productsLoading } = useProducts();

  // Normalize payments and products responses (handle paginated shapes)
  const paymentsArray = Array.isArray(payments) ? payments : (payments && Array.isArray((payments as any)?.results) ? (payments as any).results : []);
  const productsArray = Array.isArray(products) ? products : (products && Array.isArray((products as any)?.results) ? (products as any).results : []);

  // Fetch users list (no hook exists) — call API directly so we can compute historical deltas
  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [usersLoading, setUsersLoading] = React.useState(true);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setUsersLoading(true);
      try {
        const res = await api.get('/users/');
        const payload = res.data;
        const list = Array.isArray(payload) ? payload : Array.isArray((payload as any)?.results) ? (payload as any).results : [];
        if (mounted) setUsersList(list);
      } catch (err) {
        if (mounted) setUsersList([]);
      } finally {
        if (mounted) setUsersLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Compute totals and historical deltas (compare last 30 days vs previous 30 days)
  const toDate = (s?: string) => s ? new Date(s) : null;
  const now = new Date();
  const days = 30;
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevPeriodStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

  const totalSales = (paymentsArray || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const salesThis = (paymentsArray || []).filter((p: any) => {
    const d = toDate(p.created_at || p.start_date);
    return d && d >= periodStart && d <= now;
  }).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const salesPrev = (paymentsArray || []).filter((p: any) => {
    const d = toDate(p.created_at || p.start_date);
    return d && d >= prevPeriodStart && d < periodStart;
  }).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  const usersThis = (usersList || []).filter((u: any) => {
    const d = toDate(u.created_at);
    return d && d >= periodStart && d <= now;
  }).length;
  const usersPrev = (usersList || []).filter((u: any) => {
    const d = toDate(u.created_at);
    return d && d >= prevPeriodStart && d < periodStart;
  }).length;

  const pendingThis = (paymentsArray || []).filter((p: any) => {
    const d = toDate(p.created_at || p.start_date);
    return p.status === 'pending' && d && d >= periodStart && d <= now;
  }).length;
  const pendingPrev = (paymentsArray || []).filter((p: any) => {
    const d = toDate(p.created_at || p.start_date);
    return p.status === 'pending' && d && d >= prevPeriodStart && d < periodStart;
  }).length;

  const activeProducts = (productsArray || []).length;

  const recentPayments = (paymentsArray || []).slice(0, 6).map((p: any) => ({
    id: `#PAY${p.id}`,
    customer: p.user_name || `User ${p.user}`,
    date: p.start_date || p.created_at || '',
    status: p.status,
    total: `$${p.amount}`,
  }));

  const computeChange = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return { label: '0.0%', isNegative: false };
    if (previous === 0) return { label: `${(current * 100).toFixed(1)}%`, isNegative: false };
    const change = ((current - previous) / Math.abs(previous)) * 100;
    return { label: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, isNegative: change < 0 };
  };

  const salesChange = computeChange(salesThis, salesPrev);
  const usersChange = computeChange(usersThis, usersPrev);
  const pendingChange = computeChange(pendingThis, pendingPrev);

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
      const headers = ['ID','Title','Price','Status','Category','Seller','Created At'];
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
          <button onClick={handleExportProducts} disabled={productsLoading || exporting} className="flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5 transition disabled:opacity-50">
            {exporting ? <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white/30" /> : <MdDownload />}
            <span>{exporting ? 'Preparing PDF...' : 'Export Products (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total Sales" value={`$${totalSales.toLocaleString()}`} change={salesChange.label} isNegative={salesChange.isNegative} isLoading={paymentsLoading} />
        <StatCard title="New Users" value={`${usersThis}`} change={usersChange.label} isNegative={usersChange.isNegative} isLoading={usersLoading} />
        <StatCard title="Pending Payments" value={`${pendingThis}`} change={pendingChange.label} isNegative={pendingChange.isNegative} isLoading={paymentsLoading} />
        <StatCard title="Active Products" value={`${activeProducts}`} change="" isLoading={productsLoading} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend */}
        <div className="flex flex-1 flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-white/80 text-base font-medium leading-normal">Revenue Trends</p>
                <p className="text-white tracking-tight text-[32px] font-bold leading-tight truncate">$189,432</p>
             </div>
             <div className="flex gap-1 items-center">
               <p className="text-white/60 text-sm">This Month</p>
               <p className="text-primary text-sm font-medium">+8.5%</p>
             </div>
          </div>
          <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#27e7dd" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#27e7dd" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#112120', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    itemStyle={{ color: '#27e7dd' }}
                />
                <Area type="monotone" dataKey="value" stroke="#27e7dd" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Product */}
        <div className="flex flex-1 flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-white/80 text-base font-medium leading-normal">Sales by Product</p>
                <p className="text-white tracking-tight text-[32px] font-bold leading-tight truncate">3,120 Units</p>
             </div>
             <div className="flex gap-1 items-center">
               <p className="text-white/60 text-sm">This Month</p>
               <p className="text-primary text-sm font-medium">+4.2%</p>
             </div>
          </div>
          <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData}>
                <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#112120', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#27e7dd' : 'rgba(39, 231, 221, 0.3)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Payments Table (replaces Orders) */}
      <div className="flex flex-col rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white text-lg font-bold">Recent Payments</h2>
          <div className="relative">
            <MdSearch />
            <input 
              className="w-64 rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" 
              placeholder="Search payments..." 
              type="text"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="p-4 font-medium">Payment ID</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map(p => (
                <tr key={p.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-primary font-medium">{p.id}</td>
                  <td className="p-4 text-white/80">{p.customer}</td>
                  <td className="p-4 text-white/60">{p.date}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2 py-1 text-xs 
                      ${p.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                        p.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-white/80 text-right">{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
