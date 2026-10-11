import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService, CreateUserPayload } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { Role, Branch } from '../../../core/models/auth.model';
import { Store } from '../../../core/models/store.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

export interface PhoneEntry {
  countryCode: string;
  flag: string;
  number: string;
  isPrimary: boolean;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HasPermissionDirective],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  availableRoles: Role[] = [];
  availableBranches: Branch[] = [];

  // Create / Edit User Modal State
  showModal = false;
  isEditMode = false;
  editingUserId: number | null = null;
  userForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';

  // Password Visibility & Checklist
  showPassword = false;
  showConfirmPassword = false;

  // Phone Numbers
  phoneList: PhoneEntry[] = [
    { countryCode: '+91', flag: '🇮🇳', number: '', isPrimary: true }
  ];

  dialCodes = [
    { code: '+91', flag: '🇮🇳', label: '+91 (India)' },
    { code: '+1', flag: '🇺🇸', label: '+1 (USA/Canada)' },
    { code: '+44', flag: '🇬🇧', label: '+44 (UK)' },
    { code: '+971', flag: '🇦🇪', label: '+971 (UAE)' },
    { code: '+65', flag: '🇸🇬', label: '+65 (Singapore)' },
    { code: '+61', flag: '🇦🇺', label: '+61 (Australia)' },
    { code: '+49', flag: '🇩🇪', label: '+49 (Germany)' },
    { code: '+33', flag: '🇫🇷', label: '+33 (France)' },
    { code: '+81', flag: '🇯🇵', label: '+81 (Japan)' },
    { code: '+880', flag: '🇧🇩', label: '+880 (Bangladesh)' },
    { code: '+977', flag: '🇳🇵', label: '+977 (Nepal)' },
  ];

  // Master Data for Locations
  countries: any[] = [];
  cities: any[] = [];
  loadingCities = false;

  // Shift timings
  shiftOptions = [
    'Morning Shift (09:00 AM - 05:00 PM)',
    'Evening Shift (01:00 PM - 09:00 PM)',
    'Night Shift (09:00 PM - 05:00 AM)',
    'Full Day / General (10:00 AM - 07:00 PM)',
    'Flexible Hours',
  ];

  // Off Days
  daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  offDaysState: { [key: string]: boolean } = {
    Sunday: false,
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
  };

  // Photo Upload
  photoPreview: string | null = null;
  uploadingPhoto = false;

  // Link Branch Modal State
  showLinkModal = false;
  selectedUserForLink: any = null;
  linkStoreId: number | null = null;
  linkStoreName = '';
  linkRoleId: number | null = null;
  linkStoreBranches: Branch[] = [];
  selectedLinkBranchIds = new Set<number>();
  allStores: Store[] = [];
  savingLink = false;
  linkErrorMessage = '';
  linkSuccessMessage = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public authService: AuthService,
    public permissionService: PermissionService,
    public storeContext: StoreContextService
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(16)]],
      confirmPassword: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      joiningDate: [''],
      address: ['', Validators.required],
      countryId: ['', Validators.required],
      cityId: ['', Validators.required],
      roleId: ['', Validators.required],
      voidPassword: [''],
      photoUrl: [''],
      idCardNo: [''],
      shiftTiming: ['', Validators.required],
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
    this.loadCountries();
    if (this.authService.isSuperAdmin()) {
      this.apiService.getAllStores().subscribe((res) => {
        if (res.success) {
          this.allStores = res.data;
        }
      });
    }
  }

  loadUsers(): void {
    this.apiService.getAllUsers().subscribe({
      next: (res) => {
        if (res.success) {
          this.users = res.data;
        }
      },
    });
  }

  loadDropdownData(): void {
    this.apiService.getAllRoles().subscribe({
      next: (res) => {
        if (res.success) {
          this.availableRoles = res.data;
        }
      },
    });

    this.apiService.getAllBranches().subscribe({
      next: (res) => {
        if (res.success) {
          this.availableBranches = res.data;
        }
      },
    });
  }

  loadCountries(): void {
    this.apiService.getCountries().subscribe({
      next: (res) => {
        if (res.success && res.data.length > 0) {
          this.countries = res.data;
        } else {
          this.countries = [
            { id: 1, name: 'India', code: 'IN' },
            { id: 2, name: 'United States', code: 'US' },
            { id: 3, name: 'United Arab Emirates', code: 'AE' },
          ];
        }
      },
      error: () => {
        this.countries = [
          { id: 1, name: 'India', code: 'IN' },
          { id: 2, name: 'United States', code: 'US' },
          { id: 3, name: 'United Arab Emirates', code: 'AE' },
        ];
      }
    });
  }

  loadCitiesForCountry(countryId: number, selectedCityId?: any): void {
    this.loadingCities = true;
    this.apiService.getCities(countryId).subscribe({
      next: (res) => {
        this.loadingCities = false;
        if (res.success && res.data.length > 0) {
          this.cities = res.data;
        } else {
          this.cities = [
            { id: 1, name: 'Mumbai' },
            { id: 2, name: 'Delhi' },
            { id: 3, name: 'Bengaluru' },
            { id: 4, name: 'Kolkata' },
            { id: 5, name: 'Hyderabad' },
            { id: 6, name: 'Chennai' },
            { id: 7, name: 'Patna' },
          ];
        }
        if (selectedCityId) {
          this.userForm.patchValue({ cityId: String(selectedCityId) });
        }
      },
      error: () => {
        this.loadingCities = false;
        this.cities = [
          { id: 1, name: 'Mumbai' },
          { id: 2, name: 'Delhi' },
          { id: 3, name: 'Bengaluru' },
        ];
      }
    });
  }

  onCountryChange(): void {
    const countryId = this.userForm.get('countryId')?.value;
    this.userForm.patchValue({ cityId: '' });
    this.cities = [];

    if (!countryId) return;
    this.loadCitiesForCountry(Number(countryId));
  }

  getFlagForCode(code: string): string {
    const item = this.dialCodes.find(d => d.code === code);
    return item ? item.flag : '🌐';
  }

  get f() {
    return this.userForm.controls;
  }

  // ==========================================
  // PASSWORD VALIDATION HELPERS
  // ==========================================
  get passwordVal(): string {
    return this.userForm.get('password')?.value || '';
  }

  get confirmPasswordVal(): string {
    return this.userForm.get('confirmPassword')?.value || '';
  }

  get hasMinMaxLen(): boolean {
    const len = this.passwordVal.length;
    return len >= 6 && len <= 16;
  }

  get hasUpperLower(): boolean {
    return /[a-z]/.test(this.passwordVal) && /[A-Z]/.test(this.passwordVal);
  }

  get hasNumber(): boolean {
    return /\d/.test(this.passwordVal);
  }

  get hasSpecialChar(): boolean {
    return /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(this.passwordVal);
  }

  get isPasswordValid(): boolean {
    if (this.isEditMode && !this.passwordVal) return true;
    return this.hasMinMaxLen && this.hasUpperLower && this.hasNumber && this.hasSpecialChar;
  }

  get passwordsMatch(): boolean {
    if (this.isEditMode && !this.passwordVal && !this.confirmPasswordVal) return true;
    if (!this.confirmPasswordVal) return false;
    return this.passwordVal === this.confirmPasswordVal;
  }

  // ==========================================
  // PHONE NUMBERS MANAGEMENT
  // ==========================================
  addPhone(): void {
    this.phoneList.push({
      countryCode: '+91',
      flag: '🇮🇳',
      number: '',
      isPrimary: this.phoneList.length === 0,
    });
  }

  removePhone(index: number): void {
    if (this.phoneList.length <= 1) {
      this.phoneList[0].number = '';
      return;
    }
    const wasPrimary = this.phoneList[index].isPrimary;
    this.phoneList.splice(index, 1);
    if (wasPrimary && this.phoneList.length > 0) {
      this.phoneList[0].isPrimary = true;
    }
  }

  setPrimaryPhone(index: number): void {
    this.phoneList.forEach((p, i) => {
      p.isPrimary = i === index;
    });
  }

  onDialCodeChange(index: number, code: string): void {
    const item = this.dialCodes.find(d => d.code === code);
    if (item) {
      this.phoneList[index].countryCode = item.code;
      this.phoneList[index].flag = item.flag;
    }
  }

  // ==========================================
  // OFF DAYS SELECTION
  // ==========================================
  isAllOffDaysSelected(): boolean {
    return this.daysOfWeek.every((day) => this.offDaysState[day]);
  }

  toggleSelectAllOffDays(event: any): void {
    const checked = event.target.checked;
    this.daysOfWeek.forEach((day) => {
      this.offDaysState[day] = checked;
    });
  }

  toggleDay(day: string): void {
    this.offDaysState[day] = !this.offDaysState[day];
  }

  // ==========================================
  // PHOTO UPLOAD
  // ==========================================
  onPhotoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file (PNG, JPG, WEBP)';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size exceeds 5MB limit';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      this.photoPreview = base64Data;
      this.uploadingPhoto = true;
      this.errorMessage = '';

      this.apiService.uploadFile(base64Data, file.name, file.type).subscribe({
        next: (res) => {
          this.uploadingPhoto = false;
          if (res.success && res.data?.url) {
            this.userForm.patchValue({ photoUrl: res.data.url });
          } else {
            this.userForm.patchValue({ photoUrl: base64Data });
          }
        },
        error: () => {
          this.uploadingPhoto = false;
          this.userForm.patchValue({ photoUrl: base64Data });
        },
      });
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.photoPreview = null;
    this.userForm.patchValue({ photoUrl: '' });
  }

  // ==========================================
  // CREATE & EDIT USER MODAL HANDLERS
  // ==========================================
  openCreateModal(): void {
    this.isEditMode = false;
    this.editingUserId = null;

    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(16)]);
    this.userForm.get('confirmPassword')?.setValidators([Validators.required]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('confirmPassword')?.updateValueAndValidity();

    this.userForm.reset({
      roleId: '',
      branchId: '',
      countryId: '',
      cityId: '',
      shiftTiming: '',
      voidPassword: '',
      photoUrl: '',
      idCardNo: '',
      joiningDate: '',
      address: '',
    });
    this.phoneList = [{ countryCode: '+91', flag: '🇮🇳', number: '', isPrimary: true }];
    this.daysOfWeek.forEach((day) => (this.offDaysState[day] = false));
    this.photoPreview = null;
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.submitted = false;
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(user: any): void {
    this.isEditMode = true;
    this.editingUserId = user.id;
    this.submitted = false;
    this.errorMessage = '';

    // Clear password required validators for edit mode
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('confirmPassword')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('confirmPassword')?.updateValueAndValidity();

    // Format joining date to YYYY-MM-DD for input[type=date]
    let formattedDate = '';
    if (user.joining_date) {
      try {
        const d = new Date(user.joining_date);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().split('T')[0];
        }
      } catch (e) {}
    }

    const countryIdVal = user.country_id ? String(user.country_id) : '';
    const cityIdVal = user.city_id ? String(user.city_id) : '';

    this.userForm.reset({
      name: user.name || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      joiningDate: formattedDate,
      address: user.address || '',
      countryId: countryIdVal,
      cityId: cityIdVal,
      roleId: user.roles && user.roles.length > 0 ? String(user.roles[0].id) : '',
      voidPassword: user.void_password || '',
      photoUrl: user.photo_url || '',
      idCardNo: user.id_card_no || '',
      shiftTiming: user.shift_timing || '',
      branchId: user.branches && user.branches.length > 0 ? String(user.branches[0].id) : '',
    });

    // Populate phone numbers
    let parsedPhones: PhoneEntry[] = [];
    if (user.phone_numbers) {
      try {
        const raw = typeof user.phone_numbers === 'string' ? JSON.parse(user.phone_numbers) : user.phone_numbers;
        if (Array.isArray(raw) && raw.length > 0) {
          parsedPhones = raw.map((p: any) => ({
            countryCode: p.countryCode || '+91',
            flag: this.getFlagForCode(p.countryCode || '+91'),
            number: p.number || '',
            isPrimary: !!p.isPrimary,
          }));
        }
      } catch (e) {
        parsedPhones = [];
      }
    }
    if (parsedPhones.length === 0 && user.phone) {
      const parts = String(user.phone).trim().split(' ');
      if (parts.length > 1 && parts[0].startsWith('+')) {
        parsedPhones = [{
          countryCode: parts[0],
          flag: this.getFlagForCode(parts[0]),
          number: parts.slice(1).join(''),
          isPrimary: true,
        }];
      } else {
        parsedPhones = [{
          countryCode: '+91',
          flag: '🇮🇳',
          number: String(user.phone).trim(),
          isPrimary: true,
        }];
      }
    }
    if (parsedPhones.length === 0) {
      parsedPhones = [{ countryCode: '+91', flag: '🇮🇳', number: '', isPrimary: true }];
    }
    this.phoneList = parsedPhones;

    // Populate off days
    this.daysOfWeek.forEach((d) => (this.offDaysState[d] = false));
    if (user.off_days) {
      try {
        const rawDays = typeof user.off_days === 'string' ? JSON.parse(user.off_days) : user.off_days;
        if (Array.isArray(rawDays)) {
          rawDays.forEach((d: string) => {
            if (this.offDaysState.hasOwnProperty(d)) {
              this.offDaysState[d] = true;
            }
          });
        }
      } catch (e) {}
    }

    // Photo preview
    this.photoPreview = user.photo_url || null;
    this.showPassword = false;
    this.showConfirmPassword = false;

    // Load cities if country is selected
    if (countryIdVal) {
      this.loadCitiesForCountry(Number(countryIdVal), user.city_id);
    }

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    // Primary Phone validation check
    const primaryPhone = this.phoneList.find(p => p.isPrimary);
    if (!primaryPhone || !primaryPhone.number.trim()) {
      this.errorMessage = 'Primary phone number is required';
      return;
    }

    // Password validation check
    if (!this.isEditMode || this.passwordVal) {
      if (!this.isPasswordValid) {
        this.errorMessage = 'Password does not meet the security criteria';
        return;
      }
      if (!this.passwordsMatch) {
        this.errorMessage = 'Passwords do not match';
        return;
      }
    }

    if (this.userForm.invalid) {
      this.errorMessage = 'Please complete all required fields correctly';
      return;
    }

    this.loading = true;
    const formVal = this.userForm.value;

    const selectedDays = this.daysOfWeek.filter((d) => this.offDaysState[d]);
    const validPhones = this.phoneList
      .filter((p) => p.number && p.number.trim().length > 0)
      .map((p) => ({
        countryCode: p.countryCode,
        number: p.number.trim(),
        isPrimary: p.isPrimary,
      }));

    const primaryNumberFormatted = `${primaryPhone.countryCode} ${primaryPhone.number}`.trim();

    const payload: Partial<CreateUserPayload> = {
      name: formVal.name,
      email: formVal.email,
      phone: primaryNumberFormatted,
      roleId: parseInt(formVal.roleId, 10),
      branchIds: formVal.branchId ? [parseInt(formVal.branchId, 10)] : [],
      joiningDate: formVal.joiningDate || null,
      address: formVal.address,
      countryId: formVal.countryId ? parseInt(formVal.countryId, 10) : null,
      cityId: formVal.cityId ? parseInt(formVal.cityId, 10) : null,
      voidPassword: formVal.voidPassword || null,
      photoUrl: formVal.photoUrl || null,
      idCardNo: formVal.idCardNo || null,
      shiftTiming: formVal.shiftTiming,
      offDays: selectedDays,
      phoneNumbers: validPhones,
    };

    if (formVal.password && formVal.password.trim()) {
      payload.password = formVal.password.trim();
    }

    if (this.isEditMode && this.editingUserId) {
      this.apiService.updateUser(this.editingUserId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Failed to update user account';
        },
      });
    } else {
      if (!formVal.password) {
        this.loading = false;
        this.errorMessage = 'Password is required for new user';
        return;
      }
      this.apiService.createUser(payload as CreateUserPayload).subscribe({
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
  }

  // ==========================================
  // LINK BRANCH & ROLE MODAL LOGIC (OPTION 1)
  // ==========================================
  openLinkModal(user: any): void {
    this.selectedUserForLink = user;
    this.linkErrorMessage = '';
    this.linkSuccessMessage = '';

    const storeId = user.store_id || this.storeContext.selectedStoreId() || this.authService.currentUser()?.storeId;
    this.linkStoreId = storeId ? Number(storeId) : null;
    this.linkStoreName = user.store_name || this.storeContext.selectedStore()?.name || '';

    if (user.roles && user.roles.length > 0) {
      this.linkRoleId = user.roles[0].id;
    } else {
      this.linkRoleId = this.availableRoles.length > 0 ? this.availableRoles[0].id : null;
    }

    const currentBranchIds = Array.isArray(user.branches) ? user.branches.map((b: any) => b.id) : [];
    this.selectedLinkBranchIds = new Set(currentBranchIds);

    this.loadBranchesForLinkStore(this.linkStoreId);
    this.showLinkModal = true;
  }

  closeLinkModal(): void {
    this.showLinkModal = false;
    this.selectedUserForLink = null;
  }

  onLinkStoreChange(storeId: any): void {
    this.linkStoreId = storeId ? parseInt(storeId, 10) : null;
    const matched = this.allStores.find((s) => s.id === this.linkStoreId);
    this.linkStoreName = matched ? matched.name : '';
    this.selectedLinkBranchIds.clear();
    this.loadBranchesForLinkStore(this.linkStoreId);
  }

  loadBranchesForLinkStore(storeId: number | null): void {
    this.apiService.getAllBranches(storeId || undefined).subscribe({
      next: (res) => {
        if (res.success) {
          this.linkStoreBranches = res.data;
        }
      },
    });
  }

  toggleLinkBranch(branchId: number): void {
    if (this.selectedLinkBranchIds.has(branchId)) {
      this.selectedLinkBranchIds.delete(branchId);
    } else {
      this.selectedLinkBranchIds.add(branchId);
    }
  }

  isLinkBranchSelected(branchId: number): boolean {
    return this.selectedLinkBranchIds.has(branchId);
  }

  areAllBranchesSelected(): boolean {
    return (
      this.linkStoreBranches.length > 0 &&
      this.linkStoreBranches.every((b) => this.selectedLinkBranchIds.has(b.id))
    );
  }

  toggleSelectAllLinkBranches(): void {
    if (this.areAllBranchesSelected()) {
      this.selectedLinkBranchIds.clear();
    } else {
      this.selectedLinkBranchIds = new Set(this.linkStoreBranches.map((b) => b.id));
    }
  }

  saveBranchLinks(): void {
    if (!this.selectedUserForLink) return;

    this.savingLink = true;
    this.linkErrorMessage = '';
    this.linkSuccessMessage = '';

    const payload = {
      storeId: this.linkStoreId || undefined,
      roleId: this.linkRoleId ? Number(this.linkRoleId) : undefined,
      branchIds: Array.from(this.selectedLinkBranchIds),
    };

    this.apiService.updateUser(this.selectedUserForLink.id, payload).subscribe({
      next: () => {
        this.savingLink = false;
        this.linkSuccessMessage = 'Branch assignments & role updated successfully!';
        setTimeout(() => {
          this.closeLinkModal();
          this.loadUsers();
        }, 700);
      },
      error: (err) => {
        this.savingLink = false;
        this.linkErrorMessage = err.error?.message || 'Failed to update branch assignments';
      },
    });
  }

  toggleUserStatus(user: any): void {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.apiService.updateUserStatus(user.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          user.status = newStatus;
        }
      },
    });
  }
}
