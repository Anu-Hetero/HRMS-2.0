import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NoLeadingSpaceDirective } from '../../../shared/directives/no-leading-space.directive';
import { NoSpaceDirective } from '../../../shared/directives/no-space.directive';
import { NumbersOnlyDirective } from '../../../shared/directives/numbers-only.directive';
import { LettersOnlyDirective } from '../../../shared/directives/letters-only.directive';
import { HrmsDatepickerComponent } from '../../../shared/components/hrms-datepicker/hrms-datepicker.component';

@Component({
  selector: 'app-personal-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NoLeadingSpaceDirective, NoSpaceDirective, NumbersOnlyDirective, LettersOnlyDirective, HrmsDatepickerComponent],
  templateUrl: './personal-tab.component.html',
  styleUrl: '../../employee-details.component.scss',
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`],
})
export class PersonalTabComponent implements OnChanges {
  constructor(private elRef: ElementRef) {}

  @Input() personalData: any;
  @Input() editing: Record<string, boolean> = {};
  @Input() isNew = false;
  @Input() personalProfForm!: FormGroup;
  @Input() prevPFForm!: FormGroup;
  @Input() nativeForm!: FormGroup;
  @Input() healthForm!: FormGroup;
  @Input() idMarksForm!: FormGroup;
  @Input() languageList: any[] = [];
  @Input() maritalStatuses: any[] = [];
  @Input() nationalities: any[] = [];
  @Input() religions: any[] = [];
  @Input() bloodGroups: any[] = [];
  @Input() languages: any[] = [];
  @Input() countries: any[] = [];
  @Input() nativeStates: any[] = [];
  @Input() nativeCities: any[] = [];
  @Input() dobTypes: any[] = [];

  @Output() startEdit = new EventEmitter<string>();
  @Output() cancelEdit = new EventEmitter<string>();
  @Output() savePersonalProf = new EventEmitter<void>();
  @Output() savePrevPF = new EventEmitter<void>();
  @Output() saveNative = new EventEmitter<void>();
  @Output() saveHealth = new EventEmitter<void>();
  @Output() saveIdMarks = new EventEmitter<void>();
  @Output() addLanguage = new EventEmitter<{ languageId: number; canRead: number; canWrite: number; canSpeak: number }>();
  @Output() deleteLanguage = new EventEmitter<number>();
  @Output() nativeCountrySelected = new EventEmitter<any>();
  @Output() nativeStateSelected = new EventEmitter<any>();
  @Output() nativeCitySelected = new EventEmitter<any>();
  @Output() clearNativeCountryEvent = new EventEmitter<void>();
  @Output() clearNativeStateEvent = new EventEmitter<void>();

  // ── Typeahead local state ─────────────────────────────────────────────
  nationalitySearch = '';     showNationalityDropdown = false;
  religionSearch = '';        showReligionDropdown = false;
  bloodGroupSearch = '';      showBloodGroupDropdown = false;
  nativeCountrySearch = '';   showNativeCountryDropdown = false;
  nativeStateSearch = '';     showNativeStateDropdown = false;
  nativeCitySearch = '';      showNativeCityDropdown = false;

  // ── Add-language form state ───────────────────────────────────────────
  showAddLanguageForm = false;
  addLangSearch = '';         showAddLangDropdown = false;
  addLangId = '';
  addLangRead = false;        addLangWrite = false;        addLangSpeak = false;
  addLangTouched = false;

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target as Node)) {
      this.closeAllDropdowns();
    }
  }

  closeAllDropdowns(): void {
    this.showNationalityDropdown = false;
    this.showReligionDropdown = false;
    this.showBloodGroupDropdown = false;
    this.showNativeCountryDropdown = false;
    this.showNativeStateDropdown = false;
    this.showNativeCityDropdown = false;
    this.showAddLangDropdown = false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nationalities'] || changes['religions'] || changes['bloodGroups'] ||
        changes['languages'] || changes['countries'] || changes['nativeStates'] ||
        changes['nativeCities'] || changes['personalData'] || changes['editing']) {
      this.seedSearchLabels();
    }
  }

  private seedSearchLabels(): void {
    const pp = this.personalData?.professional;
    const nd = this.personalData?.native;
    if (pp?.nationality && this.nationalities.length)
      this.nationalitySearch = this.nationalities.find((n: any) => String(n.nationalityId) === String(pp.nationality))?.nationalityName || this.nationalitySearch;
    if (pp?.religion && this.religions.length)
      this.religionSearch = this.religions.find((r: any) => String(r.religionId) === String(pp.religion))?.religionName || this.religionSearch;
    if (pp?.bloodGroup && this.bloodGroups.length)
      this.bloodGroupSearch = this.bloodGroups.find((b: any) => String(b.bloodGroupId) === String(pp.bloodGroup))?.bloodGroupName || this.bloodGroupSearch;
    if (nd?.country && this.countries.length)
      this.nativeCountrySearch = this.countries.find((c: any) => String(c.countryId) === String(nd.country))?.countryName || this.nativeCountrySearch;
    if (nd?.state && this.nativeStates.length)
      this.nativeStateSearch = this.nativeStates.find((s: any) => String(s.stateId) === String(nd.state))?.stateName || this.nativeStateSearch;
    if (nd?.city && this.nativeCities.length)
      this.nativeCitySearch = this.nativeCities.find((c: any) => String(c.cityId) === String(nd.city))?.cityName || this.nativeCitySearch;
  }

  // ── Filtered getters ──────────────────────────────────────────────────
  private filterList(list: any[], search: string, key: string): any[] {
    const s = (search || '').toLowerCase().trim();
    return s ? list.filter(i => i[key]?.toLowerCase().includes(s)) : list;
  }
  get filteredNationalities(): any[]   { return this.filterList(this.nationalities, this.nationalitySearch, 'nationalityName'); }
  get filteredReligions(): any[]       { return this.filterList(this.religions, this.religionSearch, 'religionName'); }
  get filteredBloodGroups(): any[]     { return this.filterList(this.bloodGroups, this.bloodGroupSearch, 'bloodGroupName'); }
  get filteredNativeCountries(): any[] { return this.filterList(this.countries, this.nativeCountrySearch, 'countryName'); }
  get filteredNativeStates(): any[]    { return this.filterList(this.nativeStates, this.nativeStateSearch, 'stateName'); }
  get filteredNativeCities(): any[]    { return this.filterList(this.nativeCities, this.nativeCitySearch, 'cityName'); }
  get filteredAddLanguages(): any[]    { return this.filterList(this.languages, this.addLangSearch, 'languageName'); }

  // ── Nationality ───────────────────────────────────────────────────────
  onNationalityInput(e: Event): void { this.nationalitySearch = (e.target as HTMLInputElement).value; this.personalProfForm.patchValue({ nationality: '' }); this.showNationalityDropdown = true; }
  selectNationality(n: any): void { this.personalProfForm.patchValue({ nationality: String(n.nationalityId) }); this.nationalitySearch = n.nationalityName; this.showNationalityDropdown = false; }
  clearNationality(): void { this.personalProfForm.patchValue({ nationality: '' }); this.nationalitySearch = ''; this.showNationalityDropdown = false; }
  hideNationalityDropdownSoon(): void { setTimeout(() => { this.showNationalityDropdown = false; const v = this.personalProfForm.get('nationality')?.value; this.nationalitySearch = v ? this.nationalities.find((n: any) => String(n.nationalityId) === String(v))?.nationalityName || '' : ''; }, 200); }

  // ── Religion ──────────────────────────────────────────────────────────
  onReligionInput(e: Event): void { this.religionSearch = (e.target as HTMLInputElement).value; this.personalProfForm.patchValue({ religion: '' }); this.showReligionDropdown = true; }
  selectReligion(r: any): void { this.personalProfForm.patchValue({ religion: String(r.religionId) }); this.religionSearch = r.religionName; this.showReligionDropdown = false; }
  clearReligion(): void { this.personalProfForm.patchValue({ religion: '' }); this.religionSearch = ''; this.showReligionDropdown = false; }
  hideReligionDropdownSoon(): void { setTimeout(() => { this.showReligionDropdown = false; const v = this.personalProfForm.get('religion')?.value; this.religionSearch = v ? this.religions.find((r: any) => String(r.religionId) === String(v))?.religionName || '' : ''; }, 200); }

  // ── Blood Group ───────────────────────────────────────────────────────
  onBloodGroupInput(e: Event): void { this.bloodGroupSearch = (e.target as HTMLInputElement).value; this.personalProfForm.patchValue({ bloodGroup: '' }); this.showBloodGroupDropdown = true; }
  selectBloodGroup(b: any): void { this.personalProfForm.patchValue({ bloodGroup: String(b.bloodGroupId) }); this.bloodGroupSearch = b.bloodGroupName; this.showBloodGroupDropdown = false; }
  clearBloodGroup(): void { this.personalProfForm.patchValue({ bloodGroup: '' }); this.bloodGroupSearch = ''; this.showBloodGroupDropdown = false; }
  hideBloodGroupDropdownSoon(): void { setTimeout(() => { this.showBloodGroupDropdown = false; const v = this.personalProfForm.get('bloodGroup')?.value; this.bloodGroupSearch = v ? this.bloodGroups.find((b: any) => String(b.bloodGroupId) === String(v))?.bloodGroupName || '' : ''; }, 200); }

  // ── Native Country/State/City (parent handles API cascade) ───────────
  onNativeCountryInput(e: Event): void { this.nativeCountrySearch = (e.target as HTMLInputElement).value; this.nativeForm.patchValue({ country: '', state: '', city: '' }); this.nativeStateSearch = ''; this.nativeCitySearch = ''; this.showNativeCountryDropdown = true; }
  selectNativeCountry(c: any): void { this.nativeCountrySearch = c.countryName; this.nativeStateSearch = ''; this.nativeCitySearch = ''; this.showNativeCountryDropdown = false; this.nativeCountrySelected.emit(c); }
  clearNativeCountry(): void { this.nativeCountrySearch = ''; this.nativeStateSearch = ''; this.nativeCitySearch = ''; this.showNativeCountryDropdown = false; this.clearNativeCountryEvent.emit(); }
  hideNativeCountryDropdownSoon(): void { setTimeout(() => { this.showNativeCountryDropdown = false; const v = this.nativeForm.get('country')?.value; this.nativeCountrySearch = v ? this.countries.find((c: any) => String(c.countryId) === String(v))?.countryName || '' : ''; }, 200); }

  onNativeStateInput(e: Event): void { this.nativeStateSearch = (e.target as HTMLInputElement).value; this.nativeForm.patchValue({ state: '', city: '' }); this.nativeCitySearch = ''; this.showNativeStateDropdown = true; }
  selectNativeState(s: any): void { this.nativeStateSearch = s.stateName; this.nativeCitySearch = ''; this.showNativeStateDropdown = false; this.nativeStateSelected.emit(s); }
  clearNativeState(): void { this.nativeStateSearch = ''; this.nativeCitySearch = ''; this.showNativeStateDropdown = false; this.clearNativeStateEvent.emit(); }
  hideNativeStateDropdownSoon(): void { setTimeout(() => { this.showNativeStateDropdown = false; const v = this.nativeForm.get('state')?.value; this.nativeStateSearch = v ? this.nativeStates.find((s: any) => String(s.stateId) === String(v))?.stateName || '' : ''; }, 200); }

  onNativeCityInput(e: Event): void { this.nativeCitySearch = (e.target as HTMLInputElement).value; this.nativeForm.patchValue({ city: '' }); this.showNativeCityDropdown = true; }
  selectNativeCity(c: any): void { this.nativeCitySearch = c.cityName; this.showNativeCityDropdown = false; this.nativeCitySelected.emit(c); }
  clearNativeCity(): void { this.nativeCitySearch = ''; this.showNativeCityDropdown = false; this.nativeForm.patchValue({ city: '' }); }
  hideNativeCityDropdownSoon(): void { setTimeout(() => { this.showNativeCityDropdown = false; const v = this.nativeForm.get('city')?.value; this.nativeCitySearch = v ? this.nativeCities.find((c: any) => String(c.cityId) === String(v))?.cityName || '' : ''; }, 200); }

  // ── Add Language form ─────────────────────────────────────────────────
  toggleAddLanguageForm(): void { this.showAddLanguageForm = !this.showAddLanguageForm; if (!this.showAddLanguageForm) this.resetAddLangForm(); }
  onAddLangInput(e: Event): void { this.addLangSearch = (e.target as HTMLInputElement).value; this.addLangId = ''; this.showAddLangDropdown = true; }
  selectAddLang(l: any): void { this.addLangId = String(l.languageId); this.addLangSearch = l.languageName; this.showAddLangDropdown = false; }
  clearAddLang(): void { this.addLangId = ''; this.addLangSearch = ''; this.showAddLangDropdown = false; }
  hideAddLangDropdownSoon(): void { setTimeout(() => { this.showAddLangDropdown = false; }, 200); }

  submitAddLanguage(): void {
    this.addLangTouched = true;
    if (!this.addLangId) return;
    this.addLanguage.emit({
      languageId: Number(this.addLangId),
      canRead: this.addLangRead ? 1 : 0,
      canWrite: this.addLangWrite ? 1 : 0,
      canSpeak: this.addLangSpeak ? 1 : 0,
    });
    this.resetAddLangForm();
  }

  private resetAddLangForm(): void {
    this.addLangSearch = ''; this.addLangId = '';
    this.addLangRead = false; this.addLangWrite = false; this.addLangSpeak = false;
    this.addLangTouched = false; this.showAddLanguageForm = false;
  }

  getLanguageName(id: any): string { return this.languages.find((l: any) => String(l.languageId) === String(id))?.languageName || String(id); }
  getDobTypeName(id: any): string { return this.dobTypes.find((d: any) => d.dobTypeId == id)?.dobTypeName || this.displayVal(id); }
  getMaritalStatusName(id: any): string { return this.maritalStatuses.find((m: any) => m.maritalId === id)?.maritalName || this.displayVal(id); }
  displayVal(v: any): string { return v === null || v === undefined || v === '' ? '—' : String(v); }
  isInvalid(form: FormGroup, field: string): boolean { const c = form.get(field); return !!(c && c.invalid && (c.touched || c.dirty)); }

  
}
