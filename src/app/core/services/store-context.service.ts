import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Store } from '../models/store.model';
import { Branch, ApiResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';

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
  activeBranchModules = signal<string[]>([]);
  isLoadingStores = signal<boolean>(false);
  isLoadingBranches = signal<boolean>(false);
  isLoadingModules = signal<boolean>(false);

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

  initForStoreUser(userBranches: Branch[]): void {
    this.branches.set(userBranches || []);
    if (!userBranches || userBranches.length === 0) return;

    let branchId = this.selectedBranchId();
    // Validate if saved branch is in user's accessible branches
    if (!branchId || !userBranches.some((b) => b.id === branchId)) {
      branchId = userBranches[0].id;
      this.selectBranch(branchId);
    } else {
      this.loadBranchModules(branchId);
    }
  }

  loadStores(): void {
    this.isLoadingStores.set(true);
    this.http.get<ApiResponse<Store[]>>(`${environment.apiUrl}/stores`).subscribe({
      next: (res) => {
        this.stores.set(res.data || []);
        this.isLoadingStores.set(false);

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
    this.activeBranchModules.set([]);
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
      this.loadBranchModules(branchId);
    } else {
      localStorage.removeItem(this.STORAGE_BRANCH_KEY);
      this.activeBranchModules.set([]);
    }
  }

  private branchModulesCache = new Map<number, string[]>();

  loadBranchModules(branchId: number): void {
    if (this.branchModulesCache.has(branchId)) {
      this.activeBranchModules.set(this.branchModulesCache.get(branchId)!);
      return;
    }

    this.isLoadingModules.set(true);
    this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/branches/${branchId}/modules`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const enabledCodes = res.data
            .filter((m) => m.is_enabled === true)
            .map((m) => m.module_code);
          this.branchModulesCache.set(branchId, enabledCodes);
          this.activeBranchModules.set(enabledCodes);
        }
        this.isLoadingModules.set(false);
      },
      error: () => {
        this.isLoadingModules.set(false);
      },
    });
  }

  hasBranchModule(_moduleCode?: string): boolean {
    return true;
  }

  clearContext(): void {
    this.selectedStoreId.set(null);
    this.selectedBranchId.set(null);
    this.branches.set([]);
    this.activeBranchModules.set([]);
    this.branchModulesCache.clear();
    localStorage.removeItem(this.STORAGE_STORE_KEY);
    localStorage.removeItem(this.STORAGE_BRANCH_KEY);
  }

  private loadBranchesForStore(storeId: number): void {
    this.isLoadingBranches.set(true);
    const params = new HttpParams().set('storeId', storeId.toString());
    this.http.get<ApiResponse<Branch[]>>(`${environment.apiUrl}/branches`, { params }).subscribe({
      next: (res) => {
        const branches = res.data || [];
        this.branches.set(branches);
        this.isLoadingBranches.set(false);

        const savedBranchId = this.selectedBranchId();
        if (savedBranchId && branches.some((b) => b.id === savedBranchId)) {
          this.loadBranchModules(savedBranchId);
        } else if (branches.length > 0) {
          this.selectBranch(branches[0].id);
        } else {
          this.selectBranch(null);
        }
      },
      error: () => {
        this.isLoadingBranches.set(false);
      },
    });
  }
}
