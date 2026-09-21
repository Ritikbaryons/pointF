import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from './service_api';
import { ApiResponse, LoginResponse, User, Role, Branch } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'grocery_pos_token';
  private readonly USER_KEY = 'grocery_pos_user';
  private readonly ROLES_KEY = 'grocery_pos_roles';
  private readonly PERMS_KEY = 'grocery_pos_perms';
  private readonly MODULES_KEY = 'grocery_pos_modules';
  private readonly BRANCHES_KEY = 'grocery_pos_branches';

  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  userRoles = signal<Role[]>(this.getStoredRoles());
  userPermissions = signal<string[]>(this.getStoredPermissions());
  activeModules = signal<string[]>(this.getStoredModules());
  userBranches = signal<Branch[]>(this.getStoredBranches());

  isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  isSuperAdmin = computed(() => this.currentUser()?.isSuperAdmin === true);

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { email: string; password: string }): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(API_ENDPOINTS.AUTH.LOGIN, credentials).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLES_KEY);
    localStorage.removeItem(this.PERMS_KEY);
    localStorage.removeItem(this.MODULES_KEY);
    localStorage.removeItem(this.BRANCHES_KEY);

    this.token.set(null);
    this.currentUser.set(null);
    this.userRoles.set([]);
    this.userPermissions.set([]);
    this.activeModules.set([]);
    this.userBranches.set([]);

    this.router.navigate(['/login']);
  }

  fetchProfile(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(API_ENDPOINTS.AUTH.GET_ME).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.currentUser.set(res.data.user);
          this.userRoles.set(res.data.roles || []);
          this.userPermissions.set(res.data.permissions || []);
          this.activeModules.set(res.data.activeModules || []);
          this.userBranches.set(res.data.branches || []);

          localStorage.setItem(this.USER_KEY, JSON.stringify(res.data.user));
          localStorage.setItem(this.ROLES_KEY, JSON.stringify(res.data.roles || []));
          localStorage.setItem(this.PERMS_KEY, JSON.stringify(res.data.permissions || []));
          localStorage.setItem(this.MODULES_KEY, JSON.stringify(res.data.activeModules || []));
          localStorage.setItem(this.BRANCHES_KEY, JSON.stringify(res.data.branches || []));
        }
      })
    );
  }

  private setSession(data: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, data.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(data.roles || []));
    localStorage.setItem(this.PERMS_KEY, JSON.stringify(data.permissions || []));
    localStorage.setItem(this.MODULES_KEY, JSON.stringify(data.activeModules || []));
    localStorage.setItem(this.BRANCHES_KEY, JSON.stringify(data.branches || []));

    this.token.set(data.token);
    this.currentUser.set(data.user);
    this.userRoles.set(data.roles || []);
    this.userPermissions.set(data.permissions || []);
    this.activeModules.set(data.activeModules || []);
    this.userBranches.set(data.branches || []);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private getStoredRoles(): Role[] {
    const raw = localStorage.getItem(this.ROLES_KEY);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private getStoredPermissions(): string[] {
    const raw = localStorage.getItem(this.PERMS_KEY);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private getStoredModules(): string[] {
    const raw = localStorage.getItem(this.MODULES_KEY);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private getStoredBranches(): Branch[] {
    const raw = localStorage.getItem(this.BRANCHES_KEY);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
