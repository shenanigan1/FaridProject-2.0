import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { environment } from '@env/environment';
import { JobPublicApiService } from '@jobs/services/job-public-api.service';

interface PaginatedDto<T> {
  results: T[];
}

interface CandidateApplicationDto {
  id: number;
  candidate: number;
  position: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CandidateEvaluationDto {
  id: number;
  application: number | null;
  position: number | null;
  status: string;
  template_name?: string;
  position_title?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  validated_at?: string | null;
}

export interface CandidateApplicationItem {
  id: number;
  positionId: number;
  title: string;
  location: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateTestItem {
  id: number;
  applicationId: number | null;
  positionId: number | null;
  title: string;
  positionTitle: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  validatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class CandidateWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly jobs = inject(JobPublicApiService);
  private readonly apiBase = environment.apiBaseUrl;

  listApplications(): Observable<CandidateApplicationItem[]> {
    return this.http
      .get<CandidateApplicationDto[] | PaginatedDto<CandidateApplicationDto>>(
        `${this.apiBase}/api/jobapplications/`,
      )
      .pipe(
        map((payload) => this.unwrap(payload)),
        switchMap((applications) => {
          if (!applications.length) {
            return of([]);
          }

          return forkJoin(
            applications.map((application) =>
              this.jobs.getOfferById(application.position).pipe(
                map((job) => ({
                  id: application.id,
                  positionId: application.position,
                  title: job.title,
                  location: job.location,
                  status: application.status,
                  createdAt: application.created_at,
                  updatedAt: application.updated_at,
                })),
                catchError(() =>
                  of({
                    id: application.id,
                    positionId: application.position,
                    title: `Poste #${application.position}`,
                    location: '',
                    status: application.status,
                    createdAt: application.created_at,
                    updatedAt: application.updated_at,
                  }),
                ),
              ),
            ),
          );
        }),
      );
  }

  listTests(): Observable<CandidateTestItem[]> {
    return this.http
      .get<CandidateEvaluationDto[] | PaginatedDto<CandidateEvaluationDto>>(
        `${this.apiBase}/api/evaluations/`,
      )
      .pipe(
        map((payload) =>
          this.unwrap(payload).map((test) => ({
            id: test.id,
            applicationId: test.application,
            positionId: test.position,
            title: test.template_name || `Test #${test.id}`,
            positionTitle: test.position_title || (test.position ? `Poste #${test.position}` : ''),
            status: test.status,
            createdAt: test.created_at,
            updatedAt: test.updated_at,
            completedAt: test.completed_at ?? null,
            validatedAt: test.validated_at ?? null,
          })),
        ),
      );
  }

  private unwrap<T>(payload: T[] | PaginatedDto<T>): T[] {
    return Array.isArray(payload) ? payload : payload.results;
  }
}
