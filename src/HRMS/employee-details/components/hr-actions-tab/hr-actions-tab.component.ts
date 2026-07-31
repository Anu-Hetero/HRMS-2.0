import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { HrActionRecord } from '../../employee-details.component';

@Component({
  selector: 'app-hr-actions-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './hr-actions-tab.component.html',
  styleUrl: '../../employee-details.component.scss',
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`],
})
export class HrActionsTabComponent {
  @Input() hrActionRecords: HrActionRecord[] = [];
  @Input() showHrActionModal = false;
  @Input() editingHrActionId: number | null = null;
  @Input() hrActionForm!: FormGroup;
  @Input() hrActionCategoryOpts: string[] = [];
  @Input() empSubtitle = '';

  @Output() addHrAction = new EventEmitter<void>();
  @Output() editRecord = new EventEmitter<HrActionRecord>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveRecord = new EventEmitter<void>();

  isInvalid(form: FormGroup, field: string): boolean { const c = form.get(field); return !!(c && c.invalid && (c.touched || c.dirty)); }
  fieldError(form: FormGroup, field: string, errorType: string): boolean { const c = form.get(field); return !!(c && c.errors?.[errorType] && (c.touched || c.dirty)); }
}
