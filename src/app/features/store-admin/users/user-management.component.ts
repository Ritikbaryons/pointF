import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { BranchService } from '../../../core/services/branch.service';
import { PermissionService } from '../../../core/services/permission.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { Role, Branch } from '../../../core/models/auth.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasPermissionDirective],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  availableRoles: Role[] = [];
  availableBranches: Branch[] = [];

  showModal = false;
  userForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RoleService,
    private branchService: BranchService,
    public permissionService: PermissionService,
    public storeContext: StoreContextService
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', Validators.required],
      roleId: ['', Validators.required],
      branchId: [''],
    });

    // Auto-reload when store or branch context changes
    effect(() => {
      const storeId = this.storeContext.selectedStoreId();
      const branchId = this.storeContext.selectedBranchId();
      this.loadUsers();
      this.loadDropdownData();
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadDropdownData();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        if (res.success) {
          this.users = res.data;
        }
      },
    });
  }

  loadDropdownData(): void {
    this.roleService.getAllRoles().subscribe({
      next: (res) => {
        if (res.success) {
          this.availableRoles = res.data;
        }
      },
    });

    this.branchService.getAllBranches().subscribe({
      next: (res) => {
        if (res.success) {
          this.availableBranches = res.data;
        }
      },
    });
  }

  get f() {
    return this.userForm.controls;
  }

  openCreateModal(): void {
    this.userForm.reset({ roleId: '', branchId: '' });
    this.submitted = false;
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.userForm.invalid) {
      return;
    }

    this.loading = true;
    const formVal = this.userForm.value;
    const payload = {
      name: formVal.name,
      email: formVal.email,
      phone: formVal.phone || null,
      password: formVal.password,
      roleId: parseInt(formVal.roleId, 10),
      branchIds: formVal.branchId ? [parseInt(formVal.branchId, 10)] : [],
    };

    this.userService.createUser(payload).subscribe({
      next: () => {
        this.loading = false;
        this.closeModal();
        this.loadUsers();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to create user account';
      },
    });
  }

  toggleUserStatus(user: any): void {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.userService.updateUserStatus(user.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          user.status = newStatus;
        }
      },
    });
  }
}
