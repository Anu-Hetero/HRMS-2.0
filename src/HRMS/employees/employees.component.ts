import {
  ChangeDetectionStrategy, Component, DestroyRef,
  OnInit, inject, signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MasterDataService } from '../core/services/master-data.service';
import { EmployeeService } from '../core/services/employee.service';
import {
  DeptOption, DivisionOption, Employee, EmploymentOption,
  GenderOption, StatusOption
} from '../core/models/employee.model';

export type { Employee };

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeesComponent implements OnInit {
  private readonly masterData  = inject(MasterDataService);
  private readonly employeeSvc = inject(EmployeeService);
  private readonly router      = inject(Router);
  private readonly destroyRef  = inject(DestroyRef);

  // ─── Private signals (reactive source of truth) ───────────────────────────
  private readonly _searchQuery     = signal('');
  private readonly _openDropdown    = signal('');
  private readonly _isLoading       = signal(false);
  private readonly _filtersLoading  = signal(false);
  private readonly _currentPage     = signal(1);
  private readonly _pageSize        = signal(20);
  private readonly _totalRecords    = signal(0);
  private readonly _rawEmployees    = signal<any[]>([]);
  private readonly _tableColumns    = signal<string[]>([]);

  private readonly _genderFilter     = signal<number | null>(null);
  private readonly _employmentFilter = signal<number | null>(null);
  private readonly _buFilter         = signal<number | null>(null);
  private readonly _deptFilter       = signal<number | null>(null);
  private readonly _statusFilter     = signal<number | null>(null);

  private readonly _genderSearch     = signal('');
  private readonly _employmentSearch = signal('');
  private readonly _buSearch         = signal('');
  private readonly _deptSearch       = signal('');
  private readonly _statusSearch     = signal('');

  private readonly _genderOptions     = signal<GenderOption[]>([]);
  private readonly _employmentOptions = signal<EmploymentOption[]>([]);
  private readonly _buOptions         = signal<DivisionOption[]>([]);
  private readonly _deptOptions       = signal<DeptOption[]>([]);
  private readonly _statusOptions     = signal<StatusOption[]>([]);

  // ─── Public getters (template reads these, which read signals — tracked) ──
  get searchQuery(): string         { return this._searchQuery(); }
  set searchQuery(v: string)        { this._searchQuery.set(v); }
  get openDropdown(): string        { return this._openDropdown(); }
  get isLoading(): boolean          { return this._isLoading(); }
  get filtersLoading(): boolean     { return this._filtersLoading(); }
  get currentPage(): number         { return this._currentPage(); }
  get pageSize(): number            { return this._pageSize(); }
  set pageSize(v: number)           { this._pageSize.set(v); }
  get totalRecords(): number        { return this._totalRecords(); }
  get rawEmployees(): any[]         { return this._rawEmployees(); }
  get tableColumns(): string[]      { return this._tableColumns(); }

  get genderFilter(): number | null     { return this._genderFilter(); }
  get employmentFilter(): number | null { return this._employmentFilter(); }
  get buFilter(): number | null         { return this._buFilter(); }
  get deptFilter(): number | null       { return this._deptFilter(); }
  get statusFilter(): number | null     { return this._statusFilter(); }

  get genderSearch(): string     { return this._genderSearch(); }
  set genderSearch(v: string)    { this._genderSearch.set(v); }
  get employmentSearch(): string { return this._employmentSearch(); }
  set employmentSearch(v: string){ this._employmentSearch.set(v); }
  get buSearch(): string         { return this._buSearch(); }
  set buSearch(v: string)        { this._buSearch.set(v); }
  get deptSearch(): string       { return this._deptSearch(); }
  set deptSearch(v: string)      { this._deptSearch.set(v); }
  get statusSearch(): string     { return this._statusSearch(); }
  set statusSearch(v: string)    { this._statusSearch.set(v); }

  get genderOptions(): GenderOption[]         { return this._genderOptions(); }
  get employmentOptions(): EmploymentOption[] { return this._employmentOptions(); }
  get buOptions(): DivisionOption[]           { return this._buOptions(); }
  get deptOptions(): DeptOption[]             { return this._deptOptions(); }
  get statusOptions(): StatusOption[]         { return this._statusOptions(); }

  // ─── Derived getters (computed from signals via other getters) ─────────────
  get filteredGenderOptions()     { return this.genderOptions.filter(g     => g.genderName.toLowerCase().includes(this.genderSearch.toLowerCase())); }
  get filteredEmploymentOptions() { return this.employmentOptions.filter(e => e.employmentName.toLowerCase().includes(this.employmentSearch.toLowerCase())); }
  get filteredBuOptions()         { return this.buOptions.filter(b         => b.divisionName.toLowerCase().includes(this.buSearch.toLowerCase())); }
  get filteredDeptOptions()       { return this.deptOptions.filter(d       => d.deptName.toLowerCase().includes(this.deptSearch.toLowerCase())); }
  get filteredStatusOptions()     { return this.statusOptions.filter(s     => s.statusName.toLowerCase().includes(this.statusSearch.toLowerCase())); }

  get genderFilterName():     string { return this.genderOptions.find(g     => g.genderId         === this.genderFilter)?.genderName         || ''; }
  get employmentFilterName(): string { return this.employmentOptions.find(e => e.employmentId      === this.employmentFilter)?.employmentName  || ''; }
  get buFilterName():         string { return this.buOptions.find(b         => b.divisionId         === this.buFilter)?.divisionName            || ''; }
  get deptFilterName():       string { return this.deptOptions.find(d       => d.deptId             === this.deptFilter)?.deptName              || ''; }
  get statusFilterName():     string { return this.statusOptions.find(s     => s.statusId           === this.statusFilter)?.statusName          || ''; }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this._pageSize()));
  }

  get allPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  get pageNumbers(): number[] {
    const total = this.totalPages, cur = this.currentPage;
    let start = Math.max(1, cur - 2);
    let end   = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  get showingText(): string {
    if (this.totalRecords === 0) return 'No employees found';
    const from = (this.currentPage - 1) * this.pageSize + 1;
    const to   = Math.min(this.currentPage * this.pageSize, this.totalRecords);
    return `Showing ${from}–${to} of ${this.totalRecords}`;
  }

  get activeFilterCount(): number {
    return [this.genderFilter, this.employmentFilter, this.buFilter, this.deptFilter, this.statusFilter]
      .filter(v => v !== null).length;
  }

  readonly pageSizeOptions = [20, 50, 100];

  private readonly avatarColors = [
    '#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706',
    '#0891b2', '#9333ea', '#16a34a', '#c2410c', '#0f766e',
  ];

  private get loggedInEmpId(): number {
    try { return JSON.parse(localStorage.getItem('hrmsToken') || '{}').EMPID || 0; }
    catch { return 0; }
  }

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadEmployees();
  }

  private buildPayload() {
    return {
      user:           this.loggedInEmpId,
      division:       this._buFilter(),
      gender:         this._genderFilter(),
      department:     this._deptFilter(),
      employmentType: this._employmentFilter(),
      status:         this._statusFilter(),
      pageNumber:     this._currentPage(),
      pageSize:       this._pageSize(),
      search:         this._searchQuery().trim() || null,
    };
  }

  loadEmployees(): void {
    this._isLoading.set(true);
    this.employeeSvc.getEmployeeList(this.buildPayload())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this._isLoading.set(false);
          const list: any[] =
            res?.empData || res?.employees || res?.data || res?.content ||
            (Array.isArray(res) ? res : []);
          this._totalRecords.set(
            res?.count ?? res?.totalRecords ?? res?.totalCount ??
            res?.total ?? res?.totalElements ?? list.length
          );
          if (list.length > 0) {
            this._tableColumns.set(Object.keys(list[0]).filter(k => k !== 'Pic' && k !== 'Emp ID'));
          }
          this._rawEmployees.set(list);
          this.scrollActivePage();
        },
        error: () => this._isLoading.set(false),
      });
  }

  private loadFilterOptions(): void {
    this._filtersLoading.set(true);
    forkJoin({
      genders:     this.masterData.getGenders(),
      employments: this.masterData.getEmployments(),
      bus:         this.masterData.getUserBu(this.loggedInEmpId),
      depts:       this.masterData.getDepartments(),
      statuses:    this.masterData.getStatuses(),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this._genderOptions.set(res.genders      || []);
          this._employmentOptions.set(res.employments || []);
          this._buOptions.set(res.bus              || []);
          this._deptOptions.set(res.depts          || []);
          this._statusOptions.set(res.statuses     || []);
          this._filtersLoading.set(false);
        },
        error: () => this._filtersLoading.set(false),
      });
  }

  // ── Avatar helpers ────────────────────────────────────────────────────────
  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(index: number): string {
    return this.avatarColors[index % this.avatarColors.length];
  }

  // ── Dropdown controls ─────────────────────────────────────────────────────
  toggleDropdown(name: string): void { this._openDropdown.set(this._openDropdown() === name ? '' : name); }
  closeDropdown(): void              { this._openDropdown.set(''); }

  setFilter(type: string, value: number | null): void {
    switch (type) {
      case 'gender':     this._genderFilter.set(value);     this._genderSearch.set('');     break;
      case 'employment': this._employmentFilter.set(value);  this._employmentSearch.set(''); break;
      case 'bu':         this._buFilter.set(value);          this._buSearch.set('');         break;
      case 'dept':       this._deptFilter.set(value);        this._deptSearch.set('');       break;
      case 'status':     this._statusFilter.set(value);      this._statusSearch.set('');     break;
    }
    this._openDropdown.set('');
  }

  // ── Filter actions ────────────────────────────────────────────────────────
  hasActiveFilters(): boolean { return this.activeFilterCount > 0; }
  onSearch(): void { /* search applied on Apply click */ }
  applyFilters(): void { this._currentPage.set(1); this.loadEmployees(); }

  clearFilter(key: string): void {
    switch (key) {
      case 'gender': this._genderFilter.set(null);     break;
      case 'type':   this._employmentFilter.set(null); break;
      case 'bu':     this._buFilter.set(null);         break;
      case 'dept':   this._deptFilter.set(null);       break;
      case 'status': this._statusFilter.set(null);     break;
    }
    this._currentPage.set(1);
    this.loadEmployees();
  }

  resetFilters(): void {
    this._genderFilter.set(null);    this._employmentFilter.set(null);
    this._buFilter.set(null);        this._deptFilter.set(null);
    this._statusFilter.set(null);
    this._currentPage.set(1);
    this.loadEmployees();
  }

  clearAllFilters(): void { this._searchQuery.set(''); this.resetFilters(); }

  // ── Pagination ────────────────────────────────────────────────────────────
  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) { this._currentPage.set(p); this.loadEmployees(); }
  }
  prevPage(): void { if (this.currentPage > 1)              { this._currentPage.update(p => p - 1); this.loadEmployees(); } }
  nextPage(): void { if (this.currentPage < this.totalPages) { this._currentPage.update(p => p + 1); this.loadEmployees(); } }
  onPageSizeChange(): void { this._currentPage.set(1); this.loadEmployees(); }

  private scrollActivePage(): void {
    setTimeout(() => {
      const btn = document.querySelector('.pn-btn.pn-active') as HTMLElement;
      btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 50);
  }

  viewEmployee(emp: any): void {
    sessionStorage.setItem('selectedEmployee', JSON.stringify(emp));
    const empId = emp['Emp ID'] || emp.EMPID || emp.empId || '';
    this.router.navigate(['/hrms/employees', empId]);
  }
}
