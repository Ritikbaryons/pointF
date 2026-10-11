import { Routes } from '@angular/router';
import { authGuard, superAdminGuard } from './core/guards/auth.guard';

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
        data: {
          module: 'ROLE_MANAGEMENT',
          permission: 'ROLE_VIEW',
        },
        loadComponent: () =>
          import('./features/store-admin/roles/role-management.component').then(
            (m) => m.RoleManagementComponent
          ),
      },
      {
        path: 'store/pos',
        loadComponent: () =>
          import('./features/store-admin/cash-counter/cash-counter.component').then(
            (m) => m.CashCounterComponent
          ),
      },
      {
        path: 'store/products',
        redirectTo: 'store/inventory/product',
      },
      {
        path: 'store/inventory',
        loadComponent: () =>
          import('./features/store-admin/Inventory/inventory.component').then(
            (m) => m.InventoryComponent
          ),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'product',
          },
          {
            path: 'supplier',
            loadComponent: () =>
              import('./features/store-admin/Inventory/supplier/supplier.component').then(
                (m) => m.SupplierComponent
              ),
          },
          {
            path: 'product',
            loadComponent: () =>
              import('./features/store-admin/Inventory/product/product.component').then(
                (m) => m.ProductComponent
              ),
          },
          {
            path: 'stock',
            loadComponent: () =>
              import('./features/store-admin/Inventory/stock/stock.component').then(
                (m) => m.StockComponent
              ),
          },
          {
            path: 'category',
            loadComponent: () =>
              import('./features/store-admin/Inventory/category/category.component').then(
                (m) => m.CategoryComponent
              ),
          },
          {
            path: 'supplier-order',
            loadComponent: () =>
              import('./features/store-admin/Inventory/supplier-order/supplier-order.component').then(
                (m) => m.SupplierOrderComponent
              ),
          },
        ],
      },
      {
        path: 'store/customers',
        data: {
          module: 'CUSTOMERS',
          permission: 'CUSTOMER_VIEW',
          title: 'Customer Management',
          desc: 'Customer directory, contact ledger, and loyalty points',
          icon: '👥',
        },
        loadComponent: () =>
          import('./features/store-admin/features/feature-view.component').then(
            (m) => m.FeatureViewComponent
          ),
      },

      // Settings sub-routes
      {
        path: 'store/settings/print-design',
        data: {
          module: 'PRINT_DESIGN',
          title: 'Print Design',
          desc: 'Receipt template styling, thermal printer dimensions, and invoice headers',
          icon: '🖨️',
        },
        loadComponent: () =>
          import('./features/store-admin/features/feature-view.component').then(
            (m) => m.FeatureViewComponent
          ),
      },
      {
        path: 'store/settings/tax',
        data: {
          module: 'TAX_SETTINGS',
          title: 'Tax Configuration',
          desc: 'GST / VAT rates, HSN code tax slabs, and checkout calculations',
          icon: '💰',
        },
        loadComponent: () =>
          import('./features/store-admin/features/feature-view.component').then(
            (m) => m.FeatureViewComponent
          ),
      },
      {
        path: 'store/settings/store-management',
        loadComponent: () =>
          import('./features/store-admin/branches/branch-management.component').then(
            (m) => m.BranchManagementComponent
          ),
      },
      {
        path: 'store/settings/roles-permissions',
        loadComponent: () =>
          import('./features/store-admin/roles/role-management.component').then(
            (m) => m.RoleManagementComponent
          ),
      },
      {
        path: 'store/settings/user-registration',
        loadComponent: () =>
          import('./features/store-admin/users/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: 'store/settings/general',
        data: {
          module: 'GENERAL_SETTINGS',
          title: 'General Settings',
          desc: 'Store business identity, currency symbols, and system preferences',
          icon: '⚙️',
        },
        loadComponent: () =>
          import('./features/store-admin/features/feature-view.component').then(
            (m) => m.FeatureViewComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
