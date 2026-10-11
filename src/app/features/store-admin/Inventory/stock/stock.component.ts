import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ApiService, Stock, Product, Category } from '../../../../core/services/api.services';
import { StoreContextService } from '../../../../core/services/store-context.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css',
})
export class StockComponent implements OnInit {
  stocks = signal<Stock[]>([]);
  filteredStocks = signal<Stock[]>([]);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);

  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  resetting = signal<boolean>(false);
  importing = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Top Category Filter State
  selectedCategory = 'all';

  // Modals
  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editingStockId = signal<number | null>(null);

  isDeleteModalOpen = signal<boolean>(false);
  deletingStock = signal<Stock | null>(null);

  isResetModalOpen = signal<boolean>(false);
  isImportModalOpen = signal<boolean>(false);

  // Import State
  isDragging = signal<boolean>(false);
  selectedFile = signal<File | null>(null);
  parsedImportItems: any[] = [];
  parsedCount = signal<number>(0);
  importError = signal<string>('');

  // Product Dropdown State & Auto-fill Signals
  productDropdownOpen = signal<boolean>(false);
  productSearchTerm = '';
  selectedProduct = signal<Product | null>(null);

  // Search & Pagination
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;

  stockForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    public storeContext: StoreContextService
  ) {
    this.stockForm = this.fb.group({
      productId: [null, [Validators.required]],
      categoryName: [{ value: '', disabled: true }],
      supplierName: [{ value: '', disabled: true }],
      price: [{ value: 0, disabled: true }],
      quantity: [null, [Validators.required, Validators.min(0)]],
      actualQuantity: [null, [Validators.required, Validators.min(0)]],
      criticalQuantity: [null, [Validators.min(0)]],
      orderQuantity: [null, [Validators.min(0)]],
      unit: [{ value: '', disabled: true }],
    });

    // Auto-reload when store or branch context changes
    effect(() => {
      const branchId = this.storeContext.selectedBranchId();
      const storeId = this.storeContext.selectedStoreId();
      this.loadStocks();
      this.loadProductsList();
      this.loadCategoriesList();
    });
  }

  ngOnInit(): void {
    this.loadStocks();
    this.loadProductsList();
    this.loadCategoriesList();
  }

  loadStocks(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const branchId = this.storeContext.selectedBranchId() || undefined;
    const storeId = this.storeContext.selectedStoreId() || undefined;

    this.api.getStocks({ branchId, storeId }).subscribe({
      next: (res) => {
        this.loading.set(false);
        const list = res.data || [];
        this.stocks.set(list);
        this.applyFilter();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load stock records');
      },
    });
  }

  loadProductsList(): void {
    const storeId = this.storeContext.selectedStoreId() || undefined;
    const branchId = this.storeContext.selectedBranchId() || undefined;

    this.api.getProducts({ storeId, branchId }).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
      },
      error: () => {},
    });
  }

  loadCategoriesList(): void {
    const storeId = this.storeContext.selectedStoreId() || undefined;
    const branchId = this.storeContext.selectedBranchId() || undefined;

    this.api.getCategories({ storeId, branchId }).subscribe({
      next: (res) => {
        this.categories.set(res.data || []);
      },
      error: () => {},
    });
  }

  refreshStockData(): void {
    this.selectedCategory = 'all';
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadStocks();
    this.loadCategoriesList();
    this.loadProductsList();
    this.showSuccess('Stock data refreshed');
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const cat = this.selectedCategory;

    let filtered = this.stocks();

    // Category filter
    if (cat !== 'all') {
      filtered = filtered.filter((s) => {
        if (!s.category_name) return false;
        return (
          String(s.category_id) === String(cat) ||
          s.category_name.toLowerCase() === cat.toLowerCase()
        );
      });
    }

    // Text search filter
    if (term) {
      filtered = filtered.filter(
        (s) =>
          s.product_name.toLowerCase().includes(term) ||
          (s.category_name && s.category_name.toLowerCase().includes(term)) ||
          (s.supplier_name && s.supplier_name.toLowerCase().includes(term)) ||
          (s.product_barcode && s.product_barcode.toLowerCase().includes(term))
      );
    }

    this.filteredStocks.set(filtered);
    this.currentPage = 1;
  }

  get paginatedStocks(): Stock[] {
    const list = this.filteredStocks();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStocks().length / this.pageSize) || 1;
  }

  get startEntry(): number {
    if (this.filteredStocks().length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredStocks().length);
  }

  // ==========================================
  // 1. RESET STOCK WORKFLOW (Screenshot 2)
  // ==========================================
  openResetModal(): void {
    this.isResetModalOpen.set(true);
  }

  closeResetModal(): void {
    this.isResetModalOpen.set(false);
  }

  confirmResetStock(): void {
    this.resetting.set(true);
    const storeId = this.storeContext.selectedStoreId() || undefined;
    const branchId = this.storeContext.selectedBranchId() || undefined;

    this.api.resetStocks({ storeId, branchId }).subscribe({
      next: (res) => {
        this.resetting.set(false);
        this.closeResetModal();
        this.showSuccess('All stock records have been reset successfully');
        this.loadStocks();
      },
      error: (err) => {
        this.resetting.set(false);
        this.showError(err.error?.message || 'Failed to reset stocks');
      },
    });
  }

  // ==========================================
  // 2. EXPORT STOCK WORKFLOW (Screenshot 4)
  // Columns: SrNo, stockId, productName, unit, quantity, actualQuantity, criticalQuantity, orderQuantity
  // ==========================================
  exportStockData(): void {
    const list = this.filteredStocks();
    if (!list || list.length === 0) {
      this.showError('No stock records available to export');
      return;
    }

    // CSV UTF-8 BOM so Excel opens with proper encoding
    let csv = '\uFEFFSrNo,stockId,productName,unit,quantity,actualQuantity,criticalQuantity,orderQuantity\r\n';

    list.forEach((s, idx) => {
      const srNo = idx + 1;
      const stockId = s.id;
      const productName = `"${(s.product_name || '').replace(/"/g, '""')}"`;
      const unit = s.unit || 'pcs';
      const quantity = s.quantity ?? 0;
      const actualQuantity = s.actual_quantity ?? s.quantity ?? 0;
      const criticalQuantity = s.critical_quantity ?? 0;
      const orderQuantity = s.order_quantity ?? 0;

      csv += `${srNo},${stockId},${productName},${unit},${quantity},${actualQuantity},${criticalQuantity},${orderQuantity}\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
    link.setAttribute('download', `inventory_report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showSuccess(`Exported ${list.length} stock items to CSV successfully`);
  }

  // ==========================================
  // 3. IMPORT STOCK WORKFLOW (Screenshot 3)
  // ==========================================
  openImportModal(): void {
    this.selectedFile.set(null);
    this.parsedImportItems = [];
    this.parsedCount.set(0);
    this.importError.set('');
    this.isImportModalOpen.set(true);
  }

  closeImportModal(): void {
    this.isImportModalOpen.set(false);
    this.selectedFile.set(null);
    this.parsedImportItems = [];
    this.parsedCount.set(0);
    this.importError.set('');
  }

  downloadExcelTemplate(): void {
    const template =
      '\uFEFFSrNo,stockId,productName,unit,quantity,actualQuantity,criticalQuantity,orderQuantity\r\n' +
      '1,,Plain Daal,L,98,98,100,100\r\n' +
      '2,,Basmati Rice,kg,50,50,10,20\r\n';

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stock_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.handleIncomingFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleIncomingFile(file);
    }
  }

  handleIncomingFile(file: File): void {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      this.importError.set('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    this.selectedFile.set(file);
    this.importError.set('');

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const text = e.target.result as string;
        this.parseCsvContent(text);
      } catch (err: any) {
        this.importError.set('Failed to read file content: ' + (err.message || 'Invalid format'));
      }
    };
    reader.onerror = () => {
      this.importError.set('Error reading uploaded file');
    };
    reader.readAsText(file);
  }

  parseCsvContent(content: string): void {
    const rawLines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (rawLines.length < 2) {
      this.importError.set('File is empty or contains no data rows');
      this.parsedImportItems = [];
      this.parsedCount.set(0);
      return;
    }

    // Split headers
    const headerLine = rawLines[0].replace(/^\uFEFF/, '');
    const headers = this.splitCsvRow(headerLine).map((h) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));

    const items: any[] = [];

    for (let i = 1; i < rawLines.length; i++) {
      const values = this.splitCsvRow(rawLines[i]);
      if (values.length === 0 || values.every((v) => !v.trim())) continue;

      const rowObj: any = {};
      headers.forEach((h, colIdx) => {
        rowObj[h] = values[colIdx] ? values[colIdx].trim() : '';
      });

      const productName = rowObj['productname'] || rowObj['itemname'] || rowObj['name'] || '';
      const stockId = rowObj['stockid'] || rowObj['id'] || null;

      if (!productName && !stockId) continue;

      items.push({
        stockId: stockId ? Number(stockId) : null,
        productName: productName,
        unit: rowObj['unit'] || 'pcs',
        quantity: Number(rowObj['quantity'] || rowObj['qty'] || 0) || 0,
        actualQuantity: Number(
          rowObj['actualquantity'] !== undefined && rowObj['actualquantity'] !== ''
            ? rowObj['actualquantity']
            : (rowObj['quantity'] || 0)
        ) || 0,
        criticalQuantity: Number(rowObj['criticalquantity'] || rowObj['criticalqty'] || 0) || 0,
        orderQuantity: Number(rowObj['orderquantity'] || rowObj['orderqty'] || 0) || 0,
      });
    }

    if (items.length === 0) {
      this.importError.set('No valid stock items found in file. Ensure headers match the template.');
      this.parsedImportItems = [];
      this.parsedCount.set(0);
    } else {
      this.parsedImportItems = items;
      this.parsedCount.set(items.length);
      this.importError.set('');
    }
  }

  splitCsvRow(row: string): string[] {
    const result: string[] = [];
    let insideQuotes = false;
    let entry = '';

    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') {
        if (insideQuotes && row[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (c === ',' && !insideQuotes) {
        result.push(entry);
        entry = '';
      } else {
        entry += c;
      }
    }
    result.push(entry);
    return result;
  }

  removeSelectedFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.parsedImportItems = [];
    this.parsedCount.set(0);
    this.importError.set('');
  }

  executeImport(): void {
    if (!this.selectedFile()) {
      this.importError.set('Please select or drag a CSV/Excel file to import');
      return;
    }

    if (this.parsedImportItems.length === 0) {
      this.importError.set('No items parsed from the file. Please check file format.');
      return;
    }

    this.importing.set(true);
    this.importError.set('');

    const storeId = this.storeContext.selectedStoreId() || undefined;
    const branchId = this.storeContext.selectedBranchId() || undefined;

    this.api.importStocks(this.parsedImportItems, { storeId, branchId }).subscribe({
      next: (res) => {
        this.importing.set(false);
        this.closeImportModal();
        const details = res.data ? ` (${res.data.inserted} added, ${res.data.updated} updated)` : '';
        this.showSuccess(`Stock items imported successfully${details}`);
        this.loadStocks();
      },
      error: (err) => {
        this.importing.set(false);
        this.importError.set(err.error?.message || 'Failed to import stock records');
      },
    });
  }

  // ==========================================
  // Status Toggle
  // ==========================================
  toggleStockStatus(stock: Stock, event: Event): void {
    event.stopPropagation();
    const newStatus = stock.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const oldStatus = stock.status;
    stock.status = newStatus;

    this.api.updateStockStatus(stock.id, newStatus).subscribe({
      next: () => {
        this.showSuccess(`Stock status updated to ${newStatus}`);
      },
      error: (err) => {
        stock.status = oldStatus;
        this.showError(err.error?.message || 'Failed to update status');
      },
    });
  }

  // ==========================================
  // Product Dropdown & Auto-fill
  // ==========================================
  get filteredProductsList(): Product[] {
    const term = this.productSearchTerm.toLowerCase().trim();
    if (!term) return this.products();
    return this.products().filter(
      (p) =>
        p.item_name.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.includes(term))
    );
  }

  selectProduct(prod: Product): void {
    this.selectedProduct.set(prod);
    this.stockForm.patchValue({
      productId: prod.id,
      categoryName: prod.category_name || prod.display_category_name || '',
      supplierName: prod.supplier_name || prod.display_supplier_name || '',
      price: prod.msp || 0,
      unit: prod.unit || 'pcs',
    });
    this.productDropdownOpen.set(false);
  }

  clearProduct(event: Event): void {
    event.stopPropagation();
    this.selectedProduct.set(null);
    this.stockForm.patchValue({
      productId: null,
      categoryName: '',
      supplierName: '',
      price: 0,
      unit: '',
    });
    this.productSearchTerm = '';
  }

  toggleProductDropdown(): void {
    this.productDropdownOpen.set(!this.productDropdownOpen());
  }

  // ==========================================
  // Modal Actions (Add / Edit In Stock)
  // ==========================================
  openAddModal(): void {
    this.isEditMode.set(false);
    this.editingStockId.set(null);
    this.errorMessage.set('');
    this.selectedProduct.set(null);
    this.productDropdownOpen.set(false);
    this.productSearchTerm = '';

    this.stockForm.reset({
      productId: null,
      categoryName: '',
      supplierName: '',
      price: 0,
      quantity: null,
      actualQuantity: null,
      criticalQuantity: null,
      orderQuantity: null,
      unit: '',
    });

    this.loadProductsList();
    this.isModalOpen.set(true);
  }

  openEditModal(stock: Stock): void {
    this.isEditMode.set(true);
    this.editingStockId.set(stock.id);
    this.errorMessage.set('');
    this.productDropdownOpen.set(false);

    const prod = this.products().find((p) => p.id === stock.product_id) || null;
    this.selectedProduct.set(prod);

    this.stockForm.patchValue({
      productId: stock.product_id,
      categoryName: stock.category_name || '',
      supplierName: stock.supplier_name || '',
      price: stock.price || 0,
      quantity: stock.quantity,
      actualQuantity: stock.actual_quantity,
      criticalQuantity: stock.critical_quantity,
      orderQuantity: stock.order_quantity,
      unit: stock.unit || '',
    });

    this.loadProductsList();
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.errorMessage.set('');
    this.productDropdownOpen.set(false);
  }

  onSubmit(): void {
    if (this.stockForm.invalid) {
      this.stockForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const formVal = this.stockForm.getRawValue();
    const branchId = this.storeContext.selectedBranchId() || null;
    const storeId = this.storeContext.selectedStoreId() || null;

    const payload = {
      productId: formVal.productId,
      quantity: Number(formVal.quantity) || 0,
      actualQuantity: Number(formVal.actualQuantity !== null ? formVal.actualQuantity : formVal.quantity) || 0,
      criticalQuantity: Number(formVal.criticalQuantity) || 0,
      orderQuantity: Number(formVal.orderQuantity) || 0,
      price: Number(formVal.price) || 0,
      unit: formVal.unit || 'pcs',
      branchId,
      storeId,
    };

    if (this.isEditMode()) {
      const id = this.editingStockId()!;
      this.api.updateStock(id, payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.showSuccess('Stock master updated successfully');
          this.loadStocks();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to update stock');
        },
      });
    } else {
      this.api.createStock(payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.showSuccess('Stock master added successfully');
          this.loadStocks();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to add stock master');
        },
      });
    }
  }

  // ==========================================
  // Delete Modal
  // ==========================================
  openDeleteModal(stock: Stock, event: Event): void {
    event.stopPropagation();
    this.deletingStock.set(stock);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deletingStock.set(null);
  }

  confirmDelete(): void {
    const stock = this.deletingStock();
    if (!stock) return;

    this.api.deleteStock(stock.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.showSuccess('Stock record removed');
        this.loadStocks();
      },
      error: (err) => {
        this.showError(err.error?.message || 'Failed to delete stock');
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
