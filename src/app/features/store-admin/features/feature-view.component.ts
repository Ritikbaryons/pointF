import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { StoreContextService } from '../../../core/services/store-context.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-feature-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="feature-page">
      <div class="feature-header">
        <div>
          <div class="breadcrumb">
            <span>Branch: {{ storeContext.selectedBranch()?.name || 'Selected Branch' }}</span>
            <span class="sep">/</span>
            <span class="active-crumb">{{ moduleTitle }}</span>
          </div>
          <h2>{{ moduleTitle }}</h2>
          <p class="subtitle">{{ moduleDesc }}</p>
        </div>

        <div class="header-badges">
          <span class="badge badge-active">Branch Module Active</span>
          <span class="code-pill">{{ moduleCode }}</span>
        </div>
      </div>

      <!-- Live API Data & Status Card -->
      <div class="card live-card">
        <div class="card-head">
          <div class="pulse-indicator">
            <span class="pulse-dot"></span>
            <span class="font-bold">Branch API Synchronization</span>
          </div>
          <button (click)="loadFeatureData()" class="btn-refresh" [disabled]="loading()">
            <span>🔄</span> Refresh
          </button>
        </div>

        <div *ngIf="loading()" class="py-8 text-center text-dim">
          <span class="spinner"></span> Loading module data from branch server...
        </div>

        <div *ngIf="errorMessage()" class="alert-box alert-danger">
          <span>⚠️</span> {{ errorMessage() }}
        </div>

        <div *ngIf="!loading() && !errorMessage()" class="api-response-box">
          <div class="meta-row">
            <div class="meta-item">
              <span class="meta-label">Branch ID</span>
              <span class="meta-val">{{ storeContext.selectedBranchId() }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Module Code</span>
              <span class="meta-val">{{ moduleCode }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Authorization</span>
              <span class="meta-val text-success">Verified (Branch Module + Role Perm)</span>
            </div>
          </div>

          <!-- Inventory Display -->
          <div *ngIf="moduleCode === 'INVENTORY' && items().length > 0" class="items-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>SKU</th>
                  <th>Current Stock</th>
                  <th>Unit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of items()">
                  <td class="font-bold">{{ item.name }}</td>
                  <td><span class="code-pill">{{ item.sku }}</span></td>
                  <td><span class="stock-badge">{{ item.stock }}</span></td>
                  <td>{{ item.unit }}</td>
                  <td><span class="badge badge-active">In Stock</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Products Display -->
          <div *ngIf="moduleCode === 'PRODUCTS' && products().length > 0" class="items-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Price</th>
                  <th>Barcode</th>
                  <th>Branch Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let prod of products()">
                  <td class="font-bold">{{ prod.name }}</td>
                  <td>₹{{ prod.price }}</td>
                  <td><span class="code-pill">{{ prod.barcode }}</span></td>
                  <td><span class="badge badge-active">Available</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Customers Display -->
          <div *ngIf="moduleCode === 'CUSTOMERS' && customers().length > 0" class="items-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Loyalty Points</th>
                  <th>Membership</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cust of customers()">
                  <td class="font-bold">{{ cust.name }}</td>
                  <td>{{ cust.phone }}</td>
                  <td><span class="stock-badge">{{ cust.points }} pts</span></td>
                  <td><span class="badge badge-active">Gold</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Generic Module Placeholder -->
          <div *ngIf="!['INVENTORY', 'PRODUCTS', 'CUSTOMERS'].includes(moduleCode)" class="empty-state-card">
            <span class="icon-big">{{ moduleIcon }}</span>
            <h3>{{ moduleTitle }} Module is Online for this Branch</h3>
            <p>Branch-level module access confirmed. Ready for daily operations.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .feature-page {
      padding: 1.5rem;
    }
    .feature-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #94a3b8;
      margin-bottom: 0.25rem;
    }
    .sep { color: #64748b; }
    .active-crumb { color: #38bdf8; font-weight: 600; }
    .subtitle { color: #94a3b8; font-size: 0.95rem; margin-top: 0.2rem; }
    .header-badges { display: flex; gap: 0.5rem; align-items: center; }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.5rem;
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #334155;
    }
    .pulse-indicator { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; color: #f1f5f9; }
    .pulse-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }
    .btn-refresh {
      background: #334155;
      border: 1px solid #475569;
      color: #f8fafc;
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s;
    }
    .btn-refresh:hover { background: #475569; }
    .meta-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
    .meta-val { font-size: 0.95rem; font-weight: 700; color: #f8fafc; }
    .text-success { color: #34d399 !important; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .data-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      background: #0f172a;
      color: #94a3b8;
      font-size: 0.8rem;
      text-transform: uppercase;
      border-bottom: 1px solid #334155;
    }
    .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #334155;
      color: #f1f5f9;
    }
    .code-pill {
      background: #334155;
      color: #38bdf8;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85rem;
    }
    .stock-badge {
      font-weight: 700;
      color: #38bdf8;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-active { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .empty-state-card {
      text-align: center;
      padding: 3rem 1rem;
      color: #94a3b8;
    }
    .icon-big { font-size: 3rem; display: block; margin-bottom: 0.75rem; }
    .alert-box {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    .alert-danger { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; }
  `]
})
export class FeatureViewComponent implements OnInit {
  moduleCode = '';
  moduleTitle = '';
  moduleDesc = '';
  moduleIcon = '📦';

  loading = signal(false);
  errorMessage = signal('');
  items = signal<any[]>([]);
  products = signal<any[]>([]);
  customers = signal<any[]>([]);

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public storeContext: StoreContextService
  ) {
    // When branch changes in topbar, auto-reload data
    effect(() => {
      const branchId = this.storeContext.selectedBranchId();
      if (branchId && this.moduleCode) {
        this.loadFeatureData();
      }
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe((d) => {
      this.moduleCode = d['module'] || 'INVENTORY';
      this.moduleTitle = d['title'] || 'Module View';
      this.moduleDesc = d['desc'] || 'Feature operations';
      this.moduleIcon = d['icon'] || '📦';
      this.loadFeatureData();
    });
  }

  loadFeatureData(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    let endpoint = '';
    if (this.moduleCode === 'INVENTORY') {
      endpoint = `${environment.apiUrl}/inventory`;
    } else if (this.moduleCode === 'POS') {
      endpoint = `${environment.apiUrl}/pos`;
    } else if (this.moduleCode === 'PRODUCTS') {
      endpoint = `${environment.apiUrl}/products`;
    } else if (this.moduleCode === 'CUSTOMERS') {
      endpoint = `${environment.apiUrl}/customers`;
    }

    if (!endpoint) {
      this.loading.set(false);
      return;
    }

    this.http.get<any>(endpoint).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          if (res.data.items) this.items.set(res.data.items);
          if (res.data.products) this.products.set(res.data.products);
          if (res.data.customers) this.customers.set(res.data.customers);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Access denied or error loading module data');
      }
    });
  }
}
