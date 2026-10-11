import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.services';
import { PermissionService } from '../../../core/services/permission.service';
import { Branch, StoreModule } from '../../../core/models/auth.model';
import { Store } from '../../../core/models/store.model';

@Component({
  selector: 'app-super-admin-branches',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './super-admin-branches.component.html',
  styleUrl: './super-admin-branches.component.css',
})
export class SuperAdminBranchesComponent implements OnInit {
  branches: any[] = [];
  stores: Store[] = [];
  catalogModules: StoreModule[] = [];

  // Create / Edit Branch Modal State
  showCreateModal = false;
  isEditMode = false;
  editingBranchId: number | null = null;
  branchForm: FormGroup;
  submitted = false;
  creating = false;
  createErrorMessage = '';
  selectedModuleIds = new Set<number>();

  // Module Configuration Modal State
  showModuleModal = false;
  selectedBranchForModules: any = null;
  branchModules: any[] = [];
  loadingModules = false;
  savingModules = false;
  moduleSuccessMessage = '';
  moduleErrorMessage = '';

  branchLogoFileName = '';
  uploadingBranchLogo = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private permissionService: PermissionService
  ) {
    this.branchForm = this.fb.group({
      storeId: ['', Validators.required],
      name: ['', Validators.required],
      code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
      address: [''],
      city: [''],
      state: [''],
      country: ['India'],
      pincode: [''],
      openingTime: ['08:00', Validators.required],
      closingTime: ['22:00', Validators.required],
      logoUrl: [''],
    });
  }

  ngOnInit(): void {
    this.loadBranches();
    this.loadStores();
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

  loadStores(): void {
    this.apiService.getAllStores().subscribe({
      next: (res) => {
        if (res.success) {
          this.stores = res.data;
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
    this.createErrorMessage = '';
    // By default, select standard modules
    this.selectedModuleIds = new Set(this.catalogModules.map(m => m.id));
    this.showCreateModal = true;
  }

  openEditModal(branch: any): void {
    this.isEditMode = true;
    this.editingBranchId = branch.id;
    this.submitted = false;
    this.createErrorMessage = '';

    this.branchForm.patchValue({
      storeId: branch.store_id || '',
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
    this.showCreateModal = true;
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

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.isEditMode = false;
    this.editingBranchId = null;
  }

  toggleModule(id: number): void {
    if (this.selectedModuleIds.has(id)) {
      this.selectedModuleIds.delete(id);
    } else {
      this.selectedModuleIds.add(id);
    }
  }

  isModuleSelected(id: number): boolean {
    return this.selectedModuleIds.has(id);
  }

  selectAllModules(): void {
    this.selectedModuleIds = new Set(this.catalogModules.map(m => m.id));
  }

  deselectAllModules(): void {
    this.selectedModuleIds.clear();
  }

  onSubmitCreate(): void {
    this.submitted = true;
    this.createErrorMessage = '';

    if (this.branchForm.invalid) {
      return;
    }

    this.creating = true;
    const formVal = this.branchForm.value;

    if (this.isEditMode && this.editingBranchId) {
      const editPayload = {
        name: formVal.name,
        code: formVal.code,
        storeId: parseInt(formVal.storeId, 10),
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
          this.creating = false;
          this.closeCreateModal();
          this.loadBranches();
        },
        error: (err) => {
          this.creating = false;
          this.createErrorMessage = err.error?.message || 'Failed to update branch';
        },
      });
    } else {
      const createPayload = {
        ...formVal,
        storeId: parseInt(formVal.storeId, 10),
        moduleIds: Array.from(this.selectedModuleIds),
      };

      this.apiService.createBranch(createPayload).subscribe({
        next: () => {
          this.creating = false;
          this.closeCreateModal();
          this.loadBranches();
        },
        error: (err) => {
          this.creating = false;
          this.createErrorMessage = err.error?.message || 'Failed to create branch';
        },
      });
    }
  }

  openModuleModal(branch: any): void {
    this.selectedBranchForModules = branch;
    this.loadingModules = true;
    this.moduleSuccessMessage = '';
    this.moduleErrorMessage = '';
    this.showModuleModal = true;

    this.apiService.getBranchModules(branch.id).subscribe({
      next: (res) => {
        this.loadingModules = false;
        this.branchModules = res.data || [];
      },
      error: (err) => {
        this.loadingModules = false;
        this.moduleErrorMessage = err.error?.message || 'Failed to load branch modules';
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
    this.moduleErrorMessage = '';
    this.moduleSuccessMessage = '';

    const payload = this.branchModules.map((m) => ({
      moduleId: m.module_id,
      isEnabled: m.is_enabled,
    }));

    this.apiService.updateBranchModules(this.selectedBranchForModules.id, payload).subscribe({
      next: () => {
        this.savingModules = false;
        this.moduleSuccessMessage = 'Branch module access updated successfully!';
        setTimeout(() => {
          this.closeModuleModal();
          this.loadBranches();
        }, 800);
      },
      error: (err) => {
        this.savingModules = false;
        this.moduleErrorMessage = err.error?.message || 'Failed to update branch modules';
      },
    });
  }

  toggleStatus(branch: Branch): void {
    const newStatus = branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.apiService.updateBranchStatus(branch.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          branch.status = newStatus;
        }
      },
    });
  }
}
