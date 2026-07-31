import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class HrmsAuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    if (localStorage.getItem('hrmsToken')) return true;
    this.router.navigate(['/hrms-login'], { replaceUrl: true });
    return false;
  }
}
