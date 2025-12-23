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

  // useAdminPackages fetches on mount

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
        <h1 className="text-2xl font-bold text-white">Packages</h1>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary text-[#112120] px-4 py-2 rounded-lg font-bold hover:bg-opacity-90 transition">
          <span className="text-xl"><MdAdd /></span> Add Package
        </button>
      </div>

      <Table<Package>
        data={packages}
        columns={[
          { header: 'Name', accessor: 'name', className: 'font-bold text-primary' },
          { header: 'Price', accessor: (p) => `$${p.price}` },
          { header: 'Duration', accessor: (p) => `${p.duration_in_days} Days` },
          { header: 'Ads', accessor: 'ad_limit' },
          { header: 'Featured', accessor: 'featured_ad_limit' },
        ]}
        actions={(pkg) => (
          <div className="flex justify-center gap-2">
            <button onClick={() => openModal(pkg)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition" title="Edit">{opState?.updatingId === pkg.id ? 'Updating...' : <MdEdit size={18} />}</button>
            <button onClick={async () => {
              if (!window.confirm('Delete this package?')) return;
              try {
                await deleteItem(pkg.id);
                toast.success('Package deleted');
              } catch (err) {
                toast.error('Failed to delete package');
              }
            }} className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition" disabled={opState?.deletingId === pkg.id}>{opState?.deletingId === pkg.id ? 'Deleting...' : <MdDelete size={18} />}</button>
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPkg ? 'Edit Package' : 'New Package'}>
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Name</label>
                <input {...register('name')} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white focus:border-primary focus:outline-none" />
             </div>
             <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Price</label>
                <input {...register('price')} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white focus:border-primary focus:outline-none" />
             </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Duration (Days)</label>
                <input type="number" {...register('duration_in_days', {valueAsNumber: true})} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white focus:border-primary focus:outline-none" />
             </div>
             <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Ad Limit</label>
                <input type="number" {...register('ad_limit', {valueAsNumber: true})} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white focus:border-primary focus:outline-none" />
             </div>
             <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Featured Limit</label>
                <input type="number" {...register('featured_ad_limit', {valueAsNumber: true})} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white focus:border-primary focus:outline-none" />
             </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Description</label>
            <textarea {...register('description')} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white focus:border-primary focus:outline-none" />
          </div>
          <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-[#112120] transition hover:bg-primary/90 mt-2">Save Package</button>
        </form>
      </Modal>
    </Layout>
  );
};

export default Packages;