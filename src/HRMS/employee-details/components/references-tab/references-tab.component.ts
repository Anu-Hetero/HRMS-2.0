import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ReferenceRecord } from '../../employee-details.component';

@Component({
  selector: 'app-references-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './references-tab.component.html',
  styleUrl: '../../employee-details.component.scss',
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`],
})
export class ReferencesTabComponent {
  @Input() referenceRecords: ReferenceRecord[] = [];
  @Input() showReferenceModal = false;
  @Input() editingReferenceId: number | null = null;
  @Input() referenceForm!: FormGroup;
  @Input() referenceTypeOpts: string[] = [];
  @Input() locationOpts: string[] = [];
  @Input() empSubtitle = '';

  @Output() addReference = new EventEmitter<void>();
  @Output() editRecord = new EventEmitter<ReferenceRecord>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveRecord = new EventEmitter<void>();

  displayVal(v: any): string { return v === null || v === undefined || v === '' ? '—' : String(v); }
  isInvalid(form: FormGroup, field: string): boolean { const c = form.get(field); return !!(c && c.invalid && (c.touched || c.dirty)); }
  fieldError(form: FormGroup, field: string, errorType: string): boolean { const c = form.get(field); return !!(c && c.errors?.[errorType] && (c.touched || c.dirty)); }
}
