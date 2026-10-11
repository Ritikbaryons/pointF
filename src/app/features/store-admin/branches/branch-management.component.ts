import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.services';
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
    private apiService: ApiService,
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
      openingTime: ['08:00', Validators.required],
      closingTime: ['22:00', Validators.required],
      logoUrl: [''],
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
    this.apiService.getAllBranches().subscribe({
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

  isEditMode = false;
  editingBranchId: number | null = null;
  branchLogoFileName = '';
  uploadingBranchLogo = false;

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingBranchId = null;
    this.branchForm.reset({
      country: 'India',
      openingTime: '08:00',
      closingTime: '22:00',
      logoUrl: '',
    });
    this.branchLogoFileName = '';
    this.submitted = false;
    this.errorMessage = '';
    // By default, pre-select all catalog modules for the new branch
    this.selectedModuleIds = new Set(this.catalogModules.map(m => m.id));
    this.showModal = true;
  }

  openEditModal(branch: any): void {
    this.isEditMode = true;
    this.editingBranchId = branch.id;
    this.submitted = false;
    this.errorMessage = '';

    this.branchForm.patchValue({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      country: branch.country || 'India',
      pincode: branch.pincode || '',
      openingTime: branch.opening_time || '08:00',
      closingTime: branch.closing_time || '22:00',
      logoUrl: branch.logo_url || '',
    });

    this.branchLogoFileName = branch.logo_url ? 'Current Branch Logo' : '';
    this.showModal = true;
  }

  onBranchLogoSelect(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.uploadingBranchLogo = true;
      const base64Data = reader.result as string;
      this.apiService.uploadFile(base64Data, file.name, file.type).subscribe({
        next: (res) => {
          this.uploadingBranchLogo = false;
          if (res.success && res.data) {
            this.branchLogoFileName = file.name;
            this.branchForm.patchValue({ logoUrl: res.data.url });
          }
        },
        error: (err) => {
          this.uploadingBranchLogo = false;
          console.error('Logo upload error:', err);
          alert('Failed to upload branch logo.');
        },
      });
    };
    reader.readAsDataURL(file);
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.editingBranchId = null;
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
    const formVal = this.branchForm.value;

    if (this.isEditMode && this.editingBranchId) {
      const editPayload = {
        name: formVal.name,
        code: formVal.code,
        address: formVal.address,
        city: formVal.city,
        state: formVal.state,
        country: formVal.country,
        pincode: formVal.pincode,
        openingTime: formVal.openingTime,
        closingTime: formVal.closingTime,
        logoUrl: formVal.logoUrl,
      };

      this.apiService.updateBranch(this.editingBranchId, editPayload).subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
          this.loadBranches();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Failed to update branch';
        },
      });
    } else {
      const createPayload: any = {
        ...formVal,
        moduleIds: Array.from(this.selectedModuleIds),
      };
      if (this.storeContext.selectedStoreId()) {
        createPayload.storeId = this.storeContext.selectedStoreId();
      }

      this.apiService.createBranch(createPayload).subscribe({
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
  }

  openModuleModal(branch: any): void {
    this.selectedBranchForModules = branch;
    this.loadingModules = true;
    this.moduleSuccessMessage = '';
    this.showModuleModal = true;

    this.apiService.getBranchModules(branch.id).subscribe({
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

    this.apiService.updateBranchModules(this.selectedBranchForModules.id, payload).subscribe({
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
    this.apiService.updateBranchStatus(branch.id, newStatus).subscribe({
      next: (res: any) => {
        if (res.success) {
          branch.status = newStatus;
        }
      },
    });
  }
}
