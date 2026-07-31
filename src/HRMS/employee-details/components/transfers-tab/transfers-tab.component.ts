import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TransferRecord } from '../../employee-details.component';

@Component({
  selector: 'app-transfers-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transfers-tab.component.html',
  styleUrl: '../../employee-details.component.scss',
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`],
})
export class TransfersTabComponent {
  @Input() transferRecords: TransferRecord[] = [];
  @Input() showTransferModal = false;
  @Input() editingTransferId: number | null = null;
  @Input() transferStep: 1 | 2 = 1;
  @Input() transferForm!: FormGroup;
  @Input() transferActionForm!: FormGroup;
  @Input() transferTypeOpts: string[] = [];
  @Input() transferDetailsOpts: string[] = [];
  @Input() businessUnitOpts: string[] = [];
  @Input() costCentreOpts: string[] = [];
  @Input() departmentOpts: string[] = [];
  @Input() sectionOpts: string[] = [];
  @Input() designationOpts: string[] = [];
  @Input() headQuarterOpts: string[] = [];
  @Input() reportingDateTimeOpts: string[] = [];
  @Input() paysheetGroupOpts: string[] = [];
  @Input() payStructureOpts: string[] = [];
  @Input() actionTypeOpts: string[] = [];
  @Input() documentSourceOpts: string[] = [];
  @Input() transferStatusOpts: string[] = [];
  @Input() empSubtitle = '';

  @Output() addTransfer = new EventEmitter<void>();
  @Output() editRecord = new EventEmitter<TransferRecord>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() continueToActionDetails = new EventEmitter<void>();
  @Output() goBackToStep = new EventEmitter<void>();
  @Output() saveTransfer = new EventEmitter<void>();

  isInvalid(form: FormGroup, field: string): boolean { const c = form.get(field); return !!(c && c.invalid && (c.touched || c.dirty)); }
  fieldError(form: FormGroup, field: string, errorType: string): boolean { const c = form.get(field); return !!(c && c.errors?.[errorType] && (c.touched || c.dirty)); }
}
