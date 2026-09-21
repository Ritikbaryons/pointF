import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { API_ENDPOINTS } from './service_api';
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

    PRODUCT_VIEW: 'PRODUCT_MANAGEMENT',
    PRODUCT_CREATE: 'PRODUCT_MANAGEMENT',
    PRODUCT_UPDATE: 'PRODUCT_MANAGEMENT',
    PRODUCT_DELETE: 'PRODUCT_MANAGEMENT',

    CATEGORY_VIEW: 'CATEGORY_MANAGEMENT',
    CATEGORY_CREATE: 'CATEGORY_MANAGEMENT',
    CATEGORY_UPDATE: 'CATEGORY_MANAGEMENT',
    CATEGORY_DELETE: 'CATEGORY_MANAGEMENT',

    INVENTORY_VIEW: 'INVENTORY',
    INVENTORY_CREATE: 'INVENTORY',
    INVENTORY_UPDATE: 'INVENTORY',

    SUPPLIER_VIEW: 'SUPPLIER_MANAGEMENT',
    SUPPLIER_CREATE: 'SUPPLIER_MANAGEMENT',
    SUPPLIER_UPDATE: 'SUPPLIER_MANAGEMENT',
    SUPPLIER_DELETE: 'SUPPLIER_MANAGEMENT',

    CUSTOMER_VIEW: 'CUSTOMER_MANAGEMENT',
    CUSTOMER_CREATE: 'CUSTOMER_MANAGEMENT',
    CUSTOMER_UPDATE: 'CUSTOMER_MANAGEMENT',
    CUSTOMER_DELETE: 'CUSTOMER_MANAGEMENT',

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

  constructor(private authService: AuthService, private http: HttpClient) {}

  hasPermission(permissionCode: string): boolean {
    if (this.authService.isSuperAdmin()) {
      return true;
    }

    const moduleCode = this.permissionModuleMap[permissionCode];
    if (moduleCode) {
      const activeModules = this.authService.activeModules();
      if (!activeModules.includes(moduleCode)) {
        return false;
      }
    }

    const permissions = this.authService.userPermissions();
    return permissions.includes(permissionCode);
  }

  hasModule(moduleCode: string): boolean {
    if (this.authService.isSuperAdmin()) {
      return true;
    }
    return this.authService.activeModules().includes(moduleCode);
  }

  getAllPermissions(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(API_ENDPOINTS.PERMISSIONS.BASE);
  }

  getAllStoreModules(): Observable<ApiResponse<StoreModule[]>> {
    return this.http.get<ApiResponse<StoreModule[]>>(API_ENDPOINTS.PERMISSIONS.MODULES);
  }
}
