import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-hrms-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './hrms-login.component.html',
  styleUrl: './hrms-login.component.sass',
})
export class HrmsLoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly fb          = inject(FormBuilder);

  readonly loginForm: FormGroup = this.fb.group({
    employeeId: ['', [Validators.required, Validators.pattern('^[0-9]{5,8}$')]],
    password:   ['', [Validators.required, Validators.minLength(6), Validators.maxLength(15)]],
  });

  isLoading    = false;
  showPassword = false;
  errorMessage = '';
  currentYear  = new Date().getFullYear();

  get empId() { return this.loginForm.get('employeeId')!; }
  get pwd()   { return this.loginForm.get('password')!; }

  allowOnlyNumbers(event: KeyboardEvent): boolean {
    return /[0-9]/.test(event.key);
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  onSubmit(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }

    this.isLoading    = true;
    this.errorMessage = '';

    this.authService.login({
      employeeId: Number(this.loginForm.value.employeeId),
      password:   this.loginForm.value.password,
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        localStorage.setItem('hrmsToken', JSON.stringify(res));
        this.router.navigate(['/hrms/employees']);
      },
      error: (err: any) => {
        this.isLoading    = false;
        this.errorMessage = err?.error?.message || 'Invalid credentials. Please try again.';
      },
    });
  }
}
