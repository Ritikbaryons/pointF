import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  StoreModule,
  Branch,
  Role,
  Permission
} from '../models/auth.model';
import {
  Store,
  CreateStoreRequest,
  DashboardMetrics
} from '../models/store.model';

export interface CreateUserPayload {
  name: string;
  email: string;
  phone?: string | null;
  password?: string;
  roleId?: number;
  branchIds?: number[];
  storeId?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  joiningDate?: string | null;
  address?: string | null;
  countryId?: number | null;
  stateId?: number | null;
  cityId?: number | null;
  voidPassword?: string | null;
  photoUrl?: string | null;
  idCardNo?: string | null;
  shiftTiming?: string | null;
  offDays?: string[];
  phoneNumbers?: any[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionIds?: number[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ==========================================
  // STORE ENDPOINTS
  // ==========================================

  getAllStores(): Observable<ApiResponse<Store[]>> {
    return this.http.get<ApiResponse<Store[]>>(`${this.baseUrl}/stores`);
  }

  getStoreById(id: number): Observable<ApiResponse<Store>> {
    return this.http.get<ApiResponse<Store>>(`${this.baseUrl}/stores/${id}`);
  }

  createStore(data: CreateStoreRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/stores`, data);
  }

  updateStore(id: number, data: Partial<Store>): Observable<ApiResponse<Store>> {
    return this.http.put<ApiResponse<Store>>(`${this.baseUrl}/stores/${id}`, data);
  }

  updateStoreStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): Observable<ApiResponse<Store>> {
    return this.http.patch<ApiResponse<Store>>(`${this.baseUrl}/stores/${id}/status`, { status });
  }

  getStoreModules(id: number): Observable<ApiResponse<StoreModule[]>> {
    return this.http.get<ApiResponse<StoreModule[]>>(`${this.baseUrl}/stores/${id}/modules`);
  }

  updateStoreModules(
    id: number,
    modules: { moduleId: number; isEnabled: boolean }[]
  ): Observable<ApiResponse<StoreModule[]>> {
    return this.http.put<ApiResponse<StoreModule[]>>(`${this.baseUrl}/stores/${id}/modules`, { modules });
  }

  getDashboardMetrics(): Observable<ApiResponse<DashboardMetrics>> {
    return this.http.get<ApiResponse<DashboardMetrics>>(`${this.baseUrl}/stores/metrics`);
  }

  // ==========================================
  // BRANCH ENDPOINTS
  // ==========================================

  getAllBranches(storeId?: number): Observable<ApiResponse<Branch[]>> {
    let params = new HttpParams();
    if (storeId) {
      params = params.set('storeId', storeId.toString());
    }
    return this.http.get<ApiResponse<Branch[]>>(`${this.baseUrl}/branches`, { params });
  }

  getBranchById(id: number): Observable<ApiResponse<Branch>> {
    return this.http.get<ApiResponse<Branch>>(`${this.baseUrl}/branches/${id}`);
  }

  createBranch(data: Partial<Branch>): Observable<ApiResponse<Branch>> {
    return this.http.post<ApiResponse<Branch>>(`${this.baseUrl}/branches`, data);
  }

  updateBranch(id: number, data: Partial<Branch>): Observable<ApiResponse<Branch>> {
    return this.http.put<ApiResponse<Branch>>(`${this.baseUrl}/branches/${id}`, data);
  }

  updateBranchStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): Observable<ApiResponse<Branch>> {
    return this.http.patch<ApiResponse<Branch>>(`${this.baseUrl}/branches/${id}/status`, { status });
  }

  getBranchModules(id: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/branches/${id}/modules`);
  }

  updateBranchModules(
    id: number,
    modules: { moduleId: number; isEnabled: boolean }[]
  ): Observable<ApiResponse<any[]>> {
    return this.http.put<ApiResponse<any[]>>(`${this.baseUrl}/branches/${id}/modules`, { modules });
  }

  // ==========================================
  // USER ENDPOINTS
  // ==========================================

  getAllUsers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/users`);
  }

  getUserById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/users/${id}`);
  }

  createUser(data: CreateUserPayload): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/users`, data);
  }

  updateUser(id: number, data: Partial<CreateUserPayload>): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/users/${id}`, data);
  }

  updateUserStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/users/${id}/status`, { status });
  }

  // ==========================================
  // ROLE ENDPOINTS
  // ==========================================

  getAllRoles(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(`${this.baseUrl}/roles`);
  }

  getRoleById(id: number): Observable<ApiResponse<Role & { permissions: Permission[] }>> {
    return this.http.get<ApiResponse<Role & { permissions: Permission[] }>>(`${this.baseUrl}/roles/${id}`);
  }

  createRole(data: CreateRolePayload): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(`${this.baseUrl}/roles`, data);
  }

  updateRole(id: number, data: Partial<CreateRolePayload>): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(`${this.baseUrl}/roles/${id}`, data);
  }

  deleteRole(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/roles/${id}`);
  }

  getRolePermissions(id: number): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.baseUrl}/roles/${id}/permissions`);
  }

  updateRolePermissions(
    id: number,
    permissionIds: number[]
  ): Observable<ApiResponse<Permission[]>> {
    return this.http.put<ApiResponse<Permission[]>>(`${this.baseUrl}/roles/${id}/permissions`, {
      permissionIds,
    });
  }

  // ==========================================
  // PERMISSIONS & MODULES CATALOG ENDPOINTS
  // ==========================================

  getAllPermissions(branchId?: number | null): Observable<ApiResponse<Permission[]>> {
    let params = new HttpParams();
    if (branchId) {
      params = params.set('branchId', branchId.toString());
    }
    return this.http.get<ApiResponse<Permission[]>>(`${this.baseUrl}/permissions`, { params });
  }

  getAllStoreModules(): Observable<ApiResponse<StoreModule[]>> {
    return this.http.get<ApiResponse<StoreModule[]>>(`${this.baseUrl}/permissions/modules`);
  }

  // ==========================================
  // BUSINESS MODULES FEATURE ENDPOINTS
  // ==========================================

  getInventory(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/inventory`);
  }

  adjustInventory(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/inventory/adjust`, data);
  }

  getPosSession(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/pos`);
  }

  getCustomers(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/customers`);
  }

  // ==========================================
  // LOCATION & UPLOAD ENDPOINTS
  // ==========================================

  getCountries(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/locations/countries`);
  }

  getStates(countryId: number): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('countryId', countryId.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/locations/states`, { params });
  }

  getCities(countryId: number, stateId?: number): Observable<ApiResponse<any[]>> {
    let params = new HttpParams().set('countryId', countryId.toString());
    if (stateId) {
      params = params.set('stateId', stateId.toString());
    }
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/locations/cities`, { params });
  }

  uploadFile(fileData: string, fileName?: string, fileType?: string): Observable<ApiResponse<{ url: string; fileName: string }>> {
    return this.http.post<ApiResponse<{ url: string; fileName: string }>>(`${this.baseUrl}/upload`, { fileData, fileName, fileType });
  }

  // ==========================================
  // SUPPLIER ENDPOINTS
  // ==========================================

  getSuppliers(params?: { search?: string; storeId?: number; branchId?: number }): Observable<ApiResponse<Supplier[]>> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.storeId) httpParams = httpParams.set('storeId', params.storeId.toString());
    if (params?.branchId) httpParams = httpParams.set('branchId', params.branchId.toString());
    return this.http.get<ApiResponse<Supplier[]>>(`${this.baseUrl}/suppliers`, { params: httpParams });
  }

  getSupplierById(id: number): Observable<ApiResponse<Supplier>> {
    return this.http.get<ApiResponse<Supplier>>(`${this.baseUrl}/suppliers/${id}`);
  }

  createSupplier(payload: CreateSupplierPayload): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(`${this.baseUrl}/suppliers`, payload);
  }

  updateSupplier(id: number, payload: Partial<CreateSupplierPayload>): Observable<ApiResponse<Supplier>> {
    return this.http.put<ApiResponse<Supplier>>(`${this.baseUrl}/suppliers/${id}`, payload);
  }

  deleteSupplier(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/suppliers/${id}`);
  }

  // ==========================================
  // CATEGORY ENDPOINTS
  // ==========================================

  getCategories(params?: { search?: string; groupName?: string; storeId?: number; branchId?: number }): Observable<ApiResponse<Category[]>> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.groupName) httpParams = httpParams.set('groupName', params.groupName);
    if (params?.storeId) httpParams = httpParams.set('storeId', params.storeId.toString());
    if (params?.branchId) httpParams = httpParams.set('branchId', params.branchId.toString());
    return this.http.get<ApiResponse<Category[]>>(`${this.baseUrl}/categories`, { params: httpParams });
  }

  getCategoryGroups(params?: { storeId?: number }): Observable<ApiResponse<string[]>> {
    let httpParams = new HttpParams();
    if (params?.storeId) httpParams = httpParams.set('storeId', params.storeId.toString());
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/categories/groups`, { params: httpParams });
  }

  getCategoryById(id: number): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.baseUrl}/categories/${id}`);
  }

  createCategory(payload: CreateCategoryPayload): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.baseUrl}/categories`, payload);
  }

  updateCategory(id: number, payload: Partial<CreateCategoryPayload>): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.baseUrl}/categories/${id}`, payload);
  }

  deleteCategory(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/categories/${id}`);
  }

  // ==========================================
  // PRODUCT / ITEM ENDPOINTS
  // ==========================================

  getProducts(params?: {
    storeId?: number;
    branchId?: number;
    categoryId?: number;
    supplierId?: number;
    isLooseItem?: boolean;
    search?: string;
  }): Observable<ApiResponse<Product[]>> {
    let httpParams = new HttpParams();
    if (params?.storeId) httpParams = httpParams.set('storeId', params.storeId.toString());
    if (params?.branchId) httpParams = httpParams.set('branchId', params.branchId.toString());
    if (params?.categoryId) httpParams = httpParams.set('categoryId', params.categoryId.toString());
    if (params?.supplierId) httpParams = httpParams.set('supplierId', params.supplierId.toString());
    if (params?.isLooseItem !== undefined) httpParams = httpParams.set('isLooseItem', params.isLooseItem.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<ApiResponse<Product[]>>(`${this.baseUrl}/products`, { params: httpParams });
  }

  getProductById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/products/${id}`);
  }

  createProduct(payload: CreateProductPayload): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.baseUrl}/products`, payload);
  }

  updateProduct(id: number, payload: Partial<CreateProductPayload>): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.baseUrl}/products/${id}`, payload);
  }

  toggleProductStatus(id: number): Observable<ApiResponse<Product>> {
    return this.http.patch<ApiResponse<Product>>(`${this.baseUrl}/products/${id}/status`, {});
  }

  deleteProduct(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/products/${id}`);
  }

  // ==========================================
  // STOCK / INVENTORY MASTER ENDPOINTS
  // ==========================================

  getStocks(params?: {
    storeId?: number;
    branchId?: number;
    categoryId?: number;
    supplierId?: number;
    lowStockOnly?: boolean;
    search?: string;
  }): Observable<ApiResponse<Stock[]>> {
    let httpParams = new HttpParams();
    if (params?.storeId) httpParams = httpParams.set('storeId', params.storeId.toString());
    if (params?.branchId) httpParams = httpParams.set('branchId', params.branchId.toString());
    if (params?.categoryId) httpParams = httpParams.set('categoryId', params.categoryId.toString());
    if (params?.supplierId) httpParams = httpParams.set('supplierId', params.supplierId.toString());
    if (params?.lowStockOnly !== undefined) httpParams = httpParams.set('lowStockOnly', params.lowStockOnly.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<ApiResponse<Stock[]>>(`${this.baseUrl}/stocks`, { params: httpParams });
  }

  getStockById(id: number): Observable<ApiResponse<Stock>> {
    return this.http.get<ApiResponse<Stock>>(`${this.baseUrl}/stocks/${id}`);
  }

  createStock(payload: CreateStockPayload): Observable<ApiResponse<Stock>> {
    return this.http.post<ApiResponse<Stock>>(`${this.baseUrl}/stocks`, payload);
  }

  updateStock(id: number, payload: Partial<CreateStockPayload>): Observable<ApiResponse<Stock>> {
    return this.http.put<ApiResponse<Stock>>(`${this.baseUrl}/stocks/${id}`, payload);
  }

  deleteStock(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/stocks/${id}`);
  }

  updateStockStatus(id: number, status: string): Observable<ApiResponse<Stock>> {
    return this.http.patch<ApiResponse<Stock>>(`${this.baseUrl}/stocks/${id}/status`, { status });
  }

  resetStocks(params?: { storeId?: number; branchId?: number }): Observable<ApiResponse<{ deletedCount: number }>> {
    return this.http.post<ApiResponse<{ deletedCount: number }>>(`${this.baseUrl}/stocks/reset`, params || {});
  }

  importStocks(items: any[], params?: { storeId?: number; branchId?: number }): Observable<ApiResponse<{ inserted: number; updated: number; total: number }>> {
    return this.http.post<ApiResponse<{ inserted: number; updated: number; total: number }>>(`${this.baseUrl}/stocks/import`, {
      items,
      storeId: params?.storeId,
      branchId: params?.branchId,
    });
  }
}

export interface Category {
  id: number;
  store_id?: number | null;
  branch_id?: number | null;
  group_name: string;
  category_name: string;
  category_code?: string | null;
  logo_url?: string | null;
  description?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryPayload {
  groupName: string;
  categoryName: string;
  categoryCode?: string;
  logoUrl?: string;
  description?: string;
  storeId?: number | null;
  branchId?: number | null;
}

export interface Supplier {
  id: number;
  store_id?: number | null;
  branch_id?: number | null;
  supplier_name: string;
  supplier_type?: string;
  address: string;
  contact_number: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSupplierPayload {
  supplierName: string;
  supplierType?: string;
  address: string;
  contactNumber: string;
  storeId?: number | null;
  branchId?: number | null;
}

export interface Product {
  id: number;
  store_id?: number | null;
  branch_id?: number | null;
  supplier_id?: number | null;
  supplier_name?: string | null;
  display_supplier_name?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  display_category_name?: string | null;
  category_group?: string | null;
  item_name: string;
  item_type?: string;
  mrp: number;
  msp: number;
  unit: string;
  volume: number;
  is_loose_item: boolean;
  barcode?: string | null;
  description?: string | null;
  tax_rate?: number;
  cover_image_url?: string | null;
  item_images?: string[];
  status: string;
  created_at?: string;
  updated_at?: string;
  store_name?: string | null;
  branch_name?: string | null;
}

export interface CreateProductPayload {
  itemName: string;
  supplierId?: number | null;
  supplierName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  itemType?: string;
  mrp: number;
  msp: number;
  unit: string;
  volume?: number;
  isLooseItem?: boolean;
  barcode?: string | null;
  description?: string | null;
  taxRate?: number;
  coverImageUrl?: string | null;
  itemImages?: string[];
  status?: string;
  storeId?: number | null;
  branchId?: number | null;
}

export interface Stock {
  id: number;
  store_id?: number | null;
  branch_id?: number | null;
  product_id: number;
  product_name: string;
  category_id?: number | null;
  category_name?: string | null;
  supplier_id?: number | null;
  supplier_name?: string | null;
  unit: string;
  price: number;
  quantity: number;
  actual_quantity: number;
  critical_quantity: number;
  order_quantity: number;
  created_by?: number | null;
  last_modified_by?: number | null;
  last_reconciled_at?: string | null;
  status: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  product_barcode?: string | null;
  is_loose_item?: boolean;
  cover_image_url?: string | null;
  store_name?: string | null;
  branch_name?: string | null;
}

export interface CreateStockPayload {
  productId: number;
  quantity: number;
  actualQuantity?: number;
  criticalQuantity?: number;
  orderQuantity?: number;
  price?: number;
  unit?: string;
  storeId?: number | null;
  branchId?: number | null;
  status?: string;
}

