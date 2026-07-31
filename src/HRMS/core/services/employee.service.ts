import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HRMS_API_BASE } from '../constants/api.constants';
import { EmployeeListPayload } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly base = HRMS_API_BASE;

  getEmployeeList(payload: EmployeeListPayload): Observable<any> {
    return this.http.post<any>(`${this.base}/employee/list`, payload);
  }
}
