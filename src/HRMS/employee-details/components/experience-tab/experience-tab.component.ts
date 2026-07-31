import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ExperienceRecord } from '../../employee-details.component';
import { HrmsDatepickerComponent } from '../../../shared/components/hrms-datepicker/hrms-datepicker.component';
import { NoLeadingSpaceDirective } from '../../../shared/directives/no-leading-space.directive';
import { FourDigitYearDirective } from '../../../shared/directives/four-digit-year.directive';

@Component({
  selector: 'app-experience-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HrmsDatepickerComponent, NoLeadingSpaceDirective, FourDigitYearDirective],
  templateUrl: './experience-tab.component.html',
  styleUrl: '../../employee-details.component.scss',
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`],
})
export class ExperienceTabComponent {
  constructor(private elRef: ElementRef) {}

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target as Node)) {
      this.showExpQualificationDropdown = false;
      this.showIndustryTypeDropdown = false;
      this.showFunctionalAreaDropdown = false;
      this.expQualificationDropdownHide.emit();
      this.industryTypeDropdownHide.emit();
      this.functionalAreaDropdownHide.emit();
    }
  }

  @Input() experienceRecords: ExperienceRecord[] = [];
  @Input() deletingExperienceId: number | null = null;
  @Input() showExperienceModal = false;
  @Input() editingExperienceId: number | null = null;
  @Input() experienceForm!: FormGroup;
  @Input() isExperienceSaving = false;
  @Input() experienceSaveError: string | null = null;
  @Input() qualifications: any[] = [];
  @Input() expBranches: any[] = [];
  @Input() isLoadingExpBranches = false;
  @Input() showExpBranchHint = false;
  @Input() industryTypes: any[] = [];
  @Input() functionalAreas: any[] = [];
  @Input() expQualificationSearch = '';
  @Input() industryTypeSearch = '';
  @Input() functionalAreaSearch = '';

  // local — not driven by parent, avoids @Input mutation bug on focus-then-select
  showExpQualificationDropdown = false;
  showIndustryTypeDropdown = false;
  showFunctionalAreaDropdown = false;
  @Input() isCurrentlyWorking = false;
  @Input() expDateOrderWarning = false;
  @Input() experienceCalcMonths = 0;
  @Input() empSubtitle = '';

  @Output() addExperience = new EventEmitter<void>();
  @Output() editRecord = new EventEmitter<ExperienceRecord>();
  @Output() toggleStatus = new EventEmitter<ExperienceRecord>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveRecord = new EventEmitter<void>();
  @Output() expQualificationInput = new EventEmitter<Event>();
  @Output() expQualificationSelected = new EventEmitter<any>();
  @Output() expQualificationCleared = new EventEmitter<void>();
  @Output() expQualificationDropdownHide = new EventEmitter<void>();
  @Output() industryTypeInput = new EventEmitter<Event>();
  @Output() industryTypeSelected = new EventEmitter<any>();
  @Output() industryTypeCleared = new EventEmitter<void>();
  @Output() industryTypeDropdownHide = new EventEmitter<void>();
  @Output() functionalAreaInput = new EventEmitter<Event>();
  @Output() functionalAreaSelected = new EventEmitter<any>();
  @Output() functionalAreaCleared = new EventEmitter<void>();
  @Output() functionalAreaDropdownHide = new EventEmitter<void>();
  @Output() toggleCurrentlyWorking = new EventEmitter<boolean>();
  @Output() relevanceToggle = new EventEmitter<boolean>();

  get filteredExpQualifications(): any[] {
    const q = this.expQualificationSearch.trim().toLowerCase();
    return q ? this.qualifications.filter(ql => ql.qualificationName?.toLowerCase().includes(q)) : this.qualifications.slice(0, 60);
  }

  get filteredIndustryTypes(): any[] {
    const q = this.industryTypeSearch.trim().toLowerCase();
    return q ? this.industryTypes.filter(it => it.industryTypeName?.toLowerCase().includes(q)) : this.industryTypes.slice(0, 60);
  }

  get filteredFunctionalAreas(): any[] {
    const q = this.functionalAreaSearch.trim().toLowerCase();
    return q ? this.functionalAreas.filter(fa => fa.functionalAreaIName?.toLowerCase().includes(q)) : this.functionalAreas.slice(0, 60);
  }

  // Local handlers — close dropdown immediately on selection, then emit to parent for business logic
  onExpQualSelect(ql: any): void   { this.showExpQualificationDropdown = false; this.expQualificationSelected.emit(ql); }
  onIndustryTypeSelect(it: any): void { this.showIndustryTypeDropdown = false; this.industryTypeSelected.emit(it); }
  onFunctionalAreaSelect(fa: any): void { this.showFunctionalAreaDropdown = false; this.functionalAreaSelected.emit(fa); }

  onExpQualBlur(): void    { setTimeout(() => { this.showExpQualificationDropdown = false; }, 200); this.expQualificationDropdownHide.emit(); }
  onIndustryTypeBlur(): void  { setTimeout(() => { this.showIndustryTypeDropdown = false; }, 200); this.industryTypeDropdownHide.emit(); }
  onFunctionalAreaBlur(): void { setTimeout(() => { this.showFunctionalAreaDropdown = false; }, 200); this.functionalAreaDropdownHide.emit(); }

  getIndustryTypeName(id: any): string {
    if (!id) return '—';
    return this.industryTypes.find((it: any) => it.industryTypeId == id)?.industryTypeName || String(id);
  }

  displayVal(v: any): string { return v === null || v === undefined || v === '' ? '—' : String(v); }
  isInvalid(form: FormGroup, field: string): boolean { const c = form.get(field); return !!(c && c.invalid && (c.touched || c.dirty)); }
  fieldError(form: FormGroup, field: string, errorType: string): boolean { const c = form.get(field); return !!(c && c.errors?.[errorType] && (c.touched || c.dirty)); }
}
