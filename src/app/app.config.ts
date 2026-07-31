import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { HrmsHttpInterceptor } from '../HRMS/core/interceptors/hrms-http.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HrmsHttpInterceptor,
      multi: true
    },
    provideHttpClient(withInterceptorsFromDi())
  ]
};
