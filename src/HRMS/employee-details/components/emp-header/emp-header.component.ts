import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-emp-header',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './emp-header.component.html',
  styleUrl: '../../employee-details.component.scss',
  styles: [`:host { display: block; flex: none; }`],
})
export class EmpHeaderComponent {
  @Input() employee: any;
  @Input() isNew = false;
  @Input() newEmpBasicForm!: FormGroup;
  @Input() genderOptions: string[] = [];
  @Input() employmentTypeOpts: string[] = [];
  @Input() designationOpts: string[] = [];
  @Input() departmentOpts: string[] = [];

  @Output() saveNewEmployee = new EventEmitter<void>();
  @Output() goBack = new EventEmitter<void>();
}
