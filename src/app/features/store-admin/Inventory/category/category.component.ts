import { Component, OnInit, signal, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ApiService, Category } from '../../../../core/services/api.services';
import { StoreContextService } from '../../../../core/services/store-context.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css',
})
export class CategoryComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  categories = signal<Category[]>([]);
  filteredCategories = signal<Category[]>([]);
  existingGroups = signal<string[]>([]);
  
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  uploadingLogo = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Modal State
  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editingCategoryId = signal<number | null>(null);

  // Group Dropdown state
  groupDropdownOpen = signal<boolean>(false);

  // Logo Preview
  logoPreview = signal<string>('');

  // Delete Confirmation State
  isDeleteModalOpen = signal<boolean>(false);
  deletingCategory = signal<Category | null>(null);

  // Search & Pagination
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;

  categoryForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    public storeContext: StoreContextService
  ) {
    this.categoryForm = this.fb.group({
      groupName: ['', [Validators.required]],
      categoryName: ['', [Validators.required, Validators.minLength(2)]],
      categoryCode: [''],
      description: [''],
      logoUrl: [''],
      status: ['ACTIVE'],
    });

    // Auto-reload when branch changes
    effect(() => {
      const branchId = this.storeContext.selectedBranchId();
      this.loadCategories();
      this.loadGroups();
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadGroups();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const branchId = this.storeContext.selectedBranchId() || undefined;
    const storeId = this.storeContext.selectedStoreId() || undefined;

    this.api.getCategories({ branchId, storeId }).subscribe({
      next: (res) => {
        this.loading.set(false);
        const list = res.data || [];
        this.categories.set(list);
        this.applyFilter();
        this.updateGroupList(list);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load categories');
      },
    });
  }

  loadGroups(): void {
    const storeId = this.storeContext.selectedStoreId() || undefined;
    this.api.getCategoryGroups({ storeId }).subscribe({
      next: (res) => {
        if (res.data && Array.isArray(res.data)) {
          const dbGroups = res.data.filter((g: string) => !!g && g.trim().length > 0);
          this.existingGroups.set(dbGroups);
        }
      },
      error: () => {},
    });
  }

  updateGroupList(categories: Category[]): void {
    const groupsFromCategories = categories
      .map(c => c.group_name)
      .filter((g): g is string => !!g && g.trim().length > 0);
    const combined = Array.from(new Set([...this.existingGroups(), ...groupsFromCategories]))
      .filter(g => !!g && g.trim().length > 0)
      .sort((a, b) => a.localeCompare(b));
    this.existingGroups.set(combined);
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredCategories.set(this.categories());
    } else {
      const filtered = this.categories().filter((c) =>
        c.category_name.toLowerCase().includes(term) ||
        (c.category_code && c.category_code.toLowerCase().includes(term)) ||
        c.group_name.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
      );
      this.filteredCategories.set(filtered);
    }
    this.currentPage = 1;
  }

  get paginatedCategories(): Category[] {
    const list = this.filteredCategories();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCategories().length / this.pageSize) || 1;
  }

  get startEntry(): number {
    if (this.filteredCategories().length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredCategories().length);
  }

  // ==========================================
  // Group dropdown + input box auto-select logic
  // Requirement: "ager milk group ban gya taab koi milk same letter kar ke create kare tab v wo auto select ho jaye"
  // ==========================================
  onGroupInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (!value) return;

    const trimmed = value.trim().toLowerCase();
    // Check if any existing group matches case-insensitively
    const match = this.existingGroups().find(
      (g) => g.trim().toLowerCase() === trimmed
    );

    // If matches case-insensitively, auto-select the standard group casing!
    if (match && match !== value) {
      this.categoryForm.patchValue({ groupName: match });
    }
  }

  onGroupBlur(): void {
    setTimeout(() => {
      this.groupDropdownOpen.set(false);
      const current = this.categoryForm.get('groupName')?.value;
      if (current) {
        const trimmed = current.trim().toLowerCase();
        const match = this.existingGroups().find(
          (g) => g.trim().toLowerCase() === trimmed
        );
        if (match) {
          this.categoryForm.patchValue({ groupName: match });
        }
      }
    }, 200);
  }

  selectGroup(group: string): void {
    this.categoryForm.patchValue({ groupName: group });
    this.groupDropdownOpen.set(false);
  }

  toggleGroupDropdown(): void {
    this.groupDropdownOpen.set(!this.groupDropdownOpen());
  }

  get filteredGroupSuggestions(): string[] {
    const val = (this.categoryForm.get('groupName')?.value || '').toLowerCase().trim();
    if (!val) return this.existingGroups();
    return this.existingGroups().filter(g => g.toLowerCase().includes(val));
  }

  // ==========================================
  // Logo Upload
  // ==========================================
  triggerFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.logoPreview.set(base64);
      this.categoryForm.patchValue({ logoUrl: base64 });

      // Attempt upload to backend static uploads
      this.uploadingLogo.set(true);
      this.api.uploadFile(base64, file.name, file.type).subscribe({
        next: (res) => {
          this.uploadingLogo.set(false);
          if (res.data?.url) {
            this.categoryForm.patchValue({ logoUrl: res.data.url });
          }
        },
        error: () => {
          this.uploadingLogo.set(false);
          // Fallback to base64 preview
        }
      });
    };
    reader.readAsDataURL(file);
  }

  removeLogo(event: Event): void {
    event.stopPropagation();
    this.logoPreview.set('');
    this.categoryForm.patchValue({ logoUrl: '' });
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // ==========================================
  // Modal Open/Close & Submit
  // ==========================================
  openAddModal(): void {
    this.isEditMode.set(false);
    this.editingCategoryId.set(null);
    this.errorMessage.set('');
    this.logoPreview.set('');
    this.groupDropdownOpen.set(false);
    this.categoryForm.reset({
      groupName: '',
      categoryName: '',
      categoryCode: '',
      description: '',
      logoUrl: '',
      status: 'ACTIVE',
    });
    this.loadGroups();
    this.isModalOpen.set(true);
  }

  openEditModal(category: Category): void {
    this.isEditMode.set(true);
    this.editingCategoryId.set(category.id);
    this.errorMessage.set('');
    this.logoPreview.set(category.logo_url || '');
    this.groupDropdownOpen.set(false);
    this.categoryForm.patchValue({
      groupName: category.group_name,
      categoryName: category.category_name,
      categoryCode: category.category_code || '',
      description: category.description || '',
      logoUrl: category.logo_url || '',
      status: category.status || 'ACTIVE',
    });
    this.loadGroups();
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.errorMessage.set('');
    this.groupDropdownOpen.set(false);
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const formVal = this.categoryForm.value;
    const branchId = this.storeContext.selectedBranchId() || null;
    const storeId = this.storeContext.selectedStoreId() || null;

    if (this.isEditMode()) {
      const id = this.editingCategoryId()!;
      this.api.updateCategory(id, {
        groupName: formVal.groupName,
        categoryName: formVal.categoryName,
        categoryCode: formVal.categoryCode,
        logoUrl: formVal.logoUrl,
        description: formVal.description,
      }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.showSuccess('Category updated successfully');
          this.loadCategories();
          this.loadGroups();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to update category');
        },
      });
    } else {
      this.api.createCategory({
        groupName: formVal.groupName,
        categoryName: formVal.categoryName,
        categoryCode: formVal.categoryCode,
        logoUrl: formVal.logoUrl,
        description: formVal.description,
        branchId,
        storeId,
      }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.showSuccess('Category created successfully');
          this.loadCategories();
          this.loadGroups();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to create category');
        },
      });
    }
  }

  // ==========================================
  // Delete
  // ==========================================
  openDeleteModal(category: Category): void {
    this.deletingCategory.set(category);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deletingCategory.set(null);
  }

  confirmDelete(): void {
    const cat = this.deletingCategory();
    if (!cat) return;

    this.submitting.set(true);
    this.api.deleteCategory(cat.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeDeleteModal();
        this.showSuccess(`Category "${cat.category_name}" deleted successfully`);
        this.loadCategories();
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to delete category');
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
