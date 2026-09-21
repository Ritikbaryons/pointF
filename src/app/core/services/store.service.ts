import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from './service_api';
import { ApiResponse, StoreModule } from '../models/auth.model';
import { Store, CreateStoreRequest, DashboardMetrics } from '../models/store.model';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  constructor(private http: HttpClient) {}

  getAllStores(): Observable<ApiResponse<Store[]>> {
    return this.http.get<ApiResponse<Store[]>>(API_ENDPOINTS.STORES.BASE);
  }

  getStoreById(id: number): Observable<ApiResponse<Store>> {
    return this.http.get<ApiResponse<Store>>(API_ENDPOINTS.STORES.BY_ID(id));
  }

  createStore(data: CreateStoreRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(API_ENDPOINTS.STORES.BASE, data);
  }

  updateStore(id: number, data: Partial<Store>): Observable<ApiResponse<Store>> {
    return this.http.put<ApiResponse<Store>>(API_ENDPOINTS.STORES.BY_ID(id), data);
  }

  updateStoreStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): Observable<ApiResponse<Store>> {
    return this.http.patch<ApiResponse<Store>>(API_ENDPOINTS.STORES.STATUS(id), { status });
  }

  getStoreModules(id: number): Observable<ApiResponse<StoreModule[]>> {
    return this.http.get<ApiResponse<StoreModule[]>>(API_ENDPOINTS.STORES.MODULES(id));
  }

  updateStoreModules(id: number, modules: { moduleId: number; isEnabled: boolean }[]): Observable<ApiResponse<StoreModule[]>> {
    return this.http.put<ApiResponse<StoreModule[]>>(API_ENDPOINTS.STORES.MODULES(id), { modules });
  }

  getDashboardMetrics(): Observable<ApiResponse<DashboardMetrics>> {
    return this.http.get<ApiResponse<DashboardMetrics>>(API_ENDPOINTS.STORES.METRICS);
  }
}
