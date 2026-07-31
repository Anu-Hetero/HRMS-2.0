import { Directive, HostListener, Input } from '@angular/core';

@Directive({ selector: '[appFourDigitYear]', standalone: true })
export class FourDigitYearDirective {
  /** Override to allow a different digit cap (e.g. 3 for percentage). */
  @Input() maxDigits = 4;

  private readonly allowedKeys = new Set([
    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab',
  ]);

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || this.allowedKeys.has(event.key)) return;

    // Block non-digit characters (e, E, +, -, . and any letter)
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    const start = input.selectionStart ?? 0;

    // Block leading zero — first character must not be '0'
    if (event.key === '0' && start === 0) {
      event.preventDefault();
      return;
    }

    // Block digit beyond maxDigits
    const currentDigits = input.value.replace(/\D/g, '');
    const hasSelection = (input.selectionEnd ?? 0) > start;
    if (currentDigits.length >= this.maxDigits && !hasSelection) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    // Strip non-digits and leading zeros
    const digits = pasted.replace(/\D/g, '').replace(/^0+/, '').slice(0, this.maxDigits);
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart ?? 0;
    const end   = input.selectionEnd   ?? 0;
    const current = input.value.replace(/\D/g, '');
    const combined = (current.slice(0, start) + digits + current.slice(end)).slice(0, this.maxDigits);
    input.value = combined;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
