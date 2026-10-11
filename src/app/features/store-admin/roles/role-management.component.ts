import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.services';
import { PermissionService } from '../../../core/services/permission.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { Role, Permission } from '../../../core/models/auth.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

interface ModulePermissionGroup {
  moduleName: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasPermissionDirective],
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.css',
})
export class RoleManagementComponent implements OnInit {
  roles: Role[] = [];
  allPermissions: Permission[] = [];
  permissionGroups: ModulePermissionGroup[] = [];

  showModal = false;
  editingRoleId: number | null = null;
  roleForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';
  selectedPermIds = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private permissionService: PermissionService,
    public storeContext: StoreContextService
  ) {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });

    // Auto-reload when store context or branch context changes
    effect(() => {
      const storeId = this.storeContext.selectedStoreId();
      this.loadRoles();
    });

    effect(() => {
      const branchId = this.storeContext.selectedBranchId();
      const mods = this.storeContext.activeBranchModules();
      this.loadPermissions();
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles(): void {
    this.apiService.getAllRoles().subscribe({
      next: (res) => {
        if (res.success) {
          this.roles = res.data;
        }
      },
    });
  }

  loadPermissions(): void {
    const branchId = this.storeContext.selectedBranchId();
    this.permissionService.getAllPermissions(branchId).subscribe({
      next: (res) => {
        if (res.success) {
          this.allPermissions = res.data;
          this.groupPermissions();
        }
      },
    });
  }

  groupPermissions(): void {
    const groupMap = new Map<string, Permission[]>();
    for (const p of this.allPermissions) {
      const moduleCode = (p as any).module_code || p.module;
      // Filter out permissions if the module is disabled in the active branch
      if (this.storeContext.selectedBranchId() && !this.storeContext.hasBranchModule(moduleCode)) {
        continue;
      }

      const groupKey = (p as any).module_name || p.module;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(p);
    }

    this.permissionGroups = Array.from(groupMap.entries()).map(([moduleName, permissions]) => ({
      moduleName,
      permissions,
    }));
  }

  get f() {
    return this.roleForm.controls;
  }

  openCreateModal(): void {
    this.editingRoleId = null;
    this.roleForm.reset();
    this.selectedPermIds.clear();
    this.submitted = false;
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(role: Role): void {
    this.editingRoleId = role.id;
    this.roleForm.patchValue({
      name: role.name,
      description: role.description || '',
    });
    this.selectedPermIds.clear();
    this.submitted = false;
    this.errorMessage = '';

    this.apiService.getRolePermissions(role.id).subscribe({
      next: (res) => {
        if (res.success) {
          res.data.forEach((p) => this.selectedPermIds.add(p.id));
          this.showModal = true;
        }
      },
    });
  }

  closeModal(): void {
    this.showModal = false;
  }

  onPermToggle(permId: number, event: any): void {
    if (event.target.checked) {
      this.selectedPermIds.add(permId);
    } else {
      this.selectedPermIds.delete(permId);
    }
  }

  toggleAllInGroup(group: ModulePermissionGroup): void {
    const allSelected = group.permissions.every((p) => this.selectedPermIds.has(p.id));
    if (allSelected) {
      group.permissions.forEach((p) => this.selectedPermIds.delete(p.id));
    } else {
      group.permissions.forEach((p) => this.selectedPermIds.add(p.id));
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.roleForm.invalid) {
      return;
    }

    this.loading = true;
    const payload = {
      name: this.roleForm.value.name,
      description: this.roleForm.value.description,
      permissionIds: Array.from(this.selectedPermIds),
    };

    const action$ = this.editingRoleId
      ? this.apiService.updateRole(this.editingRoleId, payload)
      : this.apiService.createRole(payload);

    action$.subscribe({
      next: () => {
        this.loading = false;
        this.closeModal();
        this.loadRoles();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to save role';
      },
    });
  }

  deleteRole(role: Role): void {
    if (!confirm(`Are you sure you want to delete role '${role.name}'?`)) return;
    this.apiService.deleteRole(role.id).subscribe({
      next: () => {
        this.loadRoles();
      },
    });
  }
}
