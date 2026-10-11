import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StoreContextService } from '../services/store-context.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const storeContext = inject(StoreContextService);
  const token = authService.token();

  let headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If Super Admin has selected a store, propagate x-store-id
  if (authService.isSuperAdmin()) {
    const activeStoreId = storeContext.selectedStoreId();
    if (activeStoreId) {
      headers['x-store-id'] = activeStoreId.toString();
    }
  }

  // Propagate active branch ID for ALL authenticated requests
  const activeBranchId = storeContext.selectedBranchId();
  if (activeBranchId) {
    headers['x-branch-id'] = activeBranchId.toString();
  }

  const authReq = req.clone({
    setHeaders: headers,
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
