import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from './service_api';
import { ApiResponse } from '../models/auth.model';

export interface CreateUserPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  roleId: number;
  branchIds?: number[];
  status?: 'ACTIVE' | 'INACTIVE';
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(API_ENDPOINTS.USERS.BASE);
  }

  getUserById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(API_ENDPOINTS.USERS.BY_ID(id));
  }

  createUser(data: CreateUserPayload): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(API_ENDPOINTS.USERS.BASE, data);
  }

  updateUser(id: number, data: Partial<CreateUserPayload>): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(API_ENDPOINTS.USERS.BY_ID(id), data);
  }

  updateUserStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(API_ENDPOINTS.USERS.STATUS(id), { status });
  }
}
