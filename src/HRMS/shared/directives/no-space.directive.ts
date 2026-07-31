import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({ selector: '[appNoSpace]', standalone: true })
export class NoSpaceDirective {
  private readonly control = inject(NgControl, { optional: true });

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ') event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const pasted = event.clipboardData?.getData('text') ?? '';
    const cleaned = pasted.replace(/\s/g, '');
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const next = input.value.slice(0, start) + cleaned + input.value.slice(end);
    if (this.control?.control) {
      this.control.control.setValue(next);
    } else {
      input.value = next;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
