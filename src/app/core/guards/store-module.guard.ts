import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const storeModuleGuard: CanActivateFn = (route) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const requiredModule = route.data?.['module'] as string;
  if (!requiredModule || permissionService.hasModule(requiredModule)) {
    return true;
  }

  // Module disabled for store
  router.navigate(['/access-denied']);
  return false;
};
