import { Component, OnInit, signal, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ApiService, Product, Category, Supplier } from '../../../../core/services/api.services';
import { StoreContextService } from '../../../../core/services/store-context.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css',
})
export class ProductComponent implements OnInit {
  @ViewChild('coverImageInput') coverImageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('multipleImagesInput') multipleImagesInput!: ElementRef<HTMLInputElement>;

  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  suppliers = signal<Supplier[]>([]);

  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Modal State (Add / Edit / View Item)
  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  isViewOnly = signal<boolean>(false);
  editingProductId = signal<number | null>(null);

  // Supplier & Category Dropdown Search & State
  supplierDropdownOpen = signal<boolean>(false);
  categoryDropdownOpen = signal<boolean>(false);
  supplierSearchTerm = '';
  categorySearchTerm = '';
  selectedSupplierName = signal<string>('');
  selectedCategoryName = signal<string>('');

  // Images state
  coverImagePreview = signal<string>('');
  itemImagesPreview = signal<string[]>([]);

  // Item Types
  itemTypes = ['Veg', 'Non-Veg', 'Eggetarian', 'Soft Drinks', 'Others'];

  // Tax Options
  taxOptions = [
    { label: 'None (0%)', value: 0 },
    { label: 'GST 5%', value: 5 },
    { label: 'GST 12%', value: 12 },
    { label: 'GST 18%', value: 18 },
    { label: 'GST 28%', value: 28 },
  ];

  // Barcode Print Modal State
  isBarcodeModalOpen = signal<boolean>(false);
  selectedProductForBarcode = signal<Product | null>(null);
  barcodeQuantity = 1;
  barcodeCopies = 1;

  // Delete Confirmation State
  isDeleteModalOpen = signal<boolean>(false);
  deletingProduct = signal<Product | null>(null);

  // Search & Pagination
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;

  productForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    public storeContext: StoreContextService
  ) {
    this.productForm = this.fb.group({
      supplierId: [null, [Validators.required]],
      categoryId: [null, [Validators.required]],
      itemName: ['', [Validators.required, Validators.minLength(2)]],
      itemType: ['Veg', [Validators.required]],
      mrp: [null, [Validators.required, Validators.min(0)]],
      msp: [null, [Validators.required, Validators.min(0)]],
      unit: ['pcs', [Validators.required]],
      volume: [{ value: null, disabled: true }],
      isLooseItem: [false],
      description: [''],
      taxRate: [0],
      coverImageUrl: [''],
      itemImages: [[]],
      status: ['ACTIVE'],
      barcode: [''],
    });

    // Toggle volume enabled/disabled based on isLooseItem
    this.productForm.get('isLooseItem')?.valueChanges.subscribe((isLoose) => {
      this.updateVolumeState(!!isLoose);
    });

    // Auto-reload when store or branch context changes
    effect(() => {
      const branchId = this.storeContext.selectedBranchId();
      const storeId = this.storeContext.selectedStoreId();
      this.loadProducts();
      this.loadDropdownData();
    });
  }

  updateVolumeState(isLoose: boolean): void {
    const volumeCtrl = this.productForm.get('volume');
    if (isLoose) {
      volumeCtrl?.enable();
      volumeCtrl?.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      volumeCtrl?.disable();
      volumeCtrl?.clearValidators();
      volumeCtrl?.setValue(null);
    }
    volumeCtrl?.updateValueAndValidity();
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadDropdownData();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const branchId = this.storeContext.selectedBranchId() || undefined;
    const storeId = this.storeContext.selectedStoreId() || undefined;

    this.api.getProducts({ branchId, storeId }).subscribe({
      next: (res) => {
        this.loading.set(false);
        const list = res.data || [];
        this.products.set(list);
        this.applyFilter();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load products');
      },
    });
  }

  loadDropdownData(): void {
    const storeId = this.storeContext.selectedStoreId() || undefined;
    const branchId = this.storeContext.selectedBranchId() || undefined;

    // Load Categories
    this.api.getCategories({ storeId, branchId }).subscribe({
      next: (res) => {
        this.categories.set(res.data || []);
      },
      error: () => {},
    });

    // Load Suppliers
    this.api.getSuppliers({ storeId, branchId }).subscribe({
      next: (res) => {
        this.suppliers.set(res.data || []);
      },
      error: () => {},
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredProducts.set(this.products());
    } else {
      const filtered = this.products().filter((p) =>
        p.item_name.toLowerCase().includes(term) ||
        (p.category_name && p.category_name.toLowerCase().includes(term)) ||
        (p.supplier_name && p.supplier_name.toLowerCase().includes(term)) ||
        (p.barcode && p.barcode.toLowerCase().includes(term)) ||
        (p.item_type && p.item_type.toLowerCase().includes(term))
      );
      this.filteredProducts.set(filtered);
    }
    this.currentPage = 1;
  }

  get paginatedProducts(): Product[] {
    const list = this.filteredProducts();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts().length / this.pageSize) || 1;
  }

  get startEntry(): number {
    if (this.filteredProducts().length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredProducts().length);
  }

  // ==========================================
  // Supplier Selection & Filter
  // ==========================================
  get filteredSuppliers(): Supplier[] {
    const term = this.supplierSearchTerm.toLowerCase().trim();
    if (!term) return this.suppliers();
    return this.suppliers().filter(s =>
      s.supplier_name.toLowerCase().includes(term) ||
      (s.contact_number && s.contact_number.includes(term))
    );
  }

  selectSupplier(supplier: Supplier): void {
    this.productForm.patchValue({ supplierId: supplier.id });
    this.selectedSupplierName.set(supplier.supplier_name);
    this.supplierDropdownOpen.set(false);
  }

  clearSupplier(event: Event): void {
    event.stopPropagation();
    this.productForm.patchValue({ supplierId: null });
    this.selectedSupplierName.set('');
    this.supplierSearchTerm = '';
  }

  toggleSupplierDropdown(): void {
    this.supplierDropdownOpen.set(!this.supplierDropdownOpen());
    if (this.supplierDropdownOpen()) {
      this.categoryDropdownOpen.set(false);
    }
  }

  // ==========================================
  // Category Selection & Filter
  // ==========================================
  get filteredCategories(): Category[] {
    const term = this.categorySearchTerm.toLowerCase().trim();
    if (!term) return this.categories();
    return this.categories().filter(c =>
      c.category_name.toLowerCase().includes(term) ||
      c.group_name.toLowerCase().includes(term)
    );
  }

  selectCategory(category: Category): void {
    this.productForm.patchValue({ categoryId: category.id });
    this.selectedCategoryName.set(category.category_name);
    this.categoryDropdownOpen.set(false);
  }

  clearCategory(event: Event): void {
    event.stopPropagation();
    this.productForm.patchValue({ categoryId: null });
    this.selectedCategoryName.set('');
    this.categorySearchTerm = '';
  }

  toggleCategoryDropdown(): void {
    this.categoryDropdownOpen.set(!this.categoryDropdownOpen());
    if (this.categoryDropdownOpen()) {
      this.supplierDropdownOpen.set(false);
    }
  }

  // ==========================================
  // Item Type Radio/Checkbox Selection
  // ==========================================
  selectItemType(type: string): void {
    this.productForm.patchValue({ itemType: type });
  }

  // ==========================================
  // Cover Image & Multiple Images
  // ==========================================
  triggerCoverImageInput(): void {
    if (this.coverImageInput) this.coverImageInput.nativeElement.click();
  }

  onCoverImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.coverImagePreview.set(base64);
      this.productForm.patchValue({ coverImageUrl: base64 });
    };
    reader.readAsDataURL(file);
  }

  removeCoverImage(event: Event): void {
    event.stopPropagation();
    this.coverImagePreview.set('');
    this.productForm.patchValue({ coverImageUrl: '' });
    if (this.coverImageInput) this.coverImageInput.nativeElement.value = '';
  }

  triggerMultipleImagesInput(): void {
    if (this.multipleImagesInput) this.multipleImagesInput.nativeElement.click();
  }

  onMultipleImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const current = [...this.itemImagesPreview(), base64];
        this.itemImagesPreview.set(current);
        this.productForm.patchValue({ itemImages: current });
      };
      reader.readAsDataURL(file);
    });
  }

  removeItemImage(index: number, event: Event): void {
    event.stopPropagation();
    const updated = this.itemImagesPreview().filter((_, i) => i !== index);
    this.itemImagesPreview.set(updated);
    this.productForm.patchValue({ itemImages: updated });
  }

  // ==========================================
  // Modal Open & Edit
  // ==========================================
  openAddModal(): void {
    this.isEditMode.set(false);
    this.isViewOnly.set(false);
    this.editingProductId.set(null);
    this.errorMessage.set('');
    this.coverImagePreview.set('');
    this.itemImagesPreview.set([]);
    this.selectedSupplierName.set('');
    this.selectedCategoryName.set('');
    this.supplierDropdownOpen.set(false);
    this.categoryDropdownOpen.set(false);

    this.productForm.reset({
      supplierId: null,
      categoryId: null,
      itemName: '',
      itemType: 'Veg',
      mrp: null,
      msp: null,
      unit: '',
      volume: null,
      isLooseItem: false,
      description: '',
      taxRate: 0,
      coverImageUrl: '',
      itemImages: [],
      status: 'ACTIVE',
      barcode: '',
    });

    this.updateVolumeState(false);
    this.loadDropdownData();
    this.isModalOpen.set(true);
  }

  openEditModal(product: Product): void {
    this.isEditMode.set(true);
    this.isViewOnly.set(false);
    this.editingProductId.set(product.id);
    this.errorMessage.set('');
    this.coverImagePreview.set(product.cover_image_url || '');
    this.itemImagesPreview.set(product.item_images || []);
    this.selectedSupplierName.set(product.supplier_name || product.display_supplier_name || '');
    this.selectedCategoryName.set(product.category_name || product.display_category_name || '');
    this.supplierDropdownOpen.set(false);
    this.categoryDropdownOpen.set(false);

    this.productForm.patchValue({
      supplierId: product.supplier_id,
      categoryId: product.category_id,
      itemName: product.item_name,
      itemType: product.item_type || 'Veg',
      mrp: product.mrp,
      msp: product.msp,
      unit: product.unit,
      volume: product.volume || 1,
      isLooseItem: product.is_loose_item,
      description: product.description || '',
      taxRate: product.tax_rate || 0,
      coverImageUrl: product.cover_image_url || '',
      itemImages: product.item_images || [],
      status: product.status || 'ACTIVE',
      barcode: product.barcode || '',
    });

    this.updateVolumeState(!!product.is_loose_item);
    this.loadDropdownData();
    this.isModalOpen.set(true);
  }

  openViewModal(product: Product): void {
    this.openEditModal(product);
    this.isViewOnly.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.isViewOnly.set(false);
    this.errorMessage.set('');
    this.supplierDropdownOpen.set(false);
    this.categoryDropdownOpen.set(false);
  }

  // ==========================================
  // Status Toggle
  // ==========================================
  toggleStatus(product: Product, event: Event): void {
    event.stopPropagation();
    this.api.toggleProductStatus(product.id).subscribe({
      next: (res) => {
        if (res.data) {
          const list = this.products().map(p => p.id === product.id ? { ...p, status: res.data!.status } : p);
          this.products.set(list);
          this.applyFilter();
        }
      },
      error: (err) => {
        this.showError(err.error?.message || 'Failed to update status');
      },
    });
  }

  // ==========================================
  // Barcode Modal & Print Logic (Screenshot 4)
  // ==========================================
  openBarcodeModal(product: Product, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedProductForBarcode.set(product);
    this.barcodeQuantity = Number(product.volume) || 1;
    this.barcodeCopies = 1;
    this.isBarcodeModalOpen.set(true);
  }

  closeBarcodeModal(): void {
    this.isBarcodeModalOpen.set(false);
    this.selectedProductForBarcode.set(null);
  }

  printBarcode(): void {
    const product = this.selectedProductForBarcode();
    if (!product) return;

    const storeName = this.storeContext.selectedStore()?.name || product.store_name || 'GROCERY STORE';
    const itemName = product.item_name.toUpperCase();
    const barcode = product.barcode || '000000000000';
    const volumeUnit = `${this.barcodeQuantity} ${product.unit}`;
    const price = `₹ ${product.msp}`;

    const printWindow = window.open('', '_blank', 'width=450,height=550');
    if (!printWindow) return;

    let labelsHtml = '';
    const copies = Math.max(1, this.barcodeCopies);
    for (let i = 0; i < copies; i++) {
      labelsHtml += `
        <div class="barcode-label">
          <div class="store-title">${storeName}</div>
          <div class="item-title">${itemName}</div>
          <div class="barcode-svg-wrap">
            <svg class="barcode-svg" id="barcode-${i}"></svg>
          </div>
          <div class="barcode-num">${barcode}</div>
          <div class="label-footer">
            <span class="volume">${volumeUnit}</span>
            <span class="price">${price}</span>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${itemName}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            @page { size: auto; margin: 5mm; }
            body { font-family: monospace, sans-serif; margin: 0; padding: 10px; background: white; }
            .barcode-label {
              border: 1px dashed #475569;
              border-radius: 8px;
              padding: 12px;
              width: 260px;
              margin: 10px auto;
              text-align: center;
              page-break-after: always;
            }
            .store-title { font-weight: 700; font-size: 14px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 1px; }
            .item-title { font-weight: 700; font-size: 15px; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
            .barcode-svg-wrap { margin: 6px 0; }
            .barcode-svg { max-width: 100%; height: 50px; }
            .barcode-num { font-size: 13px; font-weight: 600; letter-spacing: 2px; margin-bottom: 6px; }
            .label-footer { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; border-top: 1px solid #e2e8f0; padding-top: 4px; }
            .price { color: #0284c7; }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>
            window.onload = function() {
              for (var j = 0; j < ${copies}; j++) {
                try {
                  JsBarcode("#barcode-" + j, "${barcode}", {
                    format: "CODE128",
                    displayValue: false,
                    height: 40,
                    margin: 0
                  });
                } catch(e) {}
              }
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  downloadBarcodePDF(): void {
    // Triggers print dialog which allows "Save as PDF"
    this.printBarcode();
  }

  // ==========================================
  // Form Submit
  // ==========================================
  onSubmit(): void {
    if (this.isViewOnly()) {
      this.closeModal();
      return;
    }

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const formVal = this.productForm.getRawValue();
    const branchId = this.storeContext.selectedBranchId() || null;
    const storeId = this.storeContext.selectedStoreId() || null;

    const payload = {
      ...formVal,
      supplierName: this.selectedSupplierName(),
      categoryName: this.selectedCategoryName(),
      branchId,
      storeId,
    };

    if (this.isEditMode()) {
      const id = this.editingProductId()!;
      this.api.updateProduct(id, payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.showSuccess('Product updated successfully');
          this.loadProducts();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to update product');
        },
      });
    } else {
      this.api.createProduct(payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.showSuccess('Product created successfully');
          this.loadProducts();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to create product');
        },
      });
    }
  }

  // ==========================================
  // Delete
  // ==========================================
  openDeleteModal(product: Product, event: Event): void {
    event.stopPropagation();
    this.deletingProduct.set(product);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deletingProduct.set(null);
  }

  confirmDelete(): void {
    const product = this.deletingProduct();
    if (!product) return;

    this.api.deleteProduct(product.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.showSuccess('Product deleted successfully');
        this.loadProducts();
      },
      error: (err) => {
        this.showError(err.error?.message || 'Failed to delete product');
        this.closeDeleteModal();
      },
    });
  }

  // Pagination navigation
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
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

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}
