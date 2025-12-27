
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import * as authService from '../services/api/auth';
import { User } from '../types';
import { decodeToken } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (access: string, refresh: string) => Promise<void>;
  loginUser: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // Ensure axios default header is set so subsequent requests include the token immediately
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      // ignore if setting defaults fails for some reason
    }

    try {
      const decoded = decodeToken(token);

      // Standard Django SimpleJWT includes user_id in the payload
      if (decoded && decoded.user_id) {
        try {
          // Fetch real user details from the backend
          const response = await api.get<User>(`/users/${decoded.user_id}/`);

          setUser(response.data);
          setIsAuthenticated(true);
        } catch (fetchError) {
          console.error("Failed to fetch user profile, but token is valid:", fetchError);
          // Fallback: still authenticate the user, but with minimal info if possible, or force logout
          // Ideally, we want to allow access if the token is valid, but dashboard might break without user data.
          // For now, we assume if we can't get user data, we are 'technically' authenticated via token
          // but effectively broken. Let's try to keep them logged in so they don't get stuck in a loop.
          setIsAuthenticated(true);
        }
      } else {
        // Token format invalid or missing user_id
        console.warn("Invalid token structure or missing user_id");
        logout();
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    // Immediately verify and fetch user to update state
    await checkAuth();
  };

  // High-level login by credentials. Obtains tokens and enforces admin-only access.
  const loginUser = async (username: string, password: string) => {
    // Call auth service to obtain tokens
    const data = await authService.obtainToken(username, password);
    if (!data || !data.access) {
      throw new Error('Failed to obtain access token');
    }

    // tokens already stored by authService.obtainToken
    // ensure axios will send Authorization header immediately
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
    // Verify user info from token (decodeToken) and fetch user details
    const decoded = decodeToken(data.access);
    if (!decoded || !decoded.user_id) {
      // fallback: try to fetch profile endpoint
      await checkAuth();
      if (!user) throw new Error('Unable to verify user');
    }

    // fetch user profile to confirm role
    try {
      const userId = decoded.user_id;
      const res = await api.get<User>(`/users/${userId}/`);
      const fetchedUser = res.data;
      if (!fetchedUser || data.role == 'user') {
        // Not an admin - revoke tokens and reject login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Only admin users are allowed to log in to this dashboard');
      }
      // set user state and authenticated
      setUser(fetchedUser);
      setIsAuthenticated(true);
    } catch (err) {
      // ensure tokens cleared
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, loginUser, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};