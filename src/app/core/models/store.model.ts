import { StoreModule } from './auth.model';

export interface Store {
  id: number;
  name: string;
  code: string;
  registration_no?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  country_id?: number | null;
  state_id?: number | null;
  city_id?: number | null;
  pincode?: string | null;
  po_box?: string | null;
  trn_number?: string | null;
  reset_time?: string | null;
  trn_certificate_url?: string | null;
  logo_url?: string | null;
  trade_license_url?: string | null;
  phone_numbers?: any[];
  status: 'ACTIVE' | 'INACTIVE';
  branch_count?: number;
  user_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStoreRequest {
  name: string;
  code?: string;
  registrationNo?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  pincode?: string;
  poBox?: string;
  trnNumber?: string;
  resetTime?: string;
  trnCertificateUrl?: string;
  logoUrl?: string;
  tradeLicenseUrl?: string;
  phoneNumbers?: { number: string; countryCode: string; isPrimary: boolean }[];
  agreedTerms?: boolean;
  moduleIds?: number[];
  owner?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    name?: string;
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

export interface Country {
  id: number;
  name: string;
  iso_code?: string;
  phone_code?: string;
  currency?: string;
}

export interface State {
  id: number;
  country_id: number;
  name: string;
  code?: string;
}

export interface City {
  id: number;
  country_id: number;
  state_id?: number;
  name: string;
}
