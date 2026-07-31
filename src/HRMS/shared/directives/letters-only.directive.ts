import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({ selector: '[appLettersOnly]', standalone: true })
export class LettersOnlyDirective {
  private readonly control = inject(NgControl, { optional: true });

  private readonly allowedKeys = new Set([
    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End', 'Tab', 'Enter',
  ]);

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    if (event.ctrlKey || event.metaKey || this.allowedKeys.has(event.key)) return;

    // Block leading space
    if (event.key === ' ' && input.selectionStart === 0) {
      event.preventDefault();
      return;
    }

    // Allow only letters and internal spaces
    if (!/^[a-zA-Z ]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const pasted = event.clipboardData?.getData('text') ?? '';
    const cleaned = pasted.replace(/[^a-zA-Z ]/g, '').replace(/^ +/, '');
    const start = input.selectionStart ?? 0;
    const end   = input.selectionEnd   ?? 0;
    const current = input.value;
    const next = current.slice(0, start) + cleaned + current.slice(end);
    if (this.control?.control) {
      this.control.control.setValue(next);
    } else {
      input.value = next;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
