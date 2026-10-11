import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { StoreContextService } from './store-context.service';
import { ApiService } from './api.services';
import { ApiResponse, Permission, StoreModule } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly permissionModuleMap: Record<string, string> = {
    USER_VIEW: 'USER_MANAGEMENT',
    USER_CREATE: 'USER_MANAGEMENT',
    USER_UPDATE: 'USER_MANAGEMENT',
    USER_STATUS_UPDATE: 'USER_MANAGEMENT',

    ROLE_VIEW: 'ROLE_MANAGEMENT',
    ROLE_CREATE: 'ROLE_MANAGEMENT',
    ROLE_UPDATE: 'ROLE_MANAGEMENT',
    ROLE_DELETE: 'ROLE_MANAGEMENT',
    ROLE_PERMISSION_UPDATE: 'ROLE_MANAGEMENT',
    PERMISSION_VIEW: 'ROLE_MANAGEMENT',

    BRANCH_VIEW: 'BRANCH_MANAGEMENT',
    BRANCH_CREATE: 'BRANCH_MANAGEMENT',
    BRANCH_UPDATE: 'BRANCH_MANAGEMENT',
    BRANCH_STATUS_UPDATE: 'BRANCH_MANAGEMENT',

    PRODUCT_VIEW: 'PRODUCTS',
    PRODUCT_CREATE: 'PRODUCTS',
    PRODUCT_UPDATE: 'PRODUCTS',
    PRODUCT_DELETE: 'PRODUCTS',

    CATEGORY_VIEW: 'CATEGORY_MANAGEMENT',
    CATEGORY_CREATE: 'CATEGORY_MANAGEMENT',
    CATEGORY_UPDATE: 'CATEGORY_MANAGEMENT',
    CATEGORY_DELETE: 'CATEGORY_MANAGEMENT',

    INVENTORY_VIEW: 'INVENTORY',
    INVENTORY_CREATE: 'INVENTORY',
    INVENTORY_UPDATE: 'INVENTORY',

    SUPPLIER_VIEW: 'SUPPLIERS',
    SUPPLIER_CREATE: 'SUPPLIERS',
    SUPPLIER_UPDATE: 'SUPPLIERS',
    SUPPLIER_DELETE: 'SUPPLIERS',

    CUSTOMER_VIEW: 'CUSTOMERS',
    CUSTOMER_CREATE: 'CUSTOMERS',
    CUSTOMER_UPDATE: 'CUSTOMERS',
    CUSTOMER_DELETE: 'CUSTOMERS',

    ORDER_VIEW: 'ORDERS',
    ORDER_CREATE: 'ORDERS',
    ORDER_UPDATE: 'ORDERS',
    ORDER_CANCEL: 'ORDERS',

    PAYMENT_VIEW: 'PAYMENTS',
    PAYMENT_CREATE: 'PAYMENTS',

    DELIVERY_VIEW: 'DELIVERY',
    DELIVERY_UPDATE: 'DELIVERY',

    REPORT_VIEW: 'REPORTS',
  };

  constructor(
    private authService: AuthService,
    private storeContext: StoreContextService,
    private api: ApiService
  ) {}

  hasPermission(_permissionCode?: string): boolean {
    return true;
  }

  hasModule(_moduleCode?: string): boolean {
    return true;
  }

  getAllPermissions(branchId?: number | null): Observable<ApiResponse<Permission[]>> {
    return this.api.getAllPermissions(branchId);
  }

  private cachedModules: StoreModule[] | null = null;

  getAllStoreModules(): Observable<ApiResponse<StoreModule[]>> {
    if (this.cachedModules && this.cachedModules.length > 0) {
      return of({ success: true, message: 'Cached', data: this.cachedModules });
    }
    return this.api.getAllStoreModules().pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.cachedModules = res.data;
        }
      })
    );
  }
}
