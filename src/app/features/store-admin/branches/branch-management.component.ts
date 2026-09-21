import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BranchService } from '../../../core/services/branch.service';
import { PermissionService } from '../../../core/services/permission.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { Branch } from '../../../core/models/auth.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-branch-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasPermissionDirective],
  templateUrl: './branch-management.component.html',
  styleUrl: './branch-management.component.css',
})
export class BranchManagementComponent implements OnInit {
  branches: any[] = [];
  showModal = false;
  showModuleModal = false;
  selectedBranchForModules: any = null;
  branchModules: any[] = [];
  catalogModules: any[] = [];
  selectedModuleIds = new Set<number>();
  
  branchForm: FormGroup;
  submitted = false;
  loading = false;
  loadingModules = false;
  savingModules = false;
  errorMessage = '';
  moduleSuccessMessage = '';

  constructor(
    private fb: FormBuilder,
    private branchService: BranchService,
    public permissionService: PermissionService,
    public storeContext: StoreContextService
  ) {
    this.branchForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      address: [''],
      city: [''],
      state: [''],
      pincode: [''],
      country: ['India'],
    });

    // Auto-reload when Super Admin selects different store
    effect(() => {
      const storeId = this.storeContext.selectedStoreId();
      this.loadBranches();
    });
  }

  ngOnInit(): void {
    this.loadBranches();
    this.loadCatalogModules();
  }

  loadBranches(): void {
    this.branchService.getAllBranches().subscribe({
      next: (res) => {
        if (res.success) {
          this.branches = res.data;
        }
      },
    });
  }

  loadCatalogModules(): void {
    this.permissionService.getAllStoreModules().subscribe({
      next: (res) => {
        if (res.success) {
          this.catalogModules = res.data;
        }
      },
    });
  }

  get f() {
    return this.branchForm.controls;
  }

  openCreateModal(): void {
    this.branchForm.reset({ country: 'India' });
    this.submitted = false;
    this.errorMessage = '';
    // By default, pre-select all catalog modules for the new branch
    this.selectedModuleIds = new Set(this.catalogModules.map(m => m.id));
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  toggleCreateModule(moduleId: number): void {
    if (this.selectedModuleIds.has(moduleId)) {
      this.selectedModuleIds.delete(moduleId);
    } else {
      this.selectedModuleIds.add(moduleId);
    }
  }

  isCreateModuleSelected(moduleId: number): boolean {
    return this.selectedModuleIds.has(moduleId);
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.branchForm.invalid) {
      return;
    }

    this.loading = true;
    const payload: any = {
      ...this.branchForm.value,
      moduleIds: Array.from(this.selectedModuleIds),
    };
    if (this.storeContext.selectedStoreId()) {
      payload.storeId = this.storeContext.selectedStoreId();
    }

    this.branchService.createBranch(payload).subscribe({
      next: () => {
        this.loading = false;
        this.closeModal();
        this.loadBranches();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to create branch';
      },
    });
  }

  openModuleModal(branch: any): void {
    this.selectedBranchForModules = branch;
    this.loadingModules = true;
    this.moduleSuccessMessage = '';
    this.showModuleModal = true;

    this.branchService.getBranchModules(branch.id).subscribe({
      next: (res) => {
        this.loadingModules = false;
        this.branchModules = res.data || [];
      },
      error: () => {
        this.loadingModules = false;
      },
    });
  }

  closeModuleModal(): void {
    this.showModuleModal = false;
    this.selectedBranchForModules = null;
    this.branchModules = [];
  }

  toggleBranchModule(mod: any): void {
    mod.is_enabled = !mod.is_enabled;
  }

  saveBranchModules(): void {
    if (!this.selectedBranchForModules) return;
    this.savingModules = true;

    const payload = this.branchModules.map((m) => ({
      moduleId: m.module_id,
      isEnabled: m.is_enabled,
    }));

    this.branchService.updateBranchModules(this.selectedBranchForModules.id, payload).subscribe({
      next: () => {
        this.savingModules = false;
        this.moduleSuccessMessage = 'Branch modules updated successfully!';
        setTimeout(() => {
          this.closeModuleModal();
          this.loadBranches();
        }, 800);
      },
      error: (err) => {
        this.savingModules = false;
        this.errorMessage = err.error?.message || 'Failed to update branch modules';
      },
    });
  }

  toggleStatus(branch: Branch): void {
    const newStatus = branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.branchService.updateBranchStatus(branch.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          branch.status = newStatus;
        }
      },
    });
  }
}
