import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { ApiService } from '../../../core/services/api.services';
import { StoreContextService } from '../../../core/services/store-context.service';
import { StoreModule, Branch } from '../../../core/models/auth.model';

@Component({
  selector: 'app-store-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './store-dashboard.component.html',
  styleUrl: './store-dashboard.component.css',
})
export class StoreDashboardComponent implements OnInit {
  allCatalogModules: StoreModule[] = [];

  constructor(
    public authService: AuthService,
    public permissionService: PermissionService,
    private apiService: ApiService,
    public storeContext: StoreContextService
  ) {
    // Only Super Admin switching stores needs dynamic reload from API
    effect(() => {
      const storeId = this.storeContext.selectedStoreId();
      if (this.authService.isSuperAdmin() && storeId) {
        this.loadDashboardDataForSuperAdmin(storeId);
      }
    });
  }

  ngOnInit(): void {
    // Fetch catalog modules once (cached by PermissionService)
    this.permissionService.getAllStoreModules().subscribe({
      next: (res) => {
        if (res.success) {
          this.allCatalogModules = res.data;
        }
      },
    });

    // Ensure active branch modules are loaded for current active branch
    const activeId = this.activeBranch?.id;
    if (activeId) {
      this.storeContext.loadBranchModules(activeId);
    }
  }

  get accessibleBranches(): Branch[] {
    const ctxBranches = this.storeContext.branches();
    if (ctxBranches && ctxBranches.length > 0) return ctxBranches;
    return this.authService.userBranches() || [];
  }

  get activeBranch(): Branch | null {
    const sel = this.storeContext.selectedBranch();
    if (sel) return sel;
    const branches = this.accessibleBranches;
    return branches.length > 0 ? branches[0] : null;
  }

  get branchStaffCount(): number {
    return this.activeBranch?.user_count || 1;
  }

  get branchActiveModuleCount(): number {
    return this.storeContext.activeBranchModules().length;
  }

  switchBranch(branchId: number): void {
    this.storeContext.selectBranch(branchId);
  }

  private loadDashboardDataForSuperAdmin(storeId: number): void {
    this.apiService.getAllBranches(storeId).subscribe();
  }

  get userRole(): string {
    const roles = this.authService.userRoles();
    return roles.length > 0 ? roles[0].name : 'Staff';
  }

  isModuleEnabled(moduleCode: string): boolean {
    return this.storeContext.hasBranchModule(moduleCode);
  }
}
