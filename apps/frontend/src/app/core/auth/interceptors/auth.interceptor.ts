import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from 'src/app/core/auth/services/auth.service';
import { TokenStorageService } from 'src/app/core/auth/services/token-storage.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

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

      if (err.status === 401 && !isAuthEndpoint) {
        const refresh = tokenStorage.getRefreshToken();
        if (!refresh) {
          tokenStorage.clear();
          return throwError(() => err);
        }

        return authService.refresh(refresh).pipe(
          switchMap((res) => {
            tokenStorage.saveTokens(
              res.access,
              res.refresh ?? refresh,
              tokenStorage.getRememberMe()
            );

            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.access}` },
            });

            return next(retryReq);
          }),
          catchError((refreshErr: unknown) => {
            tokenStorage.clear();
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => err);
    })
  );
};
