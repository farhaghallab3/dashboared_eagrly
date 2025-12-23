import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdAdd, MdEdit, MdDelete, MdImage } from 'react-icons/md';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import useAdminCategories from '../hooks/useAdminCategories';
import { Category } from '../types';
import toast from 'react-hot-toast';

const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(5, "Description is required"),
});

type CategoryForm = z.infer<typeof categorySchema>;

const Categories: React.FC = () => {
  const { data: categories, loading, error, opState, createItem, updateItem, deleteItem, refetch } = useAdminCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  // useAdminCategories fetches on mount; refetch available via `refetch`

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
        <h1 className="text-2xl font-bold text-white">Categories</h1>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary text-[#112120] px-4 py-2 rounded-lg font-bold hover:bg-opacity-90 transition">
          <span className="text-xl"><MdAdd /></span> Add Category
        </button>
      </div>

      <Table<Category>
        data={categories}
        columns={[
          { header: 'Image', accessor: (c) => c.image ? <img src={c.image} alt={c.name} className="h-12 w-12 rounded-lg object-cover border border-white/10" /> : <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center"><span className="text-white/20"><MdImage /></span></div> },
          { header: 'Name', accessor: 'name', className: 'font-bold text-base' },
          { header: 'Description', accessor: 'description' },
        ]}
        actions={(cat) => (
          <div className="flex justify-center gap-2">
              <button onClick={() => openModal(cat)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition" title="Edit"><MdEdit size={18} /></button>
              <button onClick={async () => {
                if (!window.confirm('Are you sure you want to delete this category?')) return;
                try {
                  await deleteItem(cat.id);
                  toast.success('Category deleted');
                } catch (err) {
                  toast.error('Failed to delete category');
                }
              }} className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition" title="Delete" disabled={opState?.deletingId === cat.id}>{opState?.deletingId === cat.id ? 'Deleting...' : <MdDelete size={18} />}</button>
            </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSubmit(handleSubmitData)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Name</label>
            <input {...register('name')} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Description</label>
            <textarea {...register('description')} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px]" />
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
          </div>
          <div>
             <label className="mb-1 block text-sm font-medium text-white/80">Category Image</label>
             <input type="file" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} className="w-full text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-[#112120] hover:file:bg-primary/80 transition cursor-pointer" />
          </div>
          <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-[#112120] transition hover:bg-primary/90 mt-4">Save Category</button>
        </form>
      </Modal>
    </Layout>
  );
};

export default Categories;