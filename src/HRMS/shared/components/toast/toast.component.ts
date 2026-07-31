import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-hrms-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly toastSvc = inject(ToastService);

  // Read the signal through a getter so the template stays type-safe
  get toasts() { return this.toastSvc.toasts(); }

  dismiss(id: number): void { this.toastSvc.dismiss(id); }

  iconFor(type: ToastType): string {
    const icons: Record<ToastType, string> = {
      success: '✓',
      error:   '✕',
      warning: '⚠',
      info:    'ℹ',
    };
    return icons[type];
  }
}
