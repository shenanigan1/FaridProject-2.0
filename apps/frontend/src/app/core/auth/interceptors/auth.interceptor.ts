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
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

  const isLoginEndpoint = req.url.includes('/api/auth/login');
  const isRefreshEndpoint = req.url.includes('/api/auth/refresh');
  const isAuthEndpoint = isLoginEndpoint || isRefreshEndpoint;

  const accessToken = tokenStorage.getAccessToken();

  const authReq =
    !isAuthEndpoint && accessToken
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      if (isLoginEndpoint) {
        return throwError(() => err);
      }

      if (err.status !== 401 || isRefreshEndpoint) {
        return throwError(() => err);
      }

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clear();
        return throwError(() => err);
      }

      return authService.refresh(refreshToken).pipe(
        switchMap((response) => {
          const rememberMe = tokenStorage.getRememberMe();

          tokenStorage.saveTokens(response.access, response.refresh, rememberMe);

          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${response.access}`,
            },
          });

          return next(retryReq);
        }),
        catchError((refreshErr: unknown) => {
          tokenStorage.clear();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
