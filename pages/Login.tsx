
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { loginUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Clear any existing session when visiting login page
  useEffect(() => {
    logout();
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await loginUser(data.username, data.password);
      toast.success('Login successful!');
      navigate('/');
    } catch (error: any) {
      console.error('Login Error Details:', error);
      let msg = 'Invalid credentials. Please try again.';
      if (!error.response) {
        if (error.message === 'Network Error') {
          msg = 'Network Error: Unable to reach the server. Please ensure the backend is running at http://127.0.0.1:8000 and CORS is configured.';
        } else {
          msg = `Connection failed: ${error.message}`;
        }
      } else if (error.response?.status === 401) {
        msg = 'Invalid username or password.';
      } else if (error.response?.data?.detail) {
        msg = error.response.data.detail;
      }
      toast.error(msg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#112120] bg-[url('https://transparenttextures.com/patterns/cubes.png')]">
      <Toaster position="top-right" />
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-3xl font-bold text-primary">
            R+
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-sm text-white/60">Enter your credentials to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Username</label>
            <input
              {...register('username')}
              type="text"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="admin"
            />
            {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-[#112120] transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
