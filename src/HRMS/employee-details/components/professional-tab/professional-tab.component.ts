import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-professional-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './professional-tab.component.html',
  styleUrl: '../../employee-details.component.scss',
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`],
})
export class ProfessionalTabComponent {
  @Input() professionalData: any;
  @Input() editing: Record<string, boolean> = {};
  @Input() isNew = false;
  @Input() profProfForm!: FormGroup;
  @Input() workLocationForm!: FormGroup;
  @Input() reportingOfficerForm!: FormGroup;
  @Input() profileForm!: FormGroup;
  @Input() expLevelForm!: FormGroup;
  @Input() departmentOpts: string[] = [];
  @Input() sectionOpts: string[] = [];
  @Input() designationOpts: string[] = [];
  @Input() paysheetGroupOpts: string[] = [];
  @Input() headQuarterOpts: string[] = [];
  @Input() regionOpts: string[] = [];
  @Input() termsOfServiceOpts: string[] = [];
  @Input() expLevelOpts: string[] = [];
  @Input() incrementTypeOpts: string[] = [];

  @Output() startEdit = new EventEmitter<string>();
  @Output() cancelEdit = new EventEmitter<string>();
  @Output() saveProfProf = new EventEmitter<void>();
  @Output() saveWorkLocation = new EventEmitter<void>();
  @Output() saveReportingOfficer = new EventEmitter<void>();
  @Output() saveProfProfile = new EventEmitter<void>();
  @Output() saveExpLevel = new EventEmitter<void>();

  displayVal(v: any): string { return v === null || v === undefined || v === '' ? '—' : String(v); }
}
