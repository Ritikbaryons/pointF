import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { BranchService } from '../../../core/services/branch.service';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { StoreModule } from '../../../core/models/auth.model';

@Component({
  selector: 'app-store-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './store-dashboard.component.html',
  styleUrl: './store-dashboard.component.css',
})
export class StoreDashboardComponent implements OnInit {
  allCatalogModules: StoreModule[] = [];
  branchCount = 0;
  userCount = 0;
  roleCount = 0;

  constructor(
    public authService: AuthService,
    public permissionService: PermissionService,
    private branchService: BranchService,
    private userService: UserService,
    private roleService: RoleService,
    public storeContext: StoreContextService
  ) {
    // Auto-reload metrics when Super Admin selects different store
    effect(() => {
      const storeId = this.storeContext.selectedStoreId();
      this.loadDashboardData();
    });
  }

  ngOnInit(): void {
    this.permissionService.getAllStoreModules().subscribe({
      next: (res) => {
        if (res.success) {
          this.allCatalogModules = res.data;
        }
      },
    });

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.branchService.getAllBranches().subscribe({
      next: (res) => { if (res.success) this.branchCount = res.data.length; },
    });

    this.userService.getAllUsers().subscribe({
      next: (res) => { if (res.success) this.userCount = res.data.length; },
    });

    this.roleService.getAllRoles().subscribe({
      next: (res) => { if (res.success) this.roleCount = res.data.length; },
    });
  }

  get userRole(): string {
    const roles = this.authService.userRoles();
    return roles.length > 0 ? roles[0].name : 'Staff';
  }

  isModuleEnabled(moduleCode: string): boolean {
    return this.authService.activeModules().includes(moduleCode);
  }
}
