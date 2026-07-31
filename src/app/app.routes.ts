import { Routes } from '@angular/router';
import { HrmsAuthGuard } from '../HRMS/hrms-auth.guard';

export const routes: Routes = [
  {
    path: 'hrms-login',
    loadComponent: () => import('../HRMS/hrms-login/hrms-login.component').then(m => m.HrmsLoginComponent)
  },
  {
    path: 'hrms',
    loadComponent: () => import('../HRMS/hrms-shell/hrms-shell.component').then(m => m.HrmsShellComponent),
    canActivate: [HrmsAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',     loadComponent: () => import('../HRMS/hrms-dashboard/hrms-dashboard.component').then(m => m.HrmsDashboardComponent) },
      { path: 'employees',     loadComponent: () => import('../HRMS/employees/employees.component').then(m => m.EmployeesComponent) },
      { path: 'employees/new', loadComponent: () => import('../HRMS/employee-details/employee-details.component').then(m => m.EmployeeDetailsComponent) },
      { path: 'employees/:id', loadComponent: () => import('../HRMS/employee-details/employee-details.component').then(m => m.EmployeeDetailsComponent) },
      { path: 'hierarchy',     loadComponent: () => import('../HRMS/hrms-dashboard/hrms-dashboard.component').then(m => m.HrmsDashboardComponent) },
      { path: 'reports',       loadComponent: () => import('../HRMS/hrms-dashboard/hrms-dashboard.component').then(m => m.HrmsDashboardComponent) },
      { path: 'approvals',     loadComponent: () => import('../HRMS/hrms-dashboard/hrms-dashboard.component').then(m => m.HrmsDashboardComponent) },
    ]
  },
  { path: '', redirectTo: 'hrms-login', pathMatch: 'full' },
  {
  path: 'page-not-found',
  loadComponent: () =>
    import('../HRMS/page-not-found/page-not-found.component')
      .then(m => m.PageNotFoundComponent)
},
{
  path: 'server-error',
  loadComponent: () =>
    import('../HRMS/server-error/server-error.component')
      .then(m => m.ServerErrorComponent)
},
{
  path: '**',
  redirectTo: 'page-not-found'
}
];
