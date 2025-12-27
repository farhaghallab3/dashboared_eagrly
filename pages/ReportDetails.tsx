import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import * as reportsApi from '../services/api/reports';
import { Report } from '../types';
import toast from 'react-hot-toast';

const ReportDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    reportsApi.getReport(id)
      .then(r => setReport(r))
      .catch(err => {
        console.error(err);
        toast.error('Failed to load report');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const markResolved = async () => {
    if (!report) return;
    setSaving(true);
    try {
      const res = await reportsApi.updateReport(report.id, { status: 'resolved' });
      setReport(res);
      toast.success('Report marked resolved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  const removeReport = async () => {
    if (!report) return;
    if (!window.confirm('Delete this report?')) return;
    setSaving(true);
    try {
      await reportsApi.deleteReport(report.id);
      toast.success('Report deleted');
      navigate('/reports');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Report Details</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/reports')}
              className="px-3 py-1 rounded"
              style={{
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--hover-bg)'
              }}
            >
              Back
            </button>
            <button
              onClick={markResolved}
              disabled={saving || loading}
              className="px-3 py-1 rounded bg-green-500 text-black font-bold"
            >
              Resolve
            </button>
            <button
              onClick={removeReport}
              disabled={saving || loading}
              className="px-3 py-1 rounded bg-red-600 text-white"
            >
              Delete
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
        ) : report ? (
          <div
            className="space-y-4 p-4 rounded"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div>
              <h2 className="text-sm" style={{ color: 'var(--text-secondary)' }}>ID</h2>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{report.id}</p>
            </div>
            <div>
              <h2 className="text-sm" style={{ color: 'var(--text-secondary)' }}>Product</h2>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{report.product_name ?? report.product}</p>
            </div>
            <div>
              <h2 className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reporter</h2>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{report.reporter_name ?? report.reporter}</p>
            </div>
            <div>
              <h2 className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reason</h2>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{report.reason}</p>
            </div>
            <div>
              <h2 className="text-sm" style={{ color: 'var(--text-secondary)' }}>Details</h2>
              <p className="whitespace-pre-wrap" style={{ color: 'var(--text-primary)', opacity: 0.8 }}>{report.details || '-'}</p>
            </div>
            <div>
              <h2 className="text-sm" style={{ color: 'var(--text-secondary)' }}>Status</h2>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{report.status}</p>
            </div>
            <div>
              <h2 className="text-sm" style={{ color: 'var(--text-secondary)' }}>Created</h2>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{new Date(report.created_at || '').toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>Report not found</div>
        )}
      </div>
    </Layout>
  );
};

export default ReportDetails;
