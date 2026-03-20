import { Injectable, computed, signal } from '@angular/core';

import { CandidateAuthPayload, CandidateUser } from '@auth/models/candidate-user.model';

const SESSION_STORAGE_KEY = 'candidate-session';

@Injectable({
  providedIn: 'root',
})
export class CandidateAuthService {
  private readonly currentUserSignal = signal<CandidateUser | null>(this.readUserFromStorage());

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  login(payload: CandidateAuthPayload): void {
    const existingUser = this.currentUserSignal();

    const user: CandidateUser = {
      firstName: existingUser?.firstName ?? payload.firstName ?? 'Candidate',
      lastName: existingUser?.lastName ?? payload.lastName ?? 'User',
      email: payload.email,
      phone: existingUser?.phone ?? payload.phone ?? '',
    };

    this.persistUser(user);
  }

  signUp(payload: CandidateAuthPayload): void {
    const user: CandidateUser = {
      firstName: payload.firstName ?? 'Candidate',
      lastName: payload.lastName ?? 'User',
      email: payload.email,
      phone: payload.phone ?? '',
    };

    this.persistUser(user);
  }

  private persistUser(user: CandidateUser): void {
    this.currentUserSignal.set(user);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  }

  private readUserFromStorage(): CandidateUser | null {
    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as CandidateUser;
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }
}
