import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private readonly _toasts = signal<Toast[]>([]);

  readonly toasts = this._toasts.asReadonly();

  success(message: string, duration = 2000): void { this.add(message, 'success', duration); }
  error(message: string, duration = 2000): void   { this.add(message, 'error',   duration); }
  warning(message: string, duration = 2000): void { this.add(message, 'warning', duration); }
  info(message: string, duration = 2000): void    { this.add(message, 'info',    duration); }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private add(message: string, type: ToastType, duration: number): void {
    if (this._toasts().some(t => t.type === type && t.message === message)) return;
    const id = ++this.counter;
    this._toasts.update(list => [...list, { id, type, message }]);
    if (duration > 0) setTimeout(() => this.dismiss(id), duration);
  }
}
