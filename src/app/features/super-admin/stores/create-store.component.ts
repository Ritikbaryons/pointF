import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.services';
import { PermissionService } from '../../../core/services/permission.service';
import { StoreModule } from '../../../core/models/auth.model';
import { Country, City } from '../../../core/models/store.model';

export interface PhoneEntry {
  countryCode: string;
  flag: string;
  number: string;
  isPrimary: boolean;
}

@Component({
  selector: 'app-create-store',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './create-store.component.html',
  styleUrl: './create-store.component.css',
})
export class CreateStoreComponent implements OnInit {
  storeForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';

  // Modules catalog
  availableModules: StoreModule[] = [];
  selectedModuleIds = new Set<number>();

  // Locations
  countries: Country[] = [];
  cities: City[] = [];
  loadingCities = false;

  // Password visibility
  showPassword = false;
  showConfirmPassword = false;

  // Phone numbers
  phoneList: PhoneEntry[] = [
    { countryCode: '+91', flag: '🇮🇳', number: '', isPrimary: true }
  ];

  countryDialCodes = [
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+971', flag: '🇦🇪', name: 'UAE' },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
  ];

  // Document Uploads
  trnCertFileName = '';
  logoFileName = '';
  tradeLicenseFileName = '';
  uploadingTrn = false;
  uploadingLogo = false;
  uploadingLicense = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private permissionService: PermissionService,
    private router: Router
  ) {
    this.storeForm = this.fb.group({
      name: ['', Validators.required],
      registrationNo: ['', Validators.required],
      ownerFirstName: ['', Validators.required],
      ownerMiddleName: [''],
      ownerLastName: [''],
      address: ['', Validators.required],
      countryId: ['', Validators.required],
      cityId: ['', Validators.required],
      poBox: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      resetTime: ['04:00', Validators.required],
      trnNumber: ['', Validators.required],
      trnCertificateUrl: [''],
      logoUrl: [''],
      tradeLicenseUrl: [''],
      agreedTerms: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    this.loadModules();
    this.loadCountries();
  }

  loadModules(): void {
    this.permissionService.getAllStoreModules().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.availableModules = res.data;
          this.availableModules.forEach(m => this.selectedModuleIds.add(m.id));
        }
      },
    });
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

  loadCountries(): void {
    this.apiService.getCountries().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.countries = res.data;
          const india = this.countries.find(c => c.iso_code === 'IN' || c.name === 'India');
          if (india) {
            this.storeForm.patchValue({ countryId: india.id });
            this.onCountryChange(india.id);
          }
        }
      },
      error: (err) => console.error('Error loading countries:', err),
    });
  }

  onCountryChange(countryIdVal: any): void {
    const countryId = parseInt(countryIdVal, 10);
    this.storeForm.patchValue({ cityId: '' });
    this.cities = [];
    if (!countryId) return;

    this.loadingCities = true;
    this.apiService.getCities(countryId).subscribe({
      next: (res) => {
        this.loadingCities = false;
        if (res.success && res.data) {
          this.cities = res.data;
          if (this.cities.length > 0) {
            this.storeForm.patchValue({ cityId: this.cities[0].id });
          }
        }
      },
      error: (err) => {
        this.loadingCities = false;
        console.error('Error loading cities:', err);
      },
    });
  }

  // Phone numbers management
  addPhone(): void {
    this.phoneList.push({
      countryCode: '+91',
      flag: '🇮🇳',
      number: '',
      isPrimary: this.phoneList.length === 0,
    });
  }

  removePhone(index: number): void {
    if (this.phoneList.length > 1) {
      const wasPrimary = this.phoneList[index].isPrimary;
      this.phoneList.splice(index, 1);
      if (wasPrimary && this.phoneList.length > 0) {
        this.phoneList[0].isPrimary = true;
      }
    }
  }

  setPrimaryPhone(index: number): void {
    this.phoneList.forEach((p, i) => (p.isPrimary = i === index));
  }

  onDialCodeChange(index: number, code: string): void {
    const item = this.countryDialCodes.find(c => c.code === code);
    if (item) {
      this.phoneList[index].countryCode = item.code;
      this.phoneList[index].flag = item.flag;
    }
  }

  // Password validation helpers
  get passwordVal(): string {
    return this.storeForm.get('password')?.value || '';
  }

  get hasMinMaxLen(): boolean {
    return this.passwordVal.length >= 6 && this.passwordVal.length <= 16;
  }

  get hasUpperLower(): boolean {
    return /[a-z]/.test(this.passwordVal) && /[A-Z]/.test(this.passwordVal);
  }

  get hasNumber(): boolean {
    return /\d/.test(this.passwordVal);
  }

  get hasSpecialChar(): boolean {
    return /[@$!%*?&^#()_\-+=~`[\]{}|:;"'<>,.\/]/.test(this.passwordVal);
  }

  get isPasswordValid(): boolean {
    return this.hasMinMaxLen && this.hasUpperLower && this.hasNumber && this.hasSpecialChar;
  }

  get passwordsMatch(): boolean {
    const confirm = this.storeForm.get('confirmPassword')?.value;
    if (!confirm) return true;
    return this.passwordVal === confirm;
  }

  get f() {
    return this.storeForm.controls;
  }

  // File Upload Handlers
  onFileSelect(event: any, field: 'trn' | 'logo' | 'license'): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      if (field === 'trn') this.uploadingTrn = true;
      if (field === 'logo') this.uploadingLogo = true;
      if (field === 'license') this.uploadingLicense = true;

      this.apiService.uploadFile(base64Data, file.name, file.type).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            if (field === 'trn') {
              this.uploadingTrn = false;
              this.trnCertFileName = file.name;
              this.storeForm.patchValue({ trnCertificateUrl: res.data.url });
            } else if (field === 'logo') {
              this.uploadingLogo = false;
              this.logoFileName = file.name;
              this.storeForm.patchValue({ logoUrl: res.data.url });
            } else if (field === 'license') {
              this.uploadingLicense = false;
              this.tradeLicenseFileName = file.name;
              this.storeForm.patchValue({ tradeLicenseUrl: res.data.url });
            }
          }
        },
        error: (err) => {
          if (field === 'trn') this.uploadingTrn = false;
          if (field === 'logo') this.uploadingLogo = false;
          if (field === 'license') this.uploadingLicense = false;
          console.error('Upload error:', err);
          alert('Failed to upload file. Please try again.');
        },
      });
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    const validPhones = this.phoneList.filter(p => p.number.trim().length > 0);
    if (validPhones.length === 0) {
      this.errorMessage = 'Please enter at least one valid phone number.';
      return;
    }

    if (!this.isPasswordValid) {
      this.errorMessage = 'Please ensure your password satisfies all security criteria.';
      return;
    }

    if (this.storeForm.get('password')?.value !== this.storeForm.get('confirmPassword')?.value) {
      this.errorMessage = 'Password and Confirm Password do not match.';
      return;
    }

    if (this.storeForm.invalid) {
      this.errorMessage = 'Please complete all required fields correctly.';
      return;
    }

    this.loading = true;
    const formVal = this.storeForm.value;

    const payload = {
      name: formVal.name,
      registrationNo: formVal.registrationNo,
      ownerFirstName: formVal.ownerFirstName,
      ownerMiddleName: formVal.ownerMiddleName || '',
      ownerLastName: formVal.ownerLastName || '',
      address: formVal.address,
      countryId: parseInt(formVal.countryId, 10),
      cityId: parseInt(formVal.cityId, 10),
      poBox: formVal.poBox || '',
      email: formVal.email,
      password: formVal.password,
      resetTime: formVal.resetTime,
      trnNumber: formVal.trnNumber,
      trnCertificateUrl: formVal.trnCertificateUrl || '',
      logoUrl: formVal.logoUrl || '',
      tradeLicenseUrl: formVal.tradeLicenseUrl || '',
      phoneNumbers: validPhones,
      agreedTerms: formVal.agreedTerms,
      moduleIds: Array.from(this.selectedModuleIds),
      owner: {
        firstName: formVal.ownerFirstName,
        middleName: formVal.ownerMiddleName || '',
        lastName: formVal.ownerLastName || '',
        email: formVal.email,
        password: formVal.password,
        phone: `${validPhones[0].countryCode} ${validPhones[0].number}`,
      },
    };

    this.apiService.createStore(payload as any).subscribe({
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
