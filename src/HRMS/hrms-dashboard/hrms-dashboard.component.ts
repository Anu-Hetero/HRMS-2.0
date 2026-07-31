import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface StatCard {
  label: string;
  value: number | string;
  sub?: string;
  icon: string;
  color: string;
  bg: string;
  route?: string;
}

interface RecentEmployee {
  id: number;
  empId: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  designation: string;
  department: string;
  doj: string;
  status: 'Active' | 'In-Active';
}

interface DeptStat {
  name: string;
  count: number;
  pct: number;
  color: string;
}

@Component({
  selector: 'app-hrms-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hrms-dashboard.component.html',
  styleUrl: './hrms-dashboard.component.scss',
})
export class HrmsDashboardComponent {

  stats: StatCard[] = [
    { label: 'Total Employees', value: 4500, sub: '+12 this month', icon: 'users',       color: '#6d28d9', bg: '#ede9fe', route: '/hrms/employees' },
    { label: 'Active',          value: 4211, sub: '93.6% of total',  icon: 'check',       color: '#15803d', bg: '#dcfce7' },
    { label: 'In-Active',       value: 289,  sub: '6.4% of total',   icon: 'pause',       color: '#c2410c', bg: '#fff3e0' },
    { label: 'Departments',     value: 9,    sub: 'across 3 units',  icon: 'grid',        color: '#0891b2', bg: '#e0f2fe' },
    { label: 'New This Month',  value: 12,   sub: '↑ 4 from last',   icon: 'user-plus',   color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'On Leave Today',  value: 38,   sub: 'pending approvals',icon: 'calendar',   color: '#d97706', bg: '#fef3c7' },
  ];

  recentEmployees: RecentEmployee[] = [
    { id: 11, empId: 'EM011', fullName: 'Neha Agarwal',    initials: 'NA', avatarColor: '#9333ea', designation: 'HR Recruiter',    department: 'Human Resources', doj: '11 Apr 2023', status: 'Active' },
    { id: 7,  empId: 'EM007', fullName: 'Sneha Kulkarni',  initials: 'SK', avatarColor: '#2563eb', designation: 'Content Writer',   department: 'Marketing',       doj: '10 Feb 2023', status: 'Active' },
    { id: 4,  empId: 'EM004', fullName: 'Pooja Patel',     initials: 'PP', avatarColor: '#dc2626', designation: 'HR Executive',     department: 'Human Resources', doj: '18 Nov 2021', status: 'Active' },
    { id: 2,  empId: 'EM002', fullName: 'Ananya Reddy',    initials: 'AR', avatarColor: '#d97706', designation: 'UI/UX Designer',   department: 'IT',              doj: '02 Jan 2022', status: 'Active' },
    { id: 1,  empId: 'EM001', fullName: 'Rahul Sharma',    initials: 'RS', avatarColor: '#7c3aed', designation: 'Software Engineer',department: 'IT',              doj: '15 Jun 2021', status: 'Active' },
  ];

  deptStats: DeptStat[] = [
    { name: 'IT',              count: 1240, pct: 28, color: '#6d28d9' },
    { name: 'Human Resources', count: 520,  pct: 12, color: '#2563eb' },
    { name: 'Operations',      count: 860,  pct: 19, color: '#0891b2' },
    { name: 'Finance',         count: 410,  pct: 9,  color: '#d97706' },
    { name: 'Marketing',       count: 390,  pct: 9,  color: '#dc2626' },
    { name: 'Others',          count: 1080, pct: 23, color: '#6b7280' },
  ];

  empTypeBreakdown = [
    { label: 'Permanent', count: 3150, pct: 70, color: '#6d28d9' },
    { label: 'Contract',  count: 945,  pct: 21, color: '#0891b2' },
    { label: 'Temporary', count: 405,  pct: 9,  color: '#d97706' },
  ];

  quickActions = [
    { label: 'Add Employee',    icon: 'user-plus',  action: () => this.goTo('/hrms/employees/new') },
    { label: 'All Employees',   icon: 'users',      action: () => this.goTo('/hrms/employees') },
    { label: 'Pending Approvals',icon: 'check-sq',  action: () => {} },
    { label: 'Reports',         icon: 'bar-chart',  action: () => {} },
  ];

  constructor(private router: Router) {}

  goTo(path: string): void { this.router.navigate([path]); }

  viewEmployee(id: number): void { this.router.navigate(['/hrms/employees', id]); }

  viewAll(): void { this.router.navigate(['/hrms/employees']); }
}
