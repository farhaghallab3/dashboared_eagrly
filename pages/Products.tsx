import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdFilterList, MdImage } from 'react-icons/md';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import useAdminProducts from '../hooks/useAdminProducts';
import useAdminCategories from '../hooks/useAdminCategories';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import toast from 'react-hot-toast';

const productSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.string(),
  condition: z.enum(['new', 'used']).optional(),
  category: z.number(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  university: z.string().optional(),
  faculty: z.string().optional(),
  is_featured: z.boolean().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

const Products: React.FC = () => {
  const { data: products, loading: isLoading, error, opState, createItem, updateItem, deleteItem, refetch } = useAdminProducts();
  const navigate = useNavigate();
  const { user } = useAuth();
  console.log(user);
  
  const { data: categories } = useAdminCategories();
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'pending' | ''>('');
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | '1y' | 'newest' | 'oldest' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const getFilterParams = useCallback(() => {
    const params: Record<string, any> = {};

    if (searchQuery) {
      params.search = searchQuery;
    }
    if (selectedCategory !== '') {
      params.category = selectedCategory;
    }
    if (statusFilter !== '') {
      params.status = statusFilter;
    }

    if (timeFilter === 'newest') {
      params.ordering = '-created_at';
    } else if (timeFilter === 'oldest') {
      params.ordering = 'created_at';
    } else if (timeFilter) {
      const now = new Date();
      let d: Date | null = null;
      if (timeFilter === '24h') d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      else if (timeFilter === '7d') d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (timeFilter === '30d') d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else if (timeFilter === '1y') d = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      if (d) params.created_after = d.toISOString();
    }
    
    return params;
  }, [searchQuery, selectedCategory, statusFilter, timeFilter]);

  const doRefetch = useCallback(() => {
    refetch(getFilterParams());
  }, [refetch, getFilterParams]);


  // Read category from URL on mount (so links are shareable)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const cat = url.searchParams.get('category');
      const status = url.searchParams.get('status');
      const time = url.searchParams.get('time');
      if (cat) {
        const val = Number(cat);
        setSelectedCategory(val);
        // build params including optional status/time
        const params: Record<string, any> = { category: val };
        if (status) {
          params.status = status;
          setStatusFilter(status as any);
        }
        if (time) {
          setTimeFilter(time as any);
          // compute created_after or ordering below
        }
        // let refetch compute created_after from time
        // call refetch with params after computing created_after
        const computeCreatedAfter = (t?: string) => {
          if (!t) return null;
          const now = new Date();
          let d: Date | null = null;
          if (t === '24h') { d = new Date(now.getTime() - 24 * 60 * 60 * 1000); }
          else if (t === '7d') { d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); }
          else if (t === '30d') { d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); }
          else if (t === '1y') { d = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); }
          return d ? d.toISOString() : null;
        };

        const created_after = computeCreatedAfter(time ?? undefined);
        if (created_after) params.created_after = created_after;
        if (time === 'newest') params.ordering = '-created_at';
        if (time === 'oldest') params.ordering = 'created_at';

        refetch(params);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // products, isLoading and error are provided by useAdminProducts

  const handleProductSubmit = async (data: ProductForm) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', data.price);
    if (data.condition) formData.append('condition', data.condition);
    // enforce status rules: regular users' products should be inactive by default
    const desiredStatus = user ? data.status : 'inactive';
    formData.append('status', desiredStatus);
    formData.append('category', String(data.category ?? ''));

    if (data.university) formData.append('university', data.university);
    if (data.faculty) formData.append('faculty', data.faculty);
    // ensure boolean is sent as string so backend parses it via FormData
    formData.append('is_featured', data.is_featured ? 'true' : 'false');

    if (imageFiles) {
      for (let i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]);
      }
    }

    try {
      if (editingProduct) {
        await updateItem(editingProduct.id, formData);
        toast.success('Product updated');
      } else {
        await createItem(formData);
        toast.success('Product created');
      }
      setIsModalOpen(false);
      doRefetch();
      reset();
    } catch (e) {
        toast.error(e?.response?.data?.detail || 'Error saving product');
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setValue('title', product.title);
      setValue('description', product.description);
      setValue('price', product.price);
    setValue('condition', product.condition as any);
      setValue('category', product.category);
      setValue('status', product.status as any);
      setValue('university', product.university ?? '');
      setValue('faculty', product.faculty ?? '');
      setValue('is_featured', !!product.is_featured);
    } else {
      setEditingProduct(null);
      reset();
    }
    setImageFiles(null);
    setIsModalOpen(true);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary text-[#112120] px-4 py-2 rounded font-bold hover:bg-opacity-90">
          <MdAdd /> Add Product
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center bg-black/20 rounded-md px-3 py-2 border border-white/10 flex-1">
          <button onClick={doRefetch} className="text-white/50 mr-2"><MdSearch /></button>
          <input 
            type="text" 
            placeholder="Search products..." 
            className="bg-transparent text-white outline-none w-full"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                doRefetch();
              }
            }}
          />
        </div>
        <select value={selectedCategory} onChange={(e) => {
            const val = e.target.value === '' ? '' : Number(e.target.value);
            setSelectedCategory(val);
            // update URL so link is shareable
            try {
              const url = new URL(window.location.href);
              if (val === '') {
                url.searchParams.delete('category');
              } else {
                url.searchParams.set('category', String(val));
              }
              window.history.replaceState({}, '', url.toString());
            } catch (err) {}

            if (val === '') {
              refetch();
            } else {
              refetch({ category: val });
            }
        }} className="bg-black/20 text-white/80 border border-white/10 rounded px-3 py-2">
            <option value="">All Categories</option>
            {(categories || []).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
        </select>
        <select value={statusFilter} onChange={(e) => {
            const val = e.target.value === '' ? '' : (e.target.value as any);
            setStatusFilter(val as any);
            try {
              const url = new URL(window.location.href);
              if (val === '') url.searchParams.delete('status'); else url.searchParams.set('status', String(val));
              window.history.replaceState({}, '', url.toString());
            } catch (err) {}

            const params: Record<string, any> = {};
            if (selectedCategory !== '') params.category = selectedCategory;
            if (val !== '') params.status = val;
            // include time filter if set
            if (timeFilter) {
              if (timeFilter === 'newest') params.ordering = '-created_at';
              else if (timeFilter === 'oldest') params.ordering = 'created_at';
              else {
                const now = new Date();
                let d: Date | null = null;
                if (timeFilter === '24h') d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                if (timeFilter === '7d') d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (timeFilter === '30d') d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (timeFilter === '1y') d = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                if (d) params.created_after = d.toISOString();
              }
            }
            if (Object.keys(params).length === 0) refetch(); else refetch(params);
        }} className="bg-black/20 text-white/80 border border-white/10 rounded px-3 py-2">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
        </select>
        <select value={timeFilter} onChange={(e) => {
            const val = e.target.value === '' ? '' : (e.target.value as any);
            setTimeFilter(val as any);
            try {
              const url = new URL(window.location.href);
              if (val === '') url.searchParams.delete('time'); else url.searchParams.set('time', String(val));
              window.history.replaceState({}, '', url.toString());
            } catch (err) {}

            const params: Record<string, any> = {};
            if (selectedCategory !== '') params.category = selectedCategory;
            if (statusFilter !== '') params.status = statusFilter;

            if (val === 'newest') params.ordering = '-created_at';
            else if (val === 'oldest') params.ordering = 'created_at';
            else {
              const now = new Date();
              let d: Date | null = null;
              if (val === '24h') d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              if (val === '7d') d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              if (val === '30d') d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              if (val === '1y') d = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
              if (d) params.created_after = d.toISOString();
            }

            if (Object.keys(params).length === 0) refetch(); else refetch(params);
        }} className="bg-black/20 text-white/80 border border-white/10 rounded px-3 py-2">
            <option value="">Any time</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="1y">Last year</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
        </select>
        <select className="bg-black/20 text-white/80 border border-white/10 rounded px-3 py-2">
            <option value="">Sort By</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-white/30"></div>
        </div>
      ) : (
      <Table<Product>
        data={products}
        columns={[
          { header: 'Image', accessor: (p) => <img src={p.image} alt="product" className="h-10 w-10 rounded object-cover border border-white/10" /> },
          { header: 'Title', accessor: (p) => <button onClick={() => navigate(`/products/${p.id}`)} className="text-primary underline">{p.title}</button>, className: 'font-bold' },
          { header: 'Seller', accessor: (p) => p.seller ? p.seller.first_name : '-', className: 'text-sm' },
          { header: 'Category', accessor: (p) => p.category_name ?? '-' },
          { header: 'Price', accessor: (p) => `$${p.price}` },
          { header: 'Status', accessor: (p) => <span className={`px-2 py-1 rounded text-xs ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{p.status}</span> },
          { header: 'Featured', accessor: (p) => p.is_featured ? '⭐' : '-' },
        ]}
        actions={(product) => (
          <div className="flex items-center gap-2">
            <button onClick={() => openModal(product)} className="text-blue-400" title="Edit">{opState?.updatingId === product.id ? 'Updating...' : <MdEdit />}</button>
            <div className="flex items-center gap-2">
              <select value={product.status} onChange={async (e) => {
                  const newStatus = e.target.value as 'active' | 'inactive' | 'pending';
                  try {
                    await updateItem(product.id, { status: newStatus });
                    toast.success('Status updated');
                    doRefetch();
                  } catch (err) {
                    toast.error('Failed to update status');
                  }
              }} className="bg-black/20 text-white/80 border border-white/10 rounded px-2 py-1 text-sm" disabled={!(user && user.role === 'admin') || opState?.updatingId === product.id}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
              </select>
              {opState?.updatingId === product.id && <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white/30" />}
            </div>
            {!(user && user.role === 'admin') && <span className="text-white/50 text-xs">(admin only)</span>}
            <button onClick={async () => {
              if (!window.confirm('Are you sure you want to delete this product?')) return;
              try {
                await deleteItem(product.id);
                toast.success('Product deleted');
                doRefetch();
              } catch (err) {
                toast.error('Failed to delete product');
              }
            }} className="text-red-400" disabled={opState?.deletingId === product.id}>{opState?.deletingId === product.id ? 'Deleting...' : <MdDelete />}</button>
          </div>
        )}
      />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Edit Product" : "New Product"}>
        <form onSubmit={handleSubmit(handleProductSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-white/80">Title</label>
                    <input {...register('title')} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white" />
                </div>
                <div>
                    <label className="text-sm text-white/80">Price</label>
                    <input {...register('price')} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/80">University</label>
                <input {...register('university')} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white" />
              </div>
              <div>
                <label className="text-sm text-white/80">Faculty</label>
                <input {...register('faculty')} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white" />
              </div>
            </div>
            <div>
                <label className="text-sm text-white/80">Description</label>
                <textarea {...register('description')} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-24"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/80">Category</label>
                  <select {...register('category', {valueAsNumber: true})} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white">
                    <option value={0}>Select category</option>
                    {(categories || []).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/80">Status</label>
                  <select {...register('status')} disabled={!(user && user.role === 'admin')} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                  {!(user && user.role === 'admin') && <p className="text-xs text-white/50 mt-1">Products created by regular users are set to <strong>inactive</strong> and must be activated by an admin.</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                    <label className="text-sm text-white/80">Condition</label>
                    <select {...register('condition')} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white">
                        <option value="">Select condition</option>
                        <option value="new">New</option>
                        <option value="used">Used</option>
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <input type="checkbox" {...register('is_featured')} id="is_featured" className="accent-primary" />
                    <label htmlFor="is_featured" className="text-white/80 text-sm">Featured</label>
                </div>
            </div>
            <div>
                 <label className="text-sm text-white/80 mb-1 flex items-center gap-2"><MdImage /> Upload Images</label>
                 <input 
                    type="file" 
                    multiple 
                    onChange={(e) => setImageFiles(e.target.files)}
                    className="w-full text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-[#112120] hover:file:bg-primary/80"
                 />
            </div>
            <button disabled={opState?.creating || (editingProduct && opState?.updatingId === editingProduct.id)} className="w-full bg-primary text-[#112120] font-bold py-3 rounded mt-2">{opState?.creating || (editingProduct && opState?.updatingId === editingProduct.id) ? 'Saving...' : 'Save Product'}</button>
        </form>
      </Modal>
    </Layout>
  );
};

export default Products;