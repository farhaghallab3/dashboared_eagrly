import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import useReports from '../hooks/useReports';
import { Report } from '../types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Reports: React.FC = () => {
  const { data: reports, loading, opState, fetch, updateItem, deleteItem } = useReports();

  // Pagination / filtering (client-side)
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');


  const filtered = useMemo(() => {
    let arr = reports ?? [];
    if (statusFilter !== 'all') arr = arr.filter(r => String(r.status) === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(r => String(r.id).includes(q) || (r.product_name || String(r.product || '')).toLowerCase().includes(q) || (r.reporter_name || '').toLowerCase().includes(q));
    }
    return arr;
  }, [reports, statusFilter, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, totalPages);
  const paginated = filtered.slice((current - 1) * perPage, current * perPage);

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports</h1>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <input
            placeholder="Search by id, product or reporter"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="p-2 rounded w-72"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="p-2 rounded"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="p-2 rounded"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <div className="ml-auto" style={{ color: 'var(--text-secondary)' }}>Total: {total}</div>
        </div>

        <Table<Report>
          data={paginated}
          columns={[
            { header: 'ID', accessor: (r) => <Link to={`/reports/${r.id}`} style={{ color: 'var(--accent-primary)' }}>#{r.id}</Link> },
            {
              header: 'Reporter',
              accessor: (r) => (
                <Link to={`/users?id=${r.reporter}`} style={{ color: 'var(--accent-primary)' }}>
                  {r.reporter_name ?? `User #${r.reporter}`}
                </Link>
              )
            },
            {
              header: 'Reported User',
              accessor: (r) => r.reported_user ? (
                <Link to={`/users?id=${r.reported_user}`} style={{ color: 'var(--error, #ef4444)' }}>
                  {(r as any).reported_user_name ?? `User #${r.reported_user}`}
                </Link>
              ) : '-'
            },
            { header: 'Product', accessor: (r) => r.product ? <Link to={`/products/${r.product}`} style={{ color: 'var(--accent-primary)' }}>{(r as any).product_name ?? `#${r.product}`}</Link> : '-' },
            { header: 'Reason', accessor: (r) => <span title={r.reason} style={{ maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</span> },
            { header: 'Status', accessor: (r) => <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'resolved' ? 'bg-green-500/20 text-green-400' : r.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{r.status ?? 'open'}</span> },
            { header: 'Created', accessor: (r) => new Date(r.created_at || '').toLocaleString() },
          ]}
          actions={(r) => (
            <div className="flex gap-2 items-center justify-center">
              <Link to={`/reports/${r.id}`} className="text-sm" style={{ color: 'var(--accent-primary)' }}>View</Link>
              <button onClick={async () => {
                if (!window.confirm('Mark as resolved?')) return;
                try {
                  await updateItem(r.id, { status: 'resolved' });
                  toast.success('Report updated');
                } catch (err) {
                  toast.error('Failed to update');
                }
              }} className="text-sm text-green-400">Resolve</button>
              <button onClick={async () => {
                if (!window.confirm('Delete this report?')) return;
                try {
                  await deleteItem(r.id);
                  toast.success('Deleted');
                } catch (err) { toast.error('Failed'); }
              }} className="text-sm text-red-400">Delete</button>
            </div>
          )}
        />

        <div className="flex items-center gap-2 justify-center mt-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 rounded"
            style={{
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--hover-bg)'
            }}
          >
            Prev
          </button>
          <div style={{ color: 'var(--text-secondary)' }}>Page {current} / {totalPages}</div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded"
            style={{
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--hover-bg)'
            }}
          >
            Next
          </button>
        </div>

      </div>
    </Layout>
  );
};

export default Reports;
