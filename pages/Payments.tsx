import React, { useState, useEffect } from 'react';
import { MdCheckCircle, MdCancel, MdSearch, MdOutlinePending, MdHourglassTop, MdCheck } from 'react-icons/md';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { Payment, Package } from '../types';
import toast from 'react-hot-toast';
import usePayments from '../hooks/usePayments';
import { getPackages, confirmPayment } from '../services/apiClient';

type StatusFilter = 'all' | 'pending_confirmation' | 'completed' | 'failed' | 'pending';

const Payments: React.FC = () => {
  const { data: paymentsData, loading, error, refetch, currentPage, setCurrentPage, totalCount, pageSize } = usePayments();
  // Normalize status to lowercase for all payments
  const payments = (Array.isArray(paymentsData) ? paymentsData : []).map(p => ({
    ...p,
    status: (p.status || '').toLowerCase() as Payment['status']
  }));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState<Payment | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await getPackages();
        setPackages(data);
      } catch (error) {
        console.error('Failed to load packages:', error);
      }
    };
    fetchPackages();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded text-xs"><MdCheckCircle /> Completed</span>;
      case 'failed':
        return <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded text-xs"><MdCancel /> Failed</span>;
      case 'pending_confirmation':
        return <span className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-2 py-1 rounded text-xs"><MdHourglassTop /> Awaiting Confirmation</span>;
      default:
        return <span className="flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded text-xs"><MdOutlinePending /> Pending</span>;
    }
  };

  const openConfirmModal = (payment: Payment) => {
    setConfirmingPayment(payment);
    setSelectedPackageId(payment.package);
    setAdminNotes('');
    setIsConfirmModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!confirmingPayment || !selectedPackageId) {
      toast.error('Please select a package');
      return;
    }

    setIsConfirming(true);
    try {
      await confirmPayment(confirmingPayment.id, selectedPackageId, adminNotes);
      toast.success('Payment confirmed and user upgraded successfully!');
      setIsConfirmModalOpen(false);
      setConfirmingPayment(null);
      // Refetch the payments list to show updated status
      await refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to confirm payment');
    } finally {
      setIsConfirming(false);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      (p.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (p.package_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      String(p.id).includes(searchTerm);

    const matchesStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'pending'
        ? (p.status === 'pending' || p.status === 'pending_confirmation')
        : p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Count by status for tabs
  // Count by status for tabs
  const pendingCount = payments.filter(p => p.status === 'pending' || p.status === 'pending_confirmation').length;
  const completedCount = payments.filter(p => p.status === 'completed').length;
  const failedCount = payments.filter(p => p.status === 'failed').length;

  const filterTabs: { key: StatusFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'completed', label: 'Completed', count: completedCount },
    { key: 'failed', label: 'Failed', count: failedCount },
  ];

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Payments</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            style={{
              backgroundColor: statusFilter === tab.key
                ? 'var(--accent-primary)'
                : 'var(--hover-bg)',
              color: statusFilter === tab.key
                ? 'var(--bg-primary)'
                : 'var(--text-secondary)',
              border: statusFilter === tab.key
                ? '1px solid var(--accent-primary)'
                : '1px solid var(--border-color)'
            }}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: statusFilter === tab.key
                    ? 'rgba(0,0,0,0.2)'
                    : 'var(--accent-primary)',
                  color: statusFilter === tab.key
                    ? 'var(--bg-primary)'
                    : 'var(--bg-primary)'
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-6 relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: 'var(--text-secondary)' }}><MdSearch /></span>
        <input
          type="text"
          placeholder="Search by ID, user or package..."
          className="w-full rounded-lg pl-10 pr-4 py-2.5 transition"
          style={{
            backgroundColor: 'var(--input-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)'
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--text-secondary)' }}>Loading payments...</div>
      ) : (
        <Table<Payment>
          data={filteredPayments}
          columns={[
            { header: 'ID', accessor: 'id' },
            { header: 'User', accessor: 'user_name' },
            { header: 'Package', accessor: 'package_name' },
            { header: 'Amount', accessor: (p) => `${p.amount} EGP` },
            {
              header: 'Method', accessor: (p) => {
                const methods: Record<string, string> = {
                  'bank': 'Bank Transfer',
                  'wallet': 'Mobile Wallet',
                  'credit': 'Credit Card',
                  'paypal': 'PayPal',
                  'cash': 'Cash'
                };
                return methods[p.payment_method] || p.payment_method;
              }
            },
            {
              header: 'Date', accessor: (p) => p.user_confirmed_at
                ? new Date(p.user_confirmed_at).toLocaleDateString()
                : (p.start_date || '-')
            },
            { header: 'Status', accessor: (p) => getStatusBadge(p.status) },
          ]}
          actions={(payment) => (
            <div className="flex justify-center gap-2">
              {(payment.status === 'pending_confirmation' || payment.status === 'pending') && (
                <button
                  onClick={() => openConfirmModal(payment)}
                  className="px-3 py-1.5 rounded-lg transition flex items-center gap-1 text-sm font-medium"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    color: '#22c55e'
                  }}
                  title="Confirm Payment & Upgrade User"
                >
                  <MdCheck size={16} />
                  Confirm
                </button>
              )}
            </div>
          )}
        />
      )}

      {/* Pagination */}
      {!loading && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / pageSize)}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Confirm Payment Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => { setIsConfirmModalOpen(false); setConfirmingPayment(null); }}
        title="Confirm Payment"
      >
        <div className="space-y-4">
          {confirmingPayment && (
            <>
              <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: var(--border-color);
                  border-radius: 20px;
                  border: 2px solid transparent;
                  background-clip: content-box;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background-color: var(--text-secondary);
                }
                .btn-cancel {
                  background-color: transparent;
                  border: 1px solid var(--border-color);
                  color: var(--text-secondary);
                }
                .btn-cancel:hover {
                  background-color: var(--hover-bg);
                  color: var(--text-primary);
                  border-color: var(--text-secondary);
                }
              `}</style>
              <div className="p-4 rounded-lg border" style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' // Subtle shadow
              }}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>User:</span>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{confirmingPayment.user_name}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Amount:</span>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{confirmingPayment.amount} EGP</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Method:</span>
                    <p className="capitalize" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{confirmingPayment.payment_method}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Requested Package:</span>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{confirmingPayment.package_name}</p>
                  </div>
                  {confirmingPayment.user_confirmed_at && (
                    <div className="col-span-2">
                      <span style={{ color: 'var(--text-secondary)' }}>User Confirmed:</span>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {new Date(confirmingPayment.user_confirmed_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Assign Package
                </label>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Select the package to assign to the user. You can choose a different package if needed.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className="p-3 rounded-lg cursor-pointer transition border"
                      style={{
                        borderColor: selectedPackageId === pkg.id ? 'var(--accent-primary)' : 'var(--border-color)',
                        backgroundColor: selectedPackageId === pkg.id ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'var(--bg-secondary)',
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{pkg.name}</h4>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{pkg.ad_limit} ads • {pkg.duration_in_days} days</p>
                        </div>
                        <p className="font-bold" style={{ color: 'var(--accent-primary)' }}>{pkg.price} EGP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Admin Notes (optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 transition"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    borderWidth: '1px'
                  }}
                  placeholder="Add any notes about this confirmation..."
                  rows={2}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => { setIsConfirmModalOpen(false); setConfirmingPayment(null); }}
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium transition btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={!selectedPackageId || isConfirming}
                  className="flex-1 rounded-lg bg-green-500 py-2.5 text-sm font-bold text-white transition hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isConfirming ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <MdCheckCircle size={18} />
                      Confirm & Upgrade User
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default Payments;