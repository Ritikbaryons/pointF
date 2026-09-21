import { StoreModule } from './auth.model';

export interface Store {
  id: number;
  name: string;
  code: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  branch_count?: number;
  user_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStoreRequest {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  moduleIds?: number[];
  owner?: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  };
}

export interface DashboardMetrics {
  total_stores: number;
  active_stores: number;
  inactive_stores: number;
  total_branches: number;
  total_users: number;
}
