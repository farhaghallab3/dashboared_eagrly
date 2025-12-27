import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import useAdminPackages from '../hooks/useAdminPackages';
import { Package } from '../types';
import toast from 'react-hot-toast';

const packageSchema = z.object({
  name: z.string().min(2),
  price: z.string(),
  duration_in_days: z.number().min(1),
  ad_limit: z.number().min(1),
  featured_ad_limit: z.number().min(0),
  description: z.string(),
});

type PackageForm = z.infer<typeof packageSchema>;

const Packages: React.FC = () => {
  const { data: packages, loading, error, opState, createItem, updateItem, deleteItem, refetch } = useAdminPackages();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<PackageForm>({
    resolver: zodResolver(packageSchema),
  });

  const handleSave = async (data: PackageForm) => {
    try {
      if (editingPkg) {
        await updateItem(editingPkg.id, data);
        toast.success('Package updated');
      } else {
        await createItem(data);
        toast.success('Package created');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error('Failed to save package');
    }
  };

  const openModal = (pkg?: Package) => {
    if (pkg) {
      setEditingPkg(pkg);
      setValue('name', pkg.name);
      setValue('price', pkg.price);
      setValue('duration_in_days', pkg.duration_in_days);
      setValue('ad_limit', pkg.ad_limit);
      setValue('featured_ad_limit', pkg.featured_ad_limit);
      setValue('description', pkg.description);
    } else {
      setEditingPkg(null);
      reset();
    }
    setIsModalOpen(true);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Packages</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            color: 'var(--bg-primary)'
          }}
        >
          <span className="text-xl"><MdAdd /></span> Add Package
        </button>
      </div>

      <Table<Package>
        data={packages}
        columns={[
          { header: 'Name', accessor: 'name', className: 'font-bold' },
          { header: 'Price', accessor: (p) => `$${p.price}` },
          { header: 'Duration', accessor: (p) => `${p.duration_in_days} Days` },
          { header: 'Ads', accessor: 'ad_limit' },
          { header: 'Featured', accessor: 'featured_ad_limit' },
        ]}
        actions={(pkg) => (
          <div className="flex justify-center gap-2">
            <button onClick={() => openModal(pkg)} className="p-2 rounded-lg text-blue-400 transition" style={{ backgroundColor: 'var(--hover-bg)' }} title="Edit">{opState?.updatingId === pkg.id ? 'Updating...' : <MdEdit size={18} />}</button>
            <button onClick={async () => {
              if (!window.confirm('Delete this package?')) return;
              try {
                await deleteItem(pkg.id);
                toast.success('Package deleted');
              } catch (err) {
                toast.error('Failed to delete package');
              }
            }} className="p-2 rounded-lg text-red-400 transition" style={{ backgroundColor: 'var(--hover-bg)' }} disabled={opState?.deletingId === pkg.id}>{opState?.deletingId === pkg.id ? 'Deleting...' : <MdDelete size={18} />}</button>
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPkg ? 'Edit Package' : 'New Package'}>
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Name</label>
              <input {...register('name')} className="w-full rounded-lg px-4 py-2" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Price</label>
              <input {...register('price')} className="w-full rounded-lg px-4 py-2" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Duration (Days)</label>
              <input type="number" {...register('duration_in_days', { valueAsNumber: true })} className="w-full rounded-lg px-4 py-2" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Ad Limit</label>
              <input type="number" {...register('ad_limit', { valueAsNumber: true })} className="w-full rounded-lg px-4 py-2" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Featured Limit</label>
              <input type="number" {...register('featured_ad_limit', { valueAsNumber: true })} className="w-full rounded-lg px-4 py-2" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea {...register('description')} className="w-full rounded-lg px-4 py-2" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} />
          </div>
          <button type="submit" className="w-full rounded-lg py-2.5 text-sm font-bold transition mt-2" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', color: 'var(--bg-primary)' }}>Save Package</button>
        </form>
      </Modal>
    </Layout>
  );
};

export default Packages;