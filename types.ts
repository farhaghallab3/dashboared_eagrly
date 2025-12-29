export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  university?: string;
  faculty?: string;
  free_ads_remaining: number;
  active_package?: string;
  active_package_name?: string;
  package_expiry?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  image?: string;
}

export interface Seller {
  id: number;
  email: string;
  first_name: string;
  phone?: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: string;
  condition: string;
  image?: string;
  images?: string[]; // JSON array in backend
  category: number; // ID
  category_name?: string; // For display
  seller: Seller;
  university?: string;
  faculty?: string;
  is_featured: boolean;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

export interface Package {
  id: number;
  name: string;
  price: string;
  duration_in_days: number;
  ad_limit: number;
  featured_ad_limit: number;
  description: string;
}

export interface Payment {
  id: number;
  user: number;
  user_name?: string;
  package: number;
  package_name?: string;
  payment_method: string;
  amount: string;
  start_date: string;
  expiry_date: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: User; // Depending on backend implementation
  role: 'admin' | 'user';
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface Review {
  id: number;
  product: number;
  user: number;
  user_name?: string;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
  updated_at?: string;
}

export interface Report {
  id: number;
  product: number;
  reporter: number;
  reporter_name?: string;
  reason: string;
  details?: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  created_at: string;
  updated_at?: string;
}
