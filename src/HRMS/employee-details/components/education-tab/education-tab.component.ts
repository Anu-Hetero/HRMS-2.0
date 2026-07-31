import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { EducationRecord } from '../../employee-details.component';
import { NoLeadingSpaceDirective } from '../../../shared/directives/no-leading-space.directive';
import { LettersOnlyDirective } from '../../../shared/directives/letters-only.directive';
import { FourDigitYearDirective } from '../../../shared/directives/four-digit-year.directive';

@Component({
  selector: 'app-education-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NoLeadingSpaceDirective, LettersOnlyDirective, FourDigitYearDirective],
  templateUrl: './education-tab.component.html',
  styleUrl: '../../employee-details.component.scss',
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`],
})
export class EducationTabComponent {
  constructor(private elRef: ElementRef) {}

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target as Node)) {
      this.showQualificationDropdown = false;
      this.showUniversityDropdown = false;
      this.qualificationDropdownHide.emit();
      this.universityDropdownHide.emit();
    }
  }

  @Input() educationRecords: EducationRecord[] = [];
  @Input() deletingEducationId: number | null = null;
  @Input() showEducationModal = false;
  @Input() editingEducationId: number | null = null;
  @Input() educationForm!: FormGroup;
  @Input() isEducationSaving = false;
  @Input() educationSaveError: string | null = null;
  @Input() qualifications: any[] = [];
  @Input() educationBranches: any[] = [];
  @Input() isLoadingBranches = false;
  @Input() showBranchHint = false;
  @Input() universities: any[] = [];
  @Input() educationTypes: any[] = [];
  @Input() qualificationSearch = '';
  @Input() universitySearch = '';

  // local — not driven by parent (avoids @Input mutation bug on focus-then-select)
  showQualificationDropdown = false;
  showUniversityDropdown = false;
  @Input() empSubtitle = '';

  @Output() addEducation = new EventEmitter<void>();
  @Output() editRecord = new EventEmitter<EducationRecord>();
  @Output() toggleStatus = new EventEmitter<EducationRecord>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveRecord = new EventEmitter<void>();
  @Output() qualificationInput = new EventEmitter<Event>();
  @Output() qualificationSelected = new EventEmitter<any>();
  @Output() qualificationCleared = new EventEmitter<void>();
  @Output() qualificationDropdownHide = new EventEmitter<void>();
  @Output() universityInput = new EventEmitter<Event>();
  @Output() universitySelected = new EventEmitter<any>();
  @Output() universityCleared = new EventEmitter<void>();
  @Output() universityDropdownHide = new EventEmitter<void>();

  get filteredQualifications(): any[] {
    const q = this.qualificationSearch.trim().toLowerCase();
    return q
      ? this.qualifications.filter(ql => ql.qualificationName?.toLowerCase().includes(q))
      : this.qualifications.slice(0, 60);
  }

  get filteredUniversities(): any[] {
    const q = this.universitySearch.trim().toLowerCase();
    return q
      ? this.universities.filter(u => u.universityName?.toLowerCase().includes(q))
      : this.universities.slice(0, 60);
  }

  onQualSelect(ql: any): void  { this.showQualificationDropdown = false; this.qualificationSelected.emit(ql); }
  onUnivSelect(u: any): void   { this.showUniversityDropdown = false; this.universitySelected.emit(u); }
  onQualBlur(): void  { setTimeout(() => { this.showQualificationDropdown = false; }, 200); this.qualificationDropdownHide.emit(); }
  onUnivBlur(): void  { setTimeout(() => { this.showUniversityDropdown = false; }, 200); this.universityDropdownHide.emit(); }

  displayVal(v: any): string { return v === null || v === undefined || v === '' ? '—' : String(v); }
  isInvalid(form: FormGroup, field: string): boolean { const c = form.get(field); return !!(c && c.invalid && (c.touched || c.dirty)); }
  fieldError(form: FormGroup, field: string, errorType: string): boolean { const c = form.get(field); return !!(c && c.errors?.[errorType] && (c.touched || c.dirty)); }

  getEducationTypeName(id: number | null): string {
    if (id == null) return '—';
    return this.educationTypes.find((e: any) => e.educationTypeId == id)?.educationTypeName || String(id);
  }

  getUniversityName(id: number | null): string {
    if (id == null) return '—';
    return this.universities.find((u: any) => u.universityId == id)?.universityName || '';
  }

  getQualificationName(id: any): string {
    if (!id) return this.displayVal(id);
    return this.qualifications.find((q: any) => String(q.qualificationId) === String(id))?.qualificationName || this.displayVal(id);
  }

  getBranchName(id: any): string {
    if (!id) return '—';
    return this.educationBranches.find((b: any) => b.branchId == id)?.branchName || String(id);
  }
}
