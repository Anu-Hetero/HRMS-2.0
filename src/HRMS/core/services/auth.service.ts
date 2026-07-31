import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HRMS_API_BASE } from '../constants/api.constants';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = HRMS_API_BASE;

  login(payload: { employeeId: number; password: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/login`, payload);
  }
}
