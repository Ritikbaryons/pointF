import { Routes } from '@angular/router';
import { authGuard, superAdminGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { storeModuleGuard } from './core/guards/store-module.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./features/auth/access-denied/access-denied.component').then((m) => m.AccessDeniedComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      // Super Admin Platform Routes
      {
        path: 'admin/dashboard',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/super-admin/dashboard/super-admin-dashboard.component').then(
            (m) => m.SuperAdminDashboardComponent
          ),
      },
      {
        path: 'admin/stores',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/super-admin/stores/store-list.component').then(
            (m) => m.StoreListComponent
          ),
      },
      {
        path: 'admin/stores/create',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/super-admin/stores/create-store.component').then(
            (m) => m.CreateStoreComponent
          ),
      },
      {
        path: 'admin/branches',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/super-admin/branches/super-admin-branches.component').then(
            (m) => m.SuperAdminBranchesComponent
          ),
      },

      // Store Admin Routes
      {
        path: 'store/dashboard',
        loadComponent: () =>
          import('./features/store-admin/dashboard/store-dashboard.component').then(
            (m) => m.StoreDashboardComponent
          ),
      },
      {
        path: 'store/branches',
        canActivate: [storeModuleGuard, permissionGuard],
        data: {
          module: 'BRANCH_MANAGEMENT',
          permission: 'BRANCH_VIEW',
        },
        loadComponent: () =>
          import('./features/store-admin/branches/branch-management.component').then(
            (m) => m.BranchManagementComponent
          ),
      },
      {
        path: 'store/users',
        canActivate: [storeModuleGuard, permissionGuard],
        data: {
          module: 'USER_MANAGEMENT',
          permission: 'USER_VIEW',
        },
        loadComponent: () =>
          import('./features/store-admin/users/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: 'store/roles',
        canActivate: [storeModuleGuard, permissionGuard],
        data: {
          module: 'ROLE_MANAGEMENT',
          permission: 'ROLE_VIEW',
        },
        loadComponent: () =>
          import('./features/store-admin/roles/role-management.component').then(
            (m) => m.RoleManagementComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
