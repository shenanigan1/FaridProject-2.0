import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '@core/auth/services/auth.service';
import { TokenStorageService } from '@core/auth/services/token-storage.service';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

  const isCandidateCreationRequest =
    request.method === 'POST' && /\/api\/candidates\/?$/.test(request.url);

  const isAuthRequest =
    request.url.includes('/api/auth/login') ||
    request.url.includes('/api/auth/refresh') ||
    isCandidateCreationRequest;

  const accessToken = tokenStorage.getAccessToken();

  const authenticatedRequest =
    !isAuthRequest && accessToken
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status !== 401 || isAuthRequest) {
        return throwError(() => error);
      }

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clear();
        return throwError(() => error);
      }

      return authService.refresh(refreshToken).pipe(
        switchMap((response) => {
          tokenStorage.saveTokens(response.access, response.refresh);

          const retriedRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${response.access}`,
            },
          });

          return next(retriedRequest);
        }),
        catchError((refreshError: unknown) => {
          tokenStorage.clear();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
