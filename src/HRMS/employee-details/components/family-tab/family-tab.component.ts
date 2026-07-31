import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FamilyMember } from '../../employee-details.component';
import { HrmsDatepickerComponent } from '../../../shared/components/hrms-datepicker/hrms-datepicker.component';
import { NoLeadingSpaceDirective } from '../../../shared/directives/no-leading-space.directive';
import { LettersOnlyDirective } from '../../../shared/directives/letters-only.directive';

@Component({
  selector: 'app-family-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HrmsDatepickerComponent, NoLeadingSpaceDirective, LettersOnlyDirective],
  templateUrl: './family-tab.component.html',
  styleUrl: '../../employee-details.component.scss',
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`],
})
export class FamilyTabComponent {
  @Input() familyMembers: FamilyMember[] = [];
  @Input() deletingFamilyId: number | null = null;
  @Input() showFamilyModal = false;
  @Input() editingFamilyMemberId: number | null = null;
  @Input() familyMemberForm!: FormGroup;
  @Input() isFamilySaving = false;
  @Input() familySaveError: string | null = null;
  @Input() relationOptions: any[] = [];
  @Input() bloodGroups: any[] = [];
  @Input() genderOptions: string[] = [];
  @Input() empSubtitle = '';

  @Output() addFamily = new EventEmitter<void>();
  @Output() editMember = new EventEmitter<FamilyMember>();
  @Output() toggleStatus = new EventEmitter<FamilyMember>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveMember = new EventEmitter<void>();

  displayVal(v: any): string { return v === null || v === undefined || v === '' ? '—' : String(v); }
  isInvalid(form: FormGroup, field: string): boolean { const c = form.get(field); return !!(c && c.invalid && (c.touched || c.dirty)); }
  fieldError(form: FormGroup, field: string, errorType: string): boolean { const c = form.get(field); return !!(c && c.errors?.[errorType] && (c.touched || c.dirty)); }

  calcAge(dob: string): number {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return Math.max(0, age);
  }

  getRelationName(id: any): string {
    return this.relationOptions.find((r: any) => r.relationId == id)?.relationName || this.displayVal(id);
  }

  getBloodGroupName(id: any): string {
    if (!id && id !== 0) return '—';
    return this.bloodGroups.find((b: any) => b.bloodGroupId == id)?.bloodGroupName || String(id);
  }
}
