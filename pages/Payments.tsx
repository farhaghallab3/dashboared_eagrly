import React from 'react';
import { MdCheckCircle, MdCancel, MdSearch, MdOutlinePending } from 'react-icons/md';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import { Payment } from '../types';
import toast from 'react-hot-toast';
import usePayments from '../hooks/usePayments';

const Payments: React.FC = () => {
  const { data: payments, loading, error, refetch } = usePayments();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded text-xs"><MdCheckCircle /> Completed</span>;
      case 'failed': return <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded text-xs"><MdCancel /> Failed</span>;
      default: return <span className="flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded text-xs"><MdOutlinePending /> Pending</span>;
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Payments</h1>
      </div>

      <div className="mb-6 relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: 'var(--text-secondary)' }}><MdSearch /></span>
        <input
          type="text"
          placeholder="Search transaction ID or user..."
          className="w-full rounded-lg pl-10 pr-4 py-2.5 transition"
          style={{
            backgroundColor: 'var(--input-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)'
          }}
        />
      </div>

      <Table<Payment>
        data={payments}
        columns={[
          { header: 'ID', accessor: 'id' },
          { header: 'User', accessor: 'user_name' },
          { header: 'Package', accessor: 'package_name' },
          { header: 'Amount', accessor: (p) => `${p.amount} EGP` },
          { header: 'Method', accessor: 'payment_method' },
          { header: 'Date', accessor: 'start_date' },
          { header: 'Status', accessor: (p) => getStatusBadge(p.status) },
        ]}
      />
    </Layout>
  );
};

export default Payments;