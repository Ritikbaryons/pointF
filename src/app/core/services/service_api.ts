import { environment } from '../../../environments/environment';

export const API_ENDPOINTS = {
  // Auth Endpoints
  AUTH: {
    LOGIN: `${environment.apiUrl}/auth/login`,
    LOGOUT: `${environment.apiUrl}/auth/logout`,
    GET_ME: `${environment.apiUrl}/auth/me`,
  },

  // Store Endpoints
  STORES: {
    BASE: `${environment.apiUrl}/stores`,
    METRICS: `${environment.apiUrl}/stores/metrics`,
    BY_ID: (id: number) => `${environment.apiUrl}/stores/${id}`,
    STATUS: (id: number) => `${environment.apiUrl}/stores/${id}/status`,
    MODULES: (id: number) => `${environment.apiUrl}/stores/${id}/modules`,
  },

  // Branch Endpoints
  BRANCHES: {
    BASE: `${environment.apiUrl}/branches`,
    BY_ID: (id: number) => `${environment.apiUrl}/branches/${id}`,
    STATUS: (id: number) => `${environment.apiUrl}/branches/${id}/status`,
    MODULES: (id: number) => `${environment.apiUrl}/branches/${id}/modules`,
  },

  // User Endpoints
  USERS: {
    BASE: `${environment.apiUrl}/users`,
    BY_ID: (id: number) => `${environment.apiUrl}/users/${id}`,
    STATUS: (id: number) => `${environment.apiUrl}/users/${id}/status`,
  },

  // Role Endpoints
  ROLES: {
    BASE: `${environment.apiUrl}/roles`,
    BY_ID: (id: number) => `${environment.apiUrl}/roles/${id}`,
    PERMISSIONS: (id: number) => `${environment.apiUrl}/roles/${id}/permissions`,
  },

  // Permissions & Store Modules Catalog
  PERMISSIONS: {
    BASE: `${environment.apiUrl}/permissions`,
    MODULES: `${environment.apiUrl}/permissions/modules`,
  },
};
