import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Store } from '../models/store.model';
import { Branch, ApiResponse } from '../models/auth.model';
import { API_ENDPOINTS } from './service_api';

@Injectable({
  providedIn: 'root',
})
export class StoreContextService {
  private readonly STORAGE_STORE_KEY = 'grocery_pos_context_store_id';
  private readonly STORAGE_BRANCH_KEY = 'grocery_pos_context_branch_id';

  // Signals
  stores = signal<Store[]>([]);
  branches = signal<Branch[]>([]);
  selectedStoreId = signal<number | null>(this.getInitialStoreId());
  selectedBranchId = signal<number | null>(this.getInitialBranchId());
  isLoadingStores = signal<boolean>(false);
  isLoadingBranches = signal<boolean>(false);

  // Computed
  selectedStore = computed(() => {
    const id = this.selectedStoreId();
    if (!id) return null;
    return this.stores().find((s) => s.id === id) || null;
  });

  selectedBranch = computed(() => {
    const id = this.selectedBranchId();
    if (!id) return null;
    return this.branches().find((b) => b.id === id) || null;
  });

  constructor(private http: HttpClient) {}

  private getInitialStoreId(): number | null {
    const raw = localStorage.getItem(this.STORAGE_STORE_KEY);
    return raw ? parseInt(raw, 10) : null;
  }

  private getInitialBranchId(): number | null {
    const raw = localStorage.getItem(this.STORAGE_BRANCH_KEY);
    return raw ? parseInt(raw, 10) : null;
  }

  loadStores(): void {
    this.isLoadingStores.set(true);
    this.http.get<ApiResponse<Store[]>>(API_ENDPOINTS.STORES.BASE).subscribe({
      next: (res) => {
        this.stores.set(res.data || []);
        this.isLoadingStores.set(false);

        // If previously saved store exists, load its branches
        const currentStoreId = this.selectedStoreId();
        if (currentStoreId && this.stores().some((s) => s.id === currentStoreId)) {
          this.loadBranchesForStore(currentStoreId);
        } else if (currentStoreId) {
          this.clearContext();
        }
      },
      error: () => {
        this.isLoadingStores.set(false);
      },
    });
  }

  selectStore(storeId: number | null): void {
    this.selectedStoreId.set(storeId);
    this.selectedBranchId.set(null);
    localStorage.removeItem(this.STORAGE_BRANCH_KEY);

    if (storeId) {
      localStorage.setItem(this.STORAGE_STORE_KEY, storeId.toString());
      this.loadBranchesForStore(storeId);
    } else {
      localStorage.removeItem(this.STORAGE_STORE_KEY);
      this.branches.set([]);
    }
  }

  selectBranch(branchId: number | null): void {
    this.selectedBranchId.set(branchId);
    if (branchId) {
      localStorage.setItem(this.STORAGE_BRANCH_KEY, branchId.toString());
    } else {
      localStorage.removeItem(this.STORAGE_BRANCH_KEY);
    }
  }

  clearContext(): void {
    this.selectedStoreId.set(null);
    this.selectedBranchId.set(null);
    this.branches.set([]);
    localStorage.removeItem(this.STORAGE_STORE_KEY);
    localStorage.removeItem(this.STORAGE_BRANCH_KEY);
  }

  private loadBranchesForStore(storeId: number): void {
    this.isLoadingBranches.set(true);
    const params = new HttpParams().set('storeId', storeId.toString());
    this.http.get<ApiResponse<Branch[]>>(API_ENDPOINTS.BRANCHES.BASE, { params }).subscribe({
      next: (res) => {
        const branches = res.data || [];
        this.branches.set(branches);
        this.isLoadingBranches.set(false);

        // Validate saved branch exists in branches
        const savedBranchId = this.selectedBranchId();
        if (savedBranchId && !branches.some((b) => b.id === savedBranchId)) {
          this.selectBranch(null);
        }
      },
      error: () => {
        this.isLoadingBranches.set(false);
      },
    });
  }
}
