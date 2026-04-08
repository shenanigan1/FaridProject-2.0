import { Injectable } from '@angular/core';

export interface AuthenticatedCandidate {
  candidateId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface CandidateAuthPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'access_token';
  private readonly candidateProfileKey = 'candidate_profile';

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  authenticate(payload: CandidateAuthPayload): AuthenticatedCandidate {
    this.setToken(`candidate-token-${Date.now()}`);

    const currentProfile = this.getAuthenticatedCandidate();
    const fullName = this.extractNameFromEmail(payload.email);

    const candidateProfile: AuthenticatedCandidate = {
      candidateId: currentProfile?.candidateId ?? Date.now(),
      email: payload.email,
      firstName: payload.firstName?.trim() || currentProfile?.firstName || fullName.firstName,
      lastName: payload.lastName?.trim() || currentProfile?.lastName || fullName.lastName,
      phone: payload.phone?.trim() || currentProfile?.phone || '',
    };

    this.saveAuthenticatedCandidate(candidateProfile);
    return candidateProfile;
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
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.candidateProfileKey);
  }

  private extractNameFromEmail(email: string): {
    firstName: string;
    lastName: string;
  } {
    const [localPart = 'candidate'] = email.split('@');
    const chunks = localPart.split(/[._-]/).filter(Boolean);

    return {
      firstName: this.capitalize(chunks[0] ?? 'Candidate'),
      lastName: this.capitalize(chunks[1] ?? 'User'),
    };
  }

  private capitalize(value: string): string {
    if (!value) {
      return '';
    }

    return `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}`;
  }
}
