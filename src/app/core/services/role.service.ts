import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from './service_api';
import { ApiResponse, Role, Permission } from '../models/auth.model';

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionIds?: number[];
}

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  constructor(private http: HttpClient) {}

  getAllRoles(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(API_ENDPOINTS.ROLES.BASE);
  }

  getRoleById(id: number): Observable<ApiResponse<Role & { permissions: Permission[] }>> {
    return this.http.get<ApiResponse<Role & { permissions: Permission[] }>>(API_ENDPOINTS.ROLES.BY_ID(id));
  }

  createRole(data: CreateRolePayload): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(API_ENDPOINTS.ROLES.BASE, data);
  }

  updateRole(id: number, data: Partial<CreateRolePayload>): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(API_ENDPOINTS.ROLES.BY_ID(id), data);
  }

  deleteRole(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(API_ENDPOINTS.ROLES.BY_ID(id));
  }

  getRolePermissions(id: number): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(API_ENDPOINTS.ROLES.PERMISSIONS(id));
  }

  updateRolePermissions(id: number, permissionIds: number[]): Observable<ApiResponse<Permission[]>> {
    return this.http.put<ApiResponse<Permission[]>>(API_ENDPOINTS.ROLES.PERMISSIONS(id), { permissionIds });
  }
}
