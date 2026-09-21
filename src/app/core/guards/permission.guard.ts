import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const permissionGuard: CanActivateFn = (route) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const requiredPermission = route.data?.['permission'] as string;
  if (!requiredPermission || permissionService.hasPermission(requiredPermission)) {
    return true;
  }

  // Not authorized
  router.navigate(['/access-denied']);
  return false;
};
