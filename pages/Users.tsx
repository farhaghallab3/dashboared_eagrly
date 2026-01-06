import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdUpgrade } from 'react-icons/md';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import api from '../services/api';
import { User, Package } from '../types';
import toast from 'react-hot-toast';

const userSchema = z.object({
  username: z.string().min(3, "Username must be 3+ chars"),
  email: z.string().email("Invalid email address"),
  role: z.enum(['admin', 'user']),
  university: z.string().optional(),
  phone: z.string().optional(),
});

type UserForm = z.infer<typeof userSchema>;

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [upgradingUser, setUpgradingUser] = useState<User | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  });

  const fetchUsers = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const res = await api.get('/users/', { params: { page } });
      const payload = res.data;
      if (payload && Array.isArray(payload)) {
        setUsers(payload as User[]);
        setTotalCount(payload.length);
      } else if (payload && Array.isArray(payload.results)) {
        setUsers(payload.results as User[]);
        setTotalCount(payload.count || payload.results.length);
      } else {
        console.warn('Unexpected users response shape:', payload);
        setUsers([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await api.get('/packages/');
      const payload = res.data;
      if (payload && Array.isArray(payload)) {
        setPackages(payload as Package[]);
      } else if (payload && Array.isArray(payload.results)) {
        setPackages(payload.results as Package[]);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
    fetchPackages();
  }, [currentPage]);

  const handleCreateOrUpdate = async (data: UserForm) => {
    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}/`, data);
        toast.success("User updated successfully");
      } else {
        await api.post('/users/', data);
        toast.success("User created successfully");
      }
      setIsModalOpen(false);
      fetchUsers(currentPage);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Operation failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}/`);
      toast.success("User deleted");
      fetchUsers(currentPage);
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleUpgradeUser = async () => {
    if (!upgradingUser || !selectedPackageId) {
      toast.error("Please select a package");
      return;
    }
    try {
      await api.post(`/users/${upgradingUser.id}/assign_package/`, {
        package_id: selectedPackageId
      });
      const pkg = packages.find(p => p.id === selectedPackageId);
      toast.success(`User upgraded to ${pkg?.name || 'package'}`);
      setIsUpgradeModalOpen(false);
      setUpgradingUser(null);
      setSelectedPackageId(null);
      fetchUsers(currentPage);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to upgrade user");
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setValue('username', user.username);
      setValue('email', user.email);
      setValue('role', user.role);
      setValue('university', user.university || '');
      setValue('phone', user.phone || '');
    } else {
      setEditingUser(null);
      reset({ role: 'user' });
    }
    setIsModalOpen(true);
  };

  const openUpgradeModal = (user: User) => {
    setUpgradingUser(user);
    setSelectedPackageId(user.active_package ? Number(user.active_package) : null);
    setIsUpgradeModalOpen(true);
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>User Management</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            color: 'var(--bg-primary)'
          }}
        >
          <span className="text-xl"><MdAdd /></span> Add User
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: 'var(--text-secondary)' }}><MdSearch /></span>
        <input
          type="text"
          placeholder="Search users by name or email..."
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

      {isLoading ? (
        <div className="text-center py-10" style={{ color: 'var(--text-secondary)' }}>Loading users...</div>
      ) : (
        <Table<User>
          data={filteredUsers}
          columns={[
            { header: 'ID', accessor: 'id', className: 'text-primary w-16' },
            { header: 'Username', accessor: 'username', className: 'font-medium' },
            { header: 'Email', accessor: 'email' },
            { header: 'Role', accessor: (u) => <span className={`px-2 py-1 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white'}`}>{u.role.toUpperCase()}</span> },
            {
              header: 'Package', accessor: (u) => u.active_package_name ? (
                <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400">{u.active_package_name}</span>
              ) : (
                <span className="text-white/30">Free</span>
              )
            },
            { header: 'University', accessor: (u) => u.university || <span className="text-white/30">-</span> },
            { header: 'Ads Left', accessor: 'free_ads_remaining' },
          ]}
          actions={(user) => (
            <div className="flex justify-center gap-2">
              <button onClick={() => openUpgradeModal(user)} className="p-2 hover:bg-white/10 rounded-lg text-green-400 transition" title="Upgrade Package"><MdUpgrade size={18} /></button>
              <button onClick={() => openModal(user)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition" title="Edit"><MdEdit size={18} /></button>
              <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition" title="Delete"><MdDelete size={18} /></button>
            </div>
          )}
        />
      )}

      {/* Pagination */}
      {!isLoading && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / pageSize)}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Edit/Create User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Create New User'}>
        <form onSubmit={handleSubmit(handleCreateOrUpdate)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Username</label>
            <input
              {...register('username')}
              type="text"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="johndoe"
            />
            {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="john@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Role</label>
            <select
              {...register('role')}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="user" className="bg-[#112120]">User</option>
              <option value="admin" className="bg-[#112120]">Admin</option>
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-400">{errors.role.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">University</label>
              <input
                {...register('university')}
                type="text"
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Phone</label>
              <input
                {...register('phone')}
                type="text"
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-[#112120] transition hover:bg-primary/90"
            >
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upgrade Package Modal */}
      <Modal isOpen={isUpgradeModalOpen} onClose={() => { setIsUpgradeModalOpen(false); setUpgradingUser(null); }} title={`Upgrade ${upgradingUser?.username || 'User'}`}>
        <div className="space-y-4">
          <p className="text-white/70 text-sm">
            Select a subscription package to assign to this user. This will grant them access to the package benefits including increased ad limits.
          </p>

          {upgradingUser?.active_package_name && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-green-400 text-sm">Current Package: <strong>{upgradingUser.active_package_name}</strong></p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Select Package</label>
            <div className="space-y-2">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`p-4 rounded-lg cursor-pointer transition border ${selectedPackageId === pkg.id
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 bg-black/20 hover:border-white/20'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-white">{pkg.name}</h4>
                      <p className="text-white/60 text-sm">{pkg.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">${pkg.price}</p>
                      <p className="text-white/50 text-xs">{pkg.duration_in_days} days</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-white/50">
                    <span>📦 {pkg.ad_limit} ads</span>
                    <span>⭐ {pkg.featured_ad_limit} featured</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => { setIsUpgradeModalOpen(false); setUpgradingUser(null); }}
              className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleUpgradeUser}
              disabled={!selectedPackageId}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-[#112120] transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Package
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Users;
