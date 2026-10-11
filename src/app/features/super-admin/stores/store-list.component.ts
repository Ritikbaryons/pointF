import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.services';
import { Store, Country, City } from '../../../core/models/store.model';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './store-list.component.html',
  styleUrl: './store-list.component.css',
})
export class StoreListComponent implements OnInit {
  stores: any[] = [];

  // Edit Store Modal State
  showEditModal = false;
  editingStore: any = null;
  editStoreForm: FormGroup;
  editSubmitted = false;
  savingStore = false;
  editErrorMessage = '';

  countries: Country[] = [];
  cities: City[] = [];
  loadingCities = false;
  uploadingLogo = false;
  logoPreview: string | null = null;

  constructor(
    private storeService: ApiService,
    private fb: FormBuilder
  ) {
    this.editStoreForm = this.fb.group({
      name: ['', Validators.required],
      registrationNo: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['', Validators.required],
      countryId: ['', Validators.required],
      cityId: ['', Validators.required],
      poBox: [''],
      resetTime: ['04:00', Validators.required],
      trnNumber: [''],
      logoUrl: [''],
    });
  }

  ngOnInit(): void {
    this.loadStores();
    this.loadCountries();
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

  loadCountries(): void {
    this.storeService.getCountries().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.countries = res.data;
        }
      },
      error: () => {
        this.countries = [
          { id: 1, name: 'India' },
          { id: 2, name: 'United States' },
          { id: 3, name: 'United Arab Emirates' },
        ];
      }
    });
  }

  loadCities(countryId: number, selectedCityId?: any): void {
    this.loadingCities = true;
    this.storeService.getCities(countryId).subscribe({
      next: (res) => {
        this.loadingCities = false;
        if (res.success && res.data.length > 0) {
          this.cities = res.data;
        } else {
          this.cities = [
            { id: 1, name: 'Mumbai', country_id: 1 },
            { id: 2, name: 'Delhi', country_id: 1 },
            { id: 3, name: 'Bengaluru', country_id: 1 },
            { id: 4, name: 'Jaipur', country_id: 1 },
            { id: 5, name: 'Dubai', country_id: 3 },
          ];
        }
        if (selectedCityId) {
          this.editStoreForm.patchValue({ cityId: Number(selectedCityId) });
        }
      },
      error: () => {
        this.loadingCities = false;
      }
    });
  }

  onCountryChange(): void {
    const countryId = this.editStoreForm.get('countryId')?.value;
    this.editStoreForm.patchValue({ cityId: '' });
    this.cities = [];

    if (!countryId) return;
    this.loadCities(Number(countryId));
  }

  get ef() {
    return this.editStoreForm.controls;
  }

  openEditModal(store: any): void {
    this.editingStore = store;
    this.editSubmitted = false;
    this.editErrorMessage = '';
    this.logoPreview = store.logo_url || null;

    const countryIdVal = store.country_id || 1;
    this.editStoreForm.patchValue({
      name: store.name || '',
      registrationNo: store.registration_no || store.code || '',
      email: store.email || '',
      phone: store.phone || '',
      address: store.address || '',
      countryId: countryIdVal,
      cityId: store.city_id || '',
      poBox: store.po_box || '',
      resetTime: store.reset_time || '04:00',
      trnNumber: store.trn_number || '',
      logoUrl: store.logo_url || '',
    });

    if (countryIdVal) {
      this.loadCities(Number(countryIdVal), store.city_id);
    }

    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingStore = null;
  }

  onLogoSelect(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.uploadingLogo = true;
      const base64Data = reader.result as string;
      this.logoPreview = base64Data;
      this.storeService.uploadFile(base64Data, file.name, file.type).subscribe({
        next: (res) => {
          this.uploadingLogo = false;
          if (res.success && res.data) {
            this.editStoreForm.patchValue({ logoUrl: res.data.url });
          }
        },
        error: () => {
          this.uploadingLogo = false;
          this.editStoreForm.patchValue({ logoUrl: base64Data });
        }
      });
    };
    reader.readAsDataURL(file);
  }

  onSubmitEditStore(): void {
    this.editSubmitted = true;
    this.editErrorMessage = '';

    if (this.editStoreForm.invalid) {
      return;
    }

    this.savingStore = true;
    const formVal = this.editStoreForm.value;

    const payload: any = {
      name: formVal.name,
      registration_no: formVal.registrationNo,
      registrationNo: formVal.registrationNo,
      email: formVal.email,
      phone: formVal.phone,
      address: formVal.address,
      country_id: formVal.countryId ? Number(formVal.countryId) : undefined,
      city_id: formVal.cityId ? Number(formVal.cityId) : undefined,
      countryId: formVal.countryId ? Number(formVal.countryId) : undefined,
      cityId: formVal.cityId ? Number(formVal.cityId) : undefined,
      po_box: formVal.poBox,
      poBox: formVal.poBox,
      reset_time: formVal.resetTime,
      resetTime: formVal.resetTime,
      trn_number: formVal.trnNumber,
      trnNumber: formVal.trnNumber,
      logo_url: formVal.logoUrl,
      logoUrl: formVal.logoUrl,
    };

    this.storeService.updateStore(this.editingStore.id, payload).subscribe({
      next: () => {
        this.savingStore = false;
        this.closeEditModal();
        this.loadStores();
      },
      error: (err) => {
        this.savingStore = false;
        this.editErrorMessage = err.error?.message || 'Failed to update store details';
      }
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
}
