import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../../core/services/store.service';
import { DashboardMetrics } from '../../../core/models/store.model';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrl: './super-admin-dashboard.component.css',
})
export class SuperAdminDashboardComponent implements OnInit {
  metrics: DashboardMetrics | null = null;

  constructor(private storeService: StoreService) {}

  ngOnInit(): void {
    this.storeService.getDashboardMetrics().subscribe({
      next: (res) => {
        if (res.success) {
          this.metrics = res.data;
        }
      },
    });
  }
}
