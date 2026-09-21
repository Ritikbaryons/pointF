import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from './service_api';
import { ApiResponse, Branch } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  constructor(private http: HttpClient) {}

  getAllBranches(storeId?: number): Observable<ApiResponse<Branch[]>> {
    let params = new HttpParams();
    if (storeId) {
      params = params.set('storeId', storeId.toString());
    }
    return this.http.get<ApiResponse<Branch[]>>(API_ENDPOINTS.BRANCHES.BASE, { params });
  }

  getBranchById(id: number): Observable<ApiResponse<Branch>> {
    return this.http.get<ApiResponse<Branch>>(API_ENDPOINTS.BRANCHES.BY_ID(id));
  }

  createBranch(data: Partial<Branch>): Observable<ApiResponse<Branch>> {
    return this.http.post<ApiResponse<Branch>>(API_ENDPOINTS.BRANCHES.BASE, data);
  }

  updateBranch(id: number, data: Partial<Branch>): Observable<ApiResponse<Branch>> {
    return this.http.put<ApiResponse<Branch>>(API_ENDPOINTS.BRANCHES.BY_ID(id), data);
  }

  updateBranchStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): Observable<ApiResponse<Branch>> {
    return this.http.patch<ApiResponse<Branch>>(API_ENDPOINTS.BRANCHES.STATUS(id), { status });
  }

  getBranchModules(id: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(API_ENDPOINTS.BRANCHES.MODULES(id));
  }

  updateBranchModules(id: number, modules: { moduleId: number; isEnabled: boolean }[]): Observable<ApiResponse<any[]>> {
    return this.http.put<ApiResponse<any[]>>(API_ENDPOINTS.BRANCHES.MODULES(id), { modules });
  }
}
