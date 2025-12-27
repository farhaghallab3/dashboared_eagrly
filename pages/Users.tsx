
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import api from '../services/api';
import { User } from '../types';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users/');
      // Some backends return a paginated object { results: [...] }
      // Normalize to an array so callers can use array methods like .filter
      const payload = res.data;
      if (payload && Array.isArray(payload)) {
        setUsers(payload as User[]);
      } else if (payload && Array.isArray(payload.results)) {
        setUsers(payload.results as User[]);
      } else {
        // Unexpected shape - attempt to coerce or set empty
        console.warn('Unexpected users response shape:', payload);
        setUsers([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
      fetchUsers();
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
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
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
            { header: 'University', accessor: (u) => u.university || <span className="text-white/30">-</span> },
            { header: 'Ads Left', accessor: 'free_ads_remaining' },
          ]}
          actions={(user) => (
            <div className="flex justify-center gap-2">
              <button onClick={() => openModal(user)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition" title="Edit"><MdEdit size={18} /></button>
              <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition" title="Delete"><MdDelete size={18} /></button>
            </div>
          )}
        />
      )}

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
    </Layout>
  );
};

export default Users;
