import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../../../core/services/store.service';
import { PermissionService } from '../../../core/services/permission.service';
import { StoreModule } from '../../../core/models/auth.model';

@Component({
  selector: 'app-create-store',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-store.component.html',
  styleUrl: './create-store.component.css',
})
export class CreateStoreComponent implements OnInit {
  storeForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';
  availableModules: StoreModule[] = [];
  selectedModuleIds = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private storeService: StoreService,
    private permissionService: PermissionService,
    private router: Router
  ) {
    this.storeForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
      email: ['', Validators.email],
      phone: [''],
      address: [''],
      city: [''],
      state: [''],
      country: ['India'],
      pincode: [''],
      owner: this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: [''],
        password: ['', Validators.required],
      }),
    });
  }

  ngOnInit(): void {
    this.permissionService.getAllStoreModules().subscribe({
      next: (res) => {
        if (res.success) {
          this.availableModules = res.data;
          this.availableModules.forEach(m => this.selectedModuleIds.add(m.id));
        }
      },
    });
  }

  get f() {
    return this.storeForm.controls;
  }

  get ownerControls() {
    return (this.storeForm.get('owner') as FormGroup).controls;
  }

  isModuleSelected(id: number): boolean {
    return this.selectedModuleIds.has(id);
  }

  onModuleToggle(id: number, event: any): void {
    if (event.target.checked) {
      this.selectedModuleIds.add(id);
    } else {
      this.selectedModuleIds.delete(id);
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.storeForm.invalid) {
      return;
    }

    this.loading = true;
    const formVal = this.storeForm.value;
    const payload = {
      ...formVal,
      moduleIds: Array.from(this.selectedModuleIds),
    };

    this.storeService.createStore(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/stores']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to create store. Please verify input.';
      },
    });
  }
}
