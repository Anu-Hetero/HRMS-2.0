import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({ selector: '[appNoLeadingSpace]', standalone: true })
export class NoLeadingSpaceDirective {
  private readonly control = inject(NgControl, { optional: true });

  private readonly controlKeys = new Set([
    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End', 'Tab', 'Enter', 'Escape',
  ]);

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || this.controlKeys.has(event.key)) return;
    const input = event.target as HTMLInputElement;
    // At position 0: only letters and non-zero digits (1–9) are valid first characters
    if ((input.selectionStart ?? 0) === 0 && !/^[a-zA-Z1-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const input = event.target as HTMLInputElement;
    const pasted = event.clipboardData?.getData('text') ?? '';
    const start = input.selectionStart ?? 0;

    // When pasting at position 0, strip any leading characters that are not letters or 1-9
    const cleaned = start === 0 ? pasted.replace(/^[^a-zA-Z1-9]+/, '') : pasted;
    if (pasted !== cleaned) {
      event.preventDefault();
      const end = input.selectionEnd ?? 0;
      const current = input.value;
      const next = current.slice(0, start) + cleaned + current.slice(end);
      this.control?.control?.setValue(next);
    }
  }
}
