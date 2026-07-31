import { Injectable, inject, isDevMode } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HRMS_API_BASE } from '../constants/api.constants';
import { ToastService } from '../services/toast.service';
import { HrmsLoadingService } from '../services/loading.service';

/** Endpoints that must NOT receive an Authorization header. */
const NO_TOKEN_URLS = ['/auth/login'];

@Injectable()
export class HrmsHttpInterceptor implements HttpInterceptor {
  private readonly router  = inject(Router);
  private readonly toast   = inject(ToastService);
  private readonly loading = inject(HrmsLoadingService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Pass through requests that are not directed at the HRMS backend.
    if (!req.url.startsWith(HRMS_API_BASE)) {
      return next.handle(req);
    }

    const skipToken = NO_TOKEN_URLS.some(p => req.url.includes(p));
    const outReq    = skipToken ? req : this.withAuthHeader(req);

    this.loading.increment();

    return next.handle(outReq).pipe(
      finalize(() => this.loading.decrement()),
      catchError((err: HttpErrorResponse) => {
        if (isDevMode()) {
          console.error('[HRMS Interceptor]', err.status, req.url, err);
        }
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  private withAuthHeader(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.readToken();
    return token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;
  }

  private readToken(): string | null {
    try {
      const raw = localStorage.getItem('hrmsToken');
      return raw ? (JSON.parse(raw)?.token ?? null) : null;
    } catch { return null; }
  }

  private handleError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 0:
        this.toast.error('Network error — please check your connection.');
       // this.router.navigate(['/server-error'], { replaceUrl: true });
        break;

      case 400:
        this.toast.error(err.error?.message || 'Invalid request. Please check your input.');
        break;

      case 401:
        this.toast.error('Session expired. Please log in again.');
        localStorage.removeItem('hrmsToken');
        this.router.navigate(['/hrms-login'], { replaceUrl: true });
        break;

      case 403:
        this.toast.error("Access denied. You don't have permission for this action.");
        break;

      case 404:
        this.toast.warning('Requested resource not found.');
        break;

      case 500:
      case 502:
      case 503:
        this.toast.error('Server error. Please try again later.');
      //  this.router.navigate(['/server-error'], { replaceUrl: true });
        break;

      default:
        if (err.status > 0) {
          this.toast.error(`Unexpected error (${err.status}). Please try again.`);
        }
    }
  }
}
