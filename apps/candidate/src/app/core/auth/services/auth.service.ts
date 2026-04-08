import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';

import { environment } from '@env/environment';

import { TokenStorageService } from '@core/auth/services/token-storage.service';

export interface AuthenticatedCandidate {
  candidateId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface LoginResponseDto {
  access: string;
  refresh: string;
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
}

interface CandidateDto {
  id: number;
  user: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly candidateProfileKey = 'candidate_profile';

  private readonly authBaseUrl = `${environment.apiBaseUrl}/api/auth`;
  private readonly candidatesUrl = `${environment.apiBaseUrl}/api/candidates/`;

  isAuthenticated(): boolean {
    return this.tokenStorage.isAuthenticated();
  }

  signIn(payload: SignInPayload): Observable<AuthenticatedCandidate> {
    return this.http
      .post<LoginResponseDto>(`${this.authBaseUrl}/login/`, {
        email: payload.email,
        password: payload.password,
      })
      .pipe(
        switchMap((response) => {
          this.persistTokens(response.access, response.refresh);

          return this.resolveCandidateProfile(payload.email, {
            firstName: response.user?.first_name ?? '',
            lastName: response.user?.last_name ?? '',
            phone: '',
          });
        }),
        map((candidate) => {
          this.saveAuthenticatedCandidate(candidate);
          return candidate;
        }),
        catchError((error: unknown) => this.mapAuthError(error)),
      );
  }

  signUp(payload: SignUpPayload): Observable<AuthenticatedCandidate> {
    return this.http
      .post<CandidateDto>(this.candidatesUrl, {
        user: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email,
          phone: payload.phone,
          password: payload.password,
        },
      })
      .pipe(
        switchMap((createdCandidate) =>
          this.signIn({
            email: payload.email,
            password: payload.password,
          }).pipe(
            map((signedInCandidate) => ({
              ...signedInCandidate,
              candidateId: createdCandidate.id,
              firstName: signedInCandidate.firstName || payload.firstName,
              lastName: signedInCandidate.lastName || payload.lastName,
              phone: signedInCandidate.phone || payload.phone,
            })),
          ),
        ),
        map((candidate) => {
          this.saveAuthenticatedCandidate(candidate);
          return candidate;
        }),
        catchError((error: unknown) => this.mapAuthError(error)),
      );
  }

  getAuthenticatedCandidate(): AuthenticatedCandidate | null {
    const rawCandidate = localStorage.getItem(this.candidateProfileKey);
    if (!rawCandidate) {
      return null;
    }

    try {
      return JSON.parse(rawCandidate) as AuthenticatedCandidate;
    } catch {
      localStorage.removeItem(this.candidateProfileKey);
      return null;
    }
  }

  saveAuthenticatedCandidate(candidate: AuthenticatedCandidate): void {
    localStorage.setItem(this.candidateProfileKey, JSON.stringify(candidate));
  }

  logout(): void {
    this.tokenStorage.clear();
    localStorage.removeItem(this.candidateProfileKey);
  }

  refresh(refreshToken: string): Observable<{ access: string; refresh?: string }> {
    return this.http.post<{ access: string; refresh?: string }>(`${this.authBaseUrl}/refresh/`, {
      refresh: refreshToken,
    });
  }

  private resolveCandidateProfile(
    email: string,
    fallback: { firstName: string; lastName: string; phone: string },
  ): Observable<AuthenticatedCandidate> {
    return this.http.get<CandidateDto[]>(this.candidatesUrl).pipe(
      map((candidates) => {
        const candidate = candidates.find(
          (item) => item.user.email.toLowerCase() === email.toLowerCase(),
        );

        if (!candidate) {
          return {
            candidateId: Date.now(),
            email,
            firstName: fallback.firstName,
            lastName: fallback.lastName,
            phone: fallback.phone,
          };
        }

        return {
          candidateId: candidate.id,
          email: candidate.user.email,
          firstName: candidate.user.first_name,
          lastName: candidate.user.last_name,
          phone: candidate.user.phone ?? '',
        };
      }),
      catchError(() =>
        of({
          candidateId: Date.now(),
          email,
          firstName: fallback.firstName,
          lastName: fallback.lastName,
          phone: fallback.phone,
        }),
      ),
    );
  }

  private persistTokens(accessToken: string, refreshToken: string): void {
    this.tokenStorage.saveTokens(accessToken, refreshToken);
  }

  private mapAuthError(error: unknown): Observable<never> {
    if (!(error instanceof HttpErrorResponse)) {
      return throwError(() => 'Unexpected authentication error.');
    }

    if (error.status === 0) {
      return throwError(() => 'Cannot reach authentication service.');
    }

    const detail = this.extractErrorDetail(error.error);
    return throwError(() => detail || 'Authentication failed.');
  }

  private extractErrorDetail(errorBody: unknown): string | null {
    if (typeof errorBody === 'string') {
      return errorBody;
    }

    if (Array.isArray(errorBody)) {
      const first = errorBody[0];
      return typeof first === 'string' ? first : this.extractErrorDetail(first);
    }

    if (!errorBody || typeof errorBody !== 'object') {
      return null;
    }

    const typedBody = errorBody as Record<string, unknown>;

    if (typeof typedBody['detail'] === 'string') {
      return typedBody['detail'];
    }

    for (const value of Object.values(typedBody)) {
      const extractedMessage = this.extractErrorDetail(value);
      if (extractedMessage) {
        return extractedMessage;
      }
    }

    return null;
  }
}
