import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HrmsLoadingService {
  private count = 0;
  private readonly _active = signal(false);

  readonly active = this._active.asReadonly();

  increment(): void {
    if (++this.count === 1) this._active.set(true);
  }

  decrement(): void {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) this._active.set(false);
  }
}
