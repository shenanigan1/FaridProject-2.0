// src/app/core/auth/auth.interceptor.ts
import { inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

  // Ne pas ajouter Authorization sur login/refresh
  const isAuthEndpoint =
    req.url.includes('/api/auth/login') || req.url.includes('/api/auth/refresh');

  const access = tokenStorage.getAccessToken();

  const authReq =
    !isAuthEndpoint && access
      ? req.clone({ setHeaders: { Authorization: `Bearer ${access}` } })
      : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) return throwError(() => err);

      // 401: on tente refresh (si on a un refresh token)
      if (err.status === 401 && !isAuthEndpoint) {
        const refresh = tokenStorage.getRefreshToken();
        if (!refresh) {
          tokenStorage.clear();
          return throwError(() => err);
        }

        return authService.refresh(refresh).pipe(
          switchMap((res) => {
            tokenStorage.saveTokens(res.access, res.refresh ?? refresh, tokenStorage.getRememberMe());
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.access}` },
            });
            return next(retryReq);
          }),
          catchError((refreshErr) => {
            tokenStorage.clear();
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => err);
    })
  );
};
