import {
  Component, forwardRef, Input, HostListener,
  ChangeDetectionStrategy, ChangeDetectorRef, inject, ElementRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

const MONTHS = [
  'January','February','March','April','May',
  'June','July','August','September','October','November','December',
];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

interface Cell {
  day: number; month: number; year: number;
  otherMonth: boolean; isToday: boolean; isSelected: boolean;
  dateStr: string;
}

@Component({
  selector: 'hrms-datepicker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => HrmsDatepickerComponent),
    multi: true,
  }],
  template: `
    <div class="hdp-host">
      <div class="hdp-input-wrap" [class.hdp-focused]="isOpen">
        <svg class="hdp-cal-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             (click)="toggle()">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <input type="text" class="hdp-text-input"
               readonly
               [value]="displayValue"
               [placeholder]="placeholder"
               (click)="toggle()" />
        @if (value) {
          <button type="button" class="hdp-x-btn" (click)="clear($event)">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        }
      </div>

      @if (isOpen) {
        <div class="hdp-panel"
             [style.top.px]="panelTop"
             [style.left.px]="panelLeft">
          <div class="hdp-header">
            <button type="button" class="hdp-nav-btn" (click)="prevMonth()">‹</button>
            <span class="hdp-month-label">{{ monthLabel }}</span>
            <button type="button" class="hdp-nav-btn" (click)="nextMonth()">›</button>
          </div>
          <div class="hdp-weekdays">
            @for (d of weekdays; track d) { <span>{{ d }}</span> }
          </div>
          <div class="hdp-grid">
            @for (c of cells; track c.dateStr + c.otherMonth) {
              <span class="hdp-cell"
                    [class.hdp-other]="c.otherMonth"
                    [class.hdp-today]="c.isToday"
                    [class.hdp-selected]="c.isSelected"
                    (click)="pick(c)">{{ c.day }}</span>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .hdp-host { position: relative; width: 100%; }

    .hdp-input-wrap {
      display: flex; align-items: center;
      border: 1px solid #e5e7eb; border-radius: 6px;
      background: #fff; padding: 0 8px; gap: 6px;
      transition: border-color .2s, box-shadow .2s;
      cursor: pointer;
      &.hdp-focused { border-color: #6d28d9; box-shadow: 0 0 0 3px rgba(109,40,217,.1); }
    }

    .hdp-cal-icon { color: #9ca3af; flex-shrink: 0; cursor: pointer; }

    .hdp-text-input {
      flex: 1; border: none; outline: none;
      padding: 8px 0; font-size: .875rem; color: #111827;
      background: transparent; cursor: pointer; font-family: inherit;
      &::placeholder { color: #d1d5db; }
    }

    .hdp-x-btn {
      background: none; border: none; cursor: pointer; padding: 3px;
      color: #9ca3af; display: flex; align-items: center; border-radius: 50%;
      &:hover { background: #f3f4f6; color: #374151; }
    }

    /* Fixed overlay — never causes scroll, never clipped by modal overflow */
    .hdp-panel {
      position: fixed;
      z-index: 9999;
      width: 260px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,.18);
      animation: hdpIn .14s ease;
      overflow: hidden;
    }

    @keyframes hdpIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .hdp-header {
      display: flex; align-items: center; justify-content: space-between;
      background: #6d28d9; padding: 10px 12px;
    }

    .hdp-month-label { color: #fff; font-weight: 600; font-size: .88rem; letter-spacing: .3px; }

    .hdp-nav-btn {
      background: rgba(255,255,255,.18); border: none; color: #fff;
      width: 26px; height: 26px; border-radius: 50%; cursor: pointer;
      font-size: 1.1rem; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
      &:hover { background: rgba(255,255,255,.32); }
    }

    .hdp-weekdays {
      display: grid; grid-template-columns: repeat(7, 1fr);
      background: #f5f3ff; padding: 5px 6px 3px;
      span { text-align: center; font-size: .68rem; font-weight: 600; color: #7c3aed; }
    }

    .hdp-grid {
      display: grid; grid-template-columns: repeat(7, 1fr);
      padding: 5px 6px 8px; gap: 1px;
    }

    .hdp-cell {
      text-align: center; padding: 5px 1px; font-size: .78rem; cursor: pointer;
      border-radius: 50%; color: #111827; transition: background .12s, color .12s;
      &:hover { background: #ede9fe; color: #6d28d9; }
      &.hdp-other { color: #d1d5db; }
      &.hdp-today { font-weight: 700; color: #6d28d9; border: 1.5px solid #6d28d9; }
      &.hdp-selected { background: #6d28d9 !important; color: #fff !important; font-weight: 600; }
    }
  `],
})
export class HrmsDatepickerComponent implements ControlValueAccessor {
  @Input() placeholder = 'Select date';

