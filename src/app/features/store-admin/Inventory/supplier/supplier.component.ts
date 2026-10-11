import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ApiService, Supplier } from '../../../../core/services/api.services';
import { StoreContextService } from '../../../../core/services/store-context.service';

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.css',
})
export class SupplierComponent implements OnInit {
  suppliers = signal<Supplier[]>([]);
  filteredSuppliers = signal<Supplier[]>([]);
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Modal State
  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editingSupplierId = signal<number | null>(null);

  // Delete Confirmation State
  isDeleteModalOpen = signal<boolean>(false);
  deletingSupplier = signal<Supplier | null>(null);

  // Search & Pagination
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;

  supplierForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    public storeContext: StoreContextService,
    private datePipe: DatePipe
  ) {
    this.supplierForm = this.fb.group({
      supplierName: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required]],
      contactNumber: ['', [Validators.required, Validators.pattern('^[0-9+\\-\\s()]{6,20}$')]],
      supplierType: ['Offline', [Validators.required]],
    });

    // Auto-reload when branch changes
    effect(() => {
      const branchId = this.storeContext.selectedBranchId();
      this.loadSuppliers();
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const branchId = this.storeContext.selectedBranchId() || undefined;
    const storeId = this.storeContext.selectedStoreId() || undefined;

    this.api.getSuppliers({ branchId, storeId }).subscribe({
      next: (res) => {
        this.loading.set(false);
        const data = res.data || [];
        this.suppliers.set(data);
        this.applyFilter();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load suppliers');
      },
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredSuppliers.set(this.suppliers());
    } else {
      const filtered = this.suppliers().filter((s) =>
        s.supplier_name.toLowerCase().includes(term) ||
        s.contact_number.toLowerCase().includes(term) ||
        s.address.toLowerCase().includes(term) ||
        (s.supplier_type && s.supplier_type.toLowerCase().includes(term))
      );
      this.filteredSuppliers.set(filtered);
    }
    this.currentPage = 1;
  }

  get paginatedSuppliers(): Supplier[] {
    const list = this.filteredSuppliers();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSuppliers().length / this.pageSize) || 1;
  }

  get startEntry(): number {
    if (this.filteredSuppliers().length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredSuppliers().length);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return this.datePipe.transform(dateStr, 'dd/MM/yyyy') || dateStr;
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.editingSupplierId.set(null);
    this.errorMessage.set('');
    this.supplierForm.reset({
      supplierName: '',
      address: '',
      contactNumber: '',
      supplierType: 'Offline',
    });
    this.isModalOpen.set(true);
  }

  openEditModal(supplier: Supplier): void {
    this.isEditMode.set(true);
    this.editingSupplierId.set(supplier.id);
    this.errorMessage.set('');
    this.supplierForm.patchValue({
      supplierName: supplier.supplier_name,
      address: supplier.address,
      contactNumber: supplier.contact_number,
      supplierType: supplier.supplier_type || 'Offline',
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.errorMessage.set('');
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const formVal = this.supplierForm.value;
    const branchId = this.storeContext.selectedBranchId() || null;
    const storeId = this.storeContext.selectedStoreId() || null;

    if (this.isEditMode()) {
      const id = this.editingSupplierId()!;
      this.api.updateSupplier(id, {
        supplierName: formVal.supplierName,
        address: formVal.address,
        contactNumber: formVal.contactNumber,
        supplierType: formVal.supplierType,
      }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.showSuccess('Supplier updated successfully');
          this.loadSuppliers();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to update supplier');
        },
      });
    } else {
      this.api.createSupplier({
        supplierName: formVal.supplierName,
        address: formVal.address,
        contactNumber: formVal.contactNumber,
        supplierType: formVal.supplierType,
        branchId,
        storeId,
      }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.showSuccess('Supplier created successfully');
          this.loadSuppliers();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to create supplier');
        },
      });
    }
  }

  openDeleteModal(supplier: Supplier): void {
    this.deletingSupplier.set(supplier);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deletingSupplier.set(null);
  }

  confirmDelete(): void {
    const supplier = this.deletingSupplier();
    if (!supplier) return;

    this.submitting.set(true);
    this.api.deleteSupplier(supplier.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeDeleteModal();
        this.showSuccess(`Supplier "${supplier.supplier_name}" deleted successfully`);
        this.loadSuppliers();
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to delete supplier');
      },
    });
  }

  showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => {
      this.successMessage.set('');
    }, 4000);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }
}
