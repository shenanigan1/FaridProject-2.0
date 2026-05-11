import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { apiBaseUrlInterceptor } from './core/http/api-base-url.interceptor';

import {
  provideLucideIcons,
  LucideMail,
  LucideLock,
  LucideLogIn,
  LucideTruck,
} from '@lucide/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiBaseUrlInterceptor, authInterceptor])),
    provideLucideIcons(
      LucideMail,
      LucideLock,
      LucideLogIn,
      LucideTruck,
    ),
  ],
};
