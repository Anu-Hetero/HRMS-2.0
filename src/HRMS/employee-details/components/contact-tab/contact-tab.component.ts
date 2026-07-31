import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NoLeadingSpaceDirective } from '../../../shared/directives/no-leading-space.directive';
import { LettersOnlyDirective } from '../../../shared/directives/letters-only.directive';
import { FourDigitYearDirective } from '../../../shared/directives/four-digit-year.directive';
import { NoSpaceDirective } from '../../../shared/directives/no-space.directive';

@Component({
  selector: 'app-contact-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NoLeadingSpaceDirective, LettersOnlyDirective, FourDigitYearDirective, NoSpaceDirective],
  templateUrl: './contact-tab.component.html',
  styleUrl: '../../employee-details.component.scss',
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`],
})
export class ContactTabComponent {
  constructor(private elRef: ElementRef) {}

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target as Node)) {
      Object.keys(this.contactDropdownOpen).forEach(section => {
        this.contactDropdownOpen[section].country = false;
        this.contactDropdownOpen[section].state = false;
        this.contactDropdownOpen[section].city = false;
      });
    }
  }

  @Input() contactData: any;
  @Input() editing: Record<string, boolean> = {};
  @Input() isNew = false;
  @Input() profContactForm!: FormGroup;
  @Input() persContactForm!: FormGroup;
  @Input() permAddressForm!: FormGroup;
  @Input() iceForm!: FormGroup;
  @Input() countries: any[] = [];
  @Input() sectionStates: Record<string, any[]> = {};
  @Input() sectionCities: Record<string, any[]> = {};
  @Input() contactSearch: Record<string, { country: string; state: string; city: string }> = {};
  @Input() contactDropdownOpen: Record<string, { country: boolean; state: boolean; city: boolean }> = {};
  @Input() relations: any[] = [];

  @Output() startEdit = new EventEmitter<string>();
  @Output() cancelEdit = new EventEmitter<string>();
  @Output() saveProfContact = new EventEmitter<void>();
  @Output() savePersContact = new EventEmitter<void>();
  @Output() savePermAddress = new EventEmitter<void>();
  @Output() saveIce = new EventEmitter<void>();
  @Output() selectCountry = new EventEmitter<{ section: string; country: any; form: FormGroup }>();
  @Output() selectState = new EventEmitter<{ section: string; state: any; form: FormGroup }>();
  @Output() selectCity = new EventEmitter<{ section: string; city: any; form: FormGroup }>();
  @Output() clearContactField = new EventEmitter<{ section: string; field: string; form: FormGroup }>();
  @Output() sameAsCurrentChange = new EventEmitter<void>();
  @Output() iceAddressModeChange = new EventEmitter<void>();

  getFilteredCountries(section: string): any[] {
    const q = (this.contactSearch[section]?.country || '').toLowerCase().trim();
    return q ? this.countries.filter(c => c.countryName?.toLowerCase().includes(q)) : this.countries.slice(0, 60);
  }

  getFilteredStates(section: string): any[] {
    const q = (this.contactSearch[section]?.state || '').toLowerCase().trim();
    const states = this.sectionStates[section] || [];
    return q ? states.filter((s: any) => s.stateName?.toLowerCase().includes(q)) : states.slice(0, 60);
  }

  getFilteredCities(section: string): any[] {
    const q = (this.contactSearch[section]?.city || '').toLowerCase().trim();
    const cities = this.sectionCities[section] || [];
    return q ? cities.filter((c: any) => c.cityName?.toLowerCase().includes(q)) : cities.slice(0, 60);
  }

  getCountryName(id: any): string {
    if (!id) return '—';
    return this.countries.find((c: any) => c.countryId == id)?.countryName || String(id);
  }

  getStateName(section: string, id: any): string {
    if (!id) return '—';
    return (this.sectionStates[section] || []).find((s: any) => s.stateId == id)?.stateName || String(id);
  }

  getCityName(section: string, id: any): string {
    if (!id) return '—';
    return (this.sectionCities[section] || []).find((c: any) => c.cityId == id)?.cityName || String(id);
  }

  getRelationName(id: any): string {
    return this.relations.find((r: any) => r.relationId == id)?.relationName || (id ? String(id) : '—');
  }

  hideContactDropdown(section: string, field: string): void {
    if (this.contactDropdownOpen[section]) {
      this.contactDropdownOpen[section][field as 'country' | 'state' | 'city'] = false;
    }
  }

  displayVal(v: any): string { return v === null || v === undefined || v === '' ? '—' : String(v); }
  isInvalid(form: FormGroup, field: string): boolean { const c = form.get(field); return !!(c && c.invalid && (c.touched || c.dirty)); }
  fieldError(form: FormGroup, field: string, errorType: string): boolean { const c = form.get(field); return !!(c && c.errors?.[errorType] && (c.touched || c.dirty)); }
}
