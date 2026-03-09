import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CandidateAccount,
  CandidateApplication,
  CandidateApi,
  JobApplicationApi,
  JobOffer,
  PositionApi,
} from '../models/candidate.models';

export type ApplyResult = 'applied' | 'duplicate' | 'auth_required' | 'not_found';

const API_BASE_URL = 'http://localhost:8000/api';
const AUTH_BASE_URL = 'http://localhost:8000/api/auth';

@Injectable({ providedIn: 'root' })
export class CandidatePortalService {
  private readonly http = inject(HttpClient);

  private readonly offersSignal = signal<JobOffer[]>([]);
  private readonly currentUserSignal = signal<CandidateAccount | null>(null);
  private readonly applicationsSignal = signal<CandidateApplication[]>([]);
  private readonly candidateIdSignal = signal<number | null>(null);

  readonly offers = this.offersSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly currentApplications = this.applicationsSignal.asReadonly();

  constructor() {
    void this.loadOffers();
  }

  async loadOffers(): Promise<void> {
    const positions = await firstValueFrom(this.http.get<PositionApi[]>(`${API_BASE_URL}/positions/`));
    this.offersSignal.set(
      positions
        .filter((position) => position.is_active)
        .map((position) => ({
          id: position.id,
          title: position.title,
          location: position.location,
          contractType: position.contract_type,
          salaryRange: position.salary ?? 'À définir',
          description: position.description,
          requirements: [position.department].filter(Boolean),
        })),
    );
  }

  async registerAccount(account: CandidateAccount): Promise<boolean> {
    await firstValueFrom(
      this.http.post(`${AUTH_BASE_URL}/register/`, {
        email: account.email,
        password: account.password,
        first_name: account.firstName,
        last_name: account.lastName,
      }),
    );

    await firstValueFrom(
      this.http.post(`${API_BASE_URL}/candidates/`, {
        user: {
          email: account.email,
          first_name: account.firstName,
          last_name: account.lastName,
        },
      }),
    );

    return this.login(account.email, account.password);
  }

  async login(email: string, password: string): Promise<boolean> {
    const response = await firstValueFrom(
      this.http.post<{ access: string; user: { id: number; email: string; first_name: string; last_name: string } }>(
        `${AUTH_BASE_URL}/login/`,
        { email, password },
      ),
    );

    localStorage.setItem('candidate_access_token', response.access);
    this.currentUserSignal.set({
      id: response.user.id,
      email: response.user.email,
      firstName: response.user.first_name,
      lastName: response.user.last_name,
      password: '',
    });

    await this.loadCurrentCandidate();
    await this.loadApplications();
    return true;
  }

  logout(): void {
    localStorage.removeItem('candidate_access_token');
    this.currentUserSignal.set(null);
    this.candidateIdSignal.set(null);
    this.applicationsSignal.set([]);
  }

  getOfferById(offerId: number): JobOffer | undefined {
    return this.offersSignal().find((offer) => offer.id === offerId);
  }

  async applyToOffer(offerId: number, motivation: string): Promise<ApplyResult> {
    const currentUser = this.currentUserSignal();
    if (!currentUser) {
      return 'auth_required';
    }

    const offer = this.getOfferById(offerId);
    if (!offer) {
      return 'not_found';
    }

    const candidateId = this.candidateIdSignal();
    if (!candidateId) {
      await this.loadCurrentCandidate();
    }

    if (!this.candidateIdSignal()) {
      return 'auth_required';
    }

    try {
      await firstValueFrom(
        this.http.post(
          `${API_BASE_URL}/jobapplications/`,
          {
            candidate: this.candidateIdSignal(),
            position: offerId,
            status: 'submitted',
          },
          { headers: this.authHeaders() },
        ),
      );
    } catch {
      return 'duplicate';
    }

    await this.loadApplications();
    return 'applied';
  }

  private async loadCurrentCandidate(): Promise<void> {
    const currentUser = this.currentUserSignal();
    if (!currentUser) {
      return;
    }

    const candidates = await firstValueFrom(
      this.http.get<CandidateApi[]>(`${API_BASE_URL}/candidates/`, { headers: this.authHeaders() }),
    );
    const currentCandidate = candidates.find((candidate) => candidate.user.email === currentUser.email);
    this.candidateIdSignal.set(currentCandidate?.id ?? null);
  }

  async loadApplications(): Promise<void> {
    const candidateId = this.candidateIdSignal();
    if (!candidateId) {
      this.applicationsSignal.set([]);
      return;
    }

    const apps = await firstValueFrom(
      this.http.get<JobApplicationApi[]>(`${API_BASE_URL}/jobapplications/`, {
        headers: this.authHeaders(),
      }),
    );

    const mapped = apps
      .filter((application) => application.candidate === candidateId)
      .map((application) => ({
        id: application.id,
        offerId: application.position,
        offerTitle: this.getOfferById(application.position)?.title ?? `Offre #${application.position}`,
        candidateEmail: this.currentUserSignal()?.email ?? '',
        motivation: 'Candidature envoyée via plateforme',
        status: application.status,
        createdAt: application.created_at,
      }));

    this.applicationsSignal.set(mapped);
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('candidate_access_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