  private cdr = inject(ChangeDetectorRef);
  private el  = inject(ElementRef);

  readonly weekdays = WEEKDAYS;
  value     = '';
  isOpen    = false;
  panelTop  = 0;
  panelLeft = 0;
  viewYear  = new Date().getFullYear();
  viewMonth = new Date().getMonth();

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  // ── ControlValueAccessor ──────────────────────────────────────────────────
  writeValue(v: string | null): void {
    this.value = v || '';
    if (v) { const d = new Date(v); this.viewYear = d.getFullYear(); this.viewMonth = d.getMonth(); }
    this.cdr.markForCheck();
  }
  registerOnChange(fn: any): void  { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  // ── Display ───────────────────────────────────────────────────────────────
  get displayValue(): string {
    if (!this.value) return '';
    const d = new Date(this.value + 'T00:00:00');
    return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
  }

  get monthLabel(): string { return `${MONTHS[this.viewMonth]} ${this.viewYear}`; }

  get cells(): Cell[] {
    const today = new Date(); today.setHours(0,0,0,0);
    const firstWeekDay = new Date(this.viewYear, this.viewMonth, 1).getDay();
    const daysInMonth  = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const daysInPrev   = new Date(this.viewYear, this.viewMonth, 0).getDate();
    const result: Cell[] = [];

    const pad = (n: number) => String(n).padStart(2,'0');

    const make = (day: number, month: number, year: number, other: boolean): Cell => {
      const dt = new Date(year, month, day); dt.setHours(0,0,0,0);
      const m  = month < 0 ? 11 : month > 11 ? 0 : month;
      const y  = month < 0 ? year - 1 : month > 11 ? year + 1 : year;
      const dateStr = `${y}-${pad(m + 1)}-${pad(day)}`;
      return { day, month: m, year: y, otherMonth: other,
               isToday: dt.getTime() === today.getTime(),
               isSelected: dateStr === this.value, dateStr };
    };

    for (let i = 0; i < firstWeekDay; i++)
      result.push(make(daysInPrev - firstWeekDay + i + 1, this.viewMonth - 1, this.viewYear, true));
    for (let d = 1; d <= daysInMonth; d++)
      result.push(make(d, this.viewMonth, this.viewYear, false));
    let nx = 1;
    while (result.length < 42)
      result.push(make(nx++, this.viewMonth + 1, this.viewYear, true));

    return result;
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  toggle(): void {
    if (!this.isOpen) {
      this.calcPosition();
      this.onTouched();
      this.isOpen = true;
    } else {
      this.isOpen = false;
    }
    this.cdr.markForCheck();
  }

  /**
   * Calculate fixed-position coordinates for the panel.
   * Opens ABOVE the input by default; falls back to below if not enough room.
   * Adjusts left to prevent right-edge overflow.
   */
  private calcPosition(): void {
    const host = this.el.nativeElement as HTMLElement;
    const rect = host.getBoundingClientRect();
    const PW = 260;   // panel width
    const PH = 278;   // approx panel height (header+weekdays+6-row grid)

    // Horizontal: align to input's left; flip if it would overflow right edge
    let left = rect.left;
    if (left + PW > window.innerWidth - 8) left = rect.right - PW;
    this.panelLeft = Math.max(8, left);

    // Vertical: prefer above the input; fall back to below if no room
    const topAbove = rect.top - PH - 6;
    this.panelTop  = topAbove >= 8 ? topAbove : rect.bottom + 6;
  }

  prevMonth(): void {
    if (this.viewMonth === 0) { this.viewMonth = 11; this.viewYear--; }
    else this.viewMonth--;
    this.cdr.markForCheck();
  }

  nextMonth(): void {
    if (this.viewMonth === 11) { this.viewMonth = 0; this.viewYear++; }
    else this.viewMonth++;
    this.cdr.markForCheck();
  }

  pick(c: Cell): void {
    this.value = c.dateStr;
    this.onChange(this.value);
    this.isOpen = false;
    this.cdr.markForCheck();
  }

  clear(e: MouseEvent): void {
    e.stopPropagation();
    this.value = '';
    this.onChange('');
    this.isOpen = false;
    this.cdr.markForCheck();
  }

  /**
   * Close when pressing down anywhere outside this component.
   * Uses mousedown (fires before click) so it catches all interaction types.
   * The fixed-position panel is still a DOM child of this host, so contains()
   * correctly returns true for clicks inside the panel.
   */
  @HostListener('document:mousedown', ['$event'])
  onDocMousedown(e: MouseEvent): void {
    if (this.isOpen && !(this.el.nativeElement as HTMLElement).contains(e.target as Node)) {
      this.isOpen = false;
      this.cdr.markForCheck();
    }
  }
}
