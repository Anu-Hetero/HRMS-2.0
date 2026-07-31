import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({ selector: '[appPhoneOnly]', standalone: true })
export class PhoneOnlyDirective {
  private readonly control = inject(NgControl, { optional: true });

  private readonly allowedKeys = new Set([
    'Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab','Enter',
  ]);

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || this.allowedKeys.has(event.key)) return;
    const input = event.target as HTMLInputElement;
    const pos   = input.selectionStart ?? 0;

    // + only at position 0, and only if not already present
    if (event.key === '+') {
      if (pos === 0 && !input.value.startsWith('+')) return;
      event.preventDefault(); return;
    }

    // Allow digits, dash, space, parentheses anywhere
    if (/^[\d\-\s\(\)]$/.test(event.key)) return;

    event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const input   = event.target as HTMLInputElement;
    const pasted  = event.clipboardData?.getData('text') ?? '';
    const start   = input.selectionStart ?? 0;

    // Strip everything except digits, +, -, space, parentheses
    let cleaned = pasted.replace(/[^\d\+\-\s\(\)]/g, '');
    // + is only valid at the very beginning of the full value
    if (start > 0) cleaned = cleaned.replace(/\+/g, '');
    else cleaned = cleaned.replace(/(?!^)\+/g, '');

    const end     = input.selectionEnd ?? 0;
    const current = input.value;
    const next    = current.slice(0, start) + cleaned + current.slice(end);

    if (this.control?.control) {
      this.control.control.setValue(next);
    } else {
      input.value = next;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
