import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-ctc-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ctc-tab.component.html',
  styleUrl: '../../employee-details.component.scss',
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`],
})
export class CtcTabComponent {
  @Input() ctcData: any;
  @Input() newCtcForm!: FormGroup;
  @Input() isNew = false;
  @Input() financialYearOpts: string[] = [];
  @Input() payStructureOpts: string[] = [];
  @Input() statusTypeOpts: string[] = [];
  @Input() actionTypeOpts: string[] = [];

  @Output() saveNewCtc = new EventEmitter<void>();
}
