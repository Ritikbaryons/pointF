import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { StoreContextService } from '../../core/services/store-context.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent implements OnInit {
  constructor(
    public authService: AuthService,
    public permissionService: PermissionService,
    public storeContext: StoreContextService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isSuperAdmin()) {
      this.storeContext.loadStores();
    }
  }

  get userInitials(): string {
    const name = this.authService.currentUser()?.name || 'User';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  get primaryRole(): string {
    if (this.authService.isSuperAdmin()) return 'Super Admin';
    const roles = this.authService.userRoles();
    return roles.length > 0 ? roles[0].name : 'Staff';
  }

  onStoreChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value ? parseInt(select.value, 10) : null;
    this.storeContext.selectStore(value);
  }

  onBranchChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value ? parseInt(select.value, 10) : null;
    this.storeContext.selectBranch(value);
  }

  clearContext(): void {
    this.storeContext.clearContext();
  }

  logout(): void {
    this.storeContext.clearContext();
    this.authService.logout();
  }
}
