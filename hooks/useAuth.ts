import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { User, AuthResponse } from '../types';

function getStoredUser(): User | null {
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as User) : null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(getStoredUser());

  useEffect(() => {
    const u = getStoredUser();
    if (u) setUser(u);
  }, []);

  const login = async (username: string, password: string) => {
    const data: AuthResponse = await apiClient.login(username, password);
    if (data.user) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAuthenticated = Boolean(localStorage.getItem('access_token'));

  return { user, isAuthenticated, login, logout } as const;
}

export default useAuth;
