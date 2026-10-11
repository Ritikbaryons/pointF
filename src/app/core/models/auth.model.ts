export interface User {
  id: number;
  storeId: number | null;
  name: string;
  email: string;
  phone?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  isSuperAdmin: boolean;
  storeName?: string | null;
  storeCode?: string | null;
}

export interface Role {
  id: number;
  store_id: number | null;
  name: string;
  description?: string | null;
  is_system_role: boolean;
  is_active: boolean;
  user_count?: number;
  permission_count?: number;
}

export interface Permission {
  id: number;
  permission_name: string;
  permission_code: string;
  module: string;
  action: string;
  description?: string;
  is_active?: boolean;
}

export interface Branch {
  id: number;
  store_id: number;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  logo_url?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  store_name?: string;
  store_code?: string;
  user_count?: number;
}

export interface StoreModule {
  id: number;
  module_name: string;
  module_code: string;
  description?: string;
  is_active?: boolean;
  is_enabled?: boolean;
  module_id?: number;
}

export interface LoginResponse {
  token: string;
  user: User;
  roles: Role[];
  permissions: string[];
  permissionDetails: Permission[];
  activeModules: string[];
  branches: Branch[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}
