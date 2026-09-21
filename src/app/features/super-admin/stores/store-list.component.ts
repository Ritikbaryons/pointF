import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../../core/services/store.service';
import { Store } from '../../../core/models/store.model';
import { StoreModule } from '../../../core/models/auth.model';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './store-list.component.html',
  styleUrl: './store-list.component.css',
})
export class StoreListComponent implements OnInit {
  stores: Store[] = [];
  selectedStoreForModules: Store | null = null;
  currentStoreModules: StoreModule[] = [];
  savingModules = false;

  constructor(private storeService: StoreService) {}

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.storeService.getAllStores().subscribe({
      next: (res) => {
        if (res.success) {
          this.stores = res.data;
        }
      },
    });
  }

  toggleStoreStatus(store: Store): void {
    const newStatus = store.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.storeService.updateStoreStatus(store.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          store.status = newStatus;
        }
      },
    });
  }

  openModulesModal(store: Store): void {
    this.selectedStoreForModules = store;
    this.storeService.getStoreModules(store.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.currentStoreModules = res.data;
        }
      },
    });
  }

  closeModulesModal(): void {
    this.selectedStoreForModules = null;
    this.currentStoreModules = [];
  }

  saveModules(): void {
    if (!this.selectedStoreForModules) return;

    this.savingModules = true;
    const payload = this.currentStoreModules.map((m) => ({
      moduleId: m.module_id || m.id,
      isEnabled: !!m.is_enabled,
    }));

    this.storeService.updateStoreModules(this.selectedStoreForModules.id, payload).subscribe({
      next: () => {
        this.savingModules = false;
        this.closeModulesModal();
      },
      error: () => {
        this.savingModules = false;
      },
    });
  }
}
