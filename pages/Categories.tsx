import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdAdd, MdEdit, MdDelete, MdImage } from 'react-icons/md';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import useAdminCategories from '../hooks/useAdminCategories';
import { Category } from '../types';
import toast from 'react-hot-toast';

const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(5, "Description is required"),
});

type CategoryForm = z.infer<typeof categorySchema>;

const Categories: React.FC = () => {
  const { data: categories, loading, error, opState, createItem, updateItem, deleteItem, refetch, currentPage, setCurrentPage, totalCount, pageSize } = useAdminCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  const handleSubmitData = async (data: CategoryForm) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      if (editingCategory) {
        await updateItem(editingCategory.id, formData);
        toast.success('Category updated');
      } else {
        await createItem(formData);
        toast.success('Category created');
      }
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setValue('name', category.name);
      setValue('description', category.description);
    } else {
      setEditingCategory(null);
      reset();
    }
    setSelectedImage(null);
    setIsModalOpen(true);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Categories</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            color: 'var(--bg-primary)'
          }}
        >
          <span className="text-xl"><MdAdd /></span> Add Category
        </button>
      </div>

      <Table<Category>
        data={categories}
        columns={[
          { header: 'Image', accessor: (c) => c.image ? <img src={c.image} alt={c.name} className="h-12 w-12 rounded-lg object-cover" style={{ border: '1px solid var(--border-color)' }} /> : <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--hover-bg)' }}><span style={{ color: 'var(--text-secondary)' }}><MdImage /></span></div> },
          { header: 'Name', accessor: 'name', className: 'font-bold text-base' },
          { header: 'Description', accessor: 'description' },
        ]}
        actions={(cat) => (
          <div className="flex justify-center gap-2">
            <button onClick={() => openModal(cat)} className="p-2 rounded-lg text-blue-400 transition" style={{ backgroundColor: 'var(--hover-bg)' }} title="Edit"><MdEdit size={18} /></button>
            <button onClick={async () => {
              if (!window.confirm('Are you sure you want to delete this category?')) return;
              try {
                await deleteItem(cat.id);
                toast.success('Category deleted');
              } catch (err) {
                toast.error('Failed to delete category');
              }
            }} className="p-2 rounded-lg text-red-400 transition" style={{ backgroundColor: 'var(--hover-bg)' }} title="Delete" disabled={opState?.deletingId === cat.id}>{opState?.deletingId === cat.id ? 'Deleting...' : <MdDelete size={18} />}</button>
          </div>
        )}
      />

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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSubmit(handleSubmitData)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Name</label>
            <input
              {...register('name')}
              className="w-full rounded-lg px-4 py-2 transition"
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea
              {...register('description')}
              className="w-full rounded-lg px-4 py-2 min-h-[100px] transition"
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Category Image</label>
            <input
              type="file"
              onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
              className="w-full text-sm cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg py-2.5 text-sm font-bold transition mt-4"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              color: 'var(--bg-primary)'
            }}
          >
            Save Category
          </button>
        </form>
      </Modal>
    </Layout>
  );
};

export default Categories;