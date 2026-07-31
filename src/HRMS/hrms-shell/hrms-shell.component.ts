import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastComponent } from '../shared/components/toast/toast.component';
import { HrmsLoadingService } from '../core/services/loading.service';

@Component({
  selector: 'app-hrms-shell',
  standalone: true,
  imports: [RouterModule, CommonModule, ToastComponent],
  templateUrl: './hrms-shell.component.html',
  styleUrl: './hrms-shell.component.scss',
})
export class HrmsShellComponent {
  readonly loadingSvc = inject(HrmsLoadingService);
  private readonly router = inject(Router);

  sidebarOpen       = true;
  showLogoutConfirm = false;

  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar(): void  { this.sidebarOpen = false; }

  private get userData(): any {
    try { return JSON.parse(localStorage.getItem('hrmsToken') || '{}'); }
    catch { return {}; }
  }

  get userName(): string    { return this.userData.EMPNAME || 'HRMS User'; }
  get userEmpId(): string   { return this.userData.EMPID ? `EMP #${this.userData.EMPID}` : 'HR System'; }
  get userPic(): string     { return this.userData.PIC || ''; }
  get businessUnit(): string { return this.userData.BUNAME || 'HHC - Corporate'; }

  get userInitials(): string {
    return (this.userData.EMPNAME || 'HU')
      .split(' ').filter(Boolean).slice(0, 2)
      .map((n: string) => n[0]).join('').toUpperCase();
  }

  get userAvatarColor(): string {
    const colors = ['#7c3aed','#2563eb','#059669','#dc2626','#d97706','#0891b2','#9333ea','#16a34a'];
    return colors[(Number(this.userData.EMPID) || 0) % colors.length];
  }

  // Expose loading signal as a getter so the template reads it reactively
  get isLoading(): boolean { return this.loadingSvc.active(); }

  confirmLogout(): void { this.showLogoutConfirm = true; }
  cancelLogout(): void  { this.showLogoutConfirm = false; }

  logout(): void {
    localStorage.removeItem('hrmsToken');
    this.showLogoutConfirm = false;
    this.router.navigate(['/hrms-login'], { replaceUrl: true });
  }
}
