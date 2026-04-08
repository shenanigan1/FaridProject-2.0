import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

interface Paginated<T> {
  results: T[];
}

interface JobApplicationDto {
  id: number;
  candidate: number;
  position: number;
  status: string;
  created_at: string;
}

interface CandidateDto {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export interface PositionApplicant {
  applicationId: number;
  candidateId: number;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  appliedAt: string;
}

function asList<T>(value: T[] | Paginated<T>): T[] {
  return Array.isArray(value) ? value : value.results;
}

@Injectable({ providedIn: 'root' })
export class PositionApplicantsService {
  private readonly http = inject(HttpClient);

  private readonly applicationsUrl = '/api/jobapplications/';
  private readonly candidatesUrl = '/api/candidates/';

  listByPosition(positionId: number): Observable<PositionApplicant[]> {
    return forkJoin({
      applications: this.http
        .get<JobApplicationDto[] | Paginated<JobApplicationDto>>(this.applicationsUrl)
        .pipe(map(asList)),
      candidates: this.http
        .get<CandidateDto[] | Paginated<CandidateDto>>(this.candidatesUrl)
        .pipe(map(asList)),
    }).pipe(
      map(({ applications, candidates }) => {
        const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));

        return applications
          .filter((application) => application.position === positionId)
          .sort((left, right) => right.created_at.localeCompare(left.created_at))
          .map((application) => {
            const candidate = candidateById.get(application.candidate);

            return {
              applicationId: application.id,
              candidateId: application.candidate,
              fullName: candidate
                ? `${candidate.user.first_name} ${candidate.user.last_name}`.trim()
                : `Candidate #${application.candidate}`,
              email: candidate?.user.email ?? 'Unknown email',
              phone: candidate?.user.phone ?? '',
              status: application.status,
              appliedAt: application.created_at,
            };
          });
      }),
    );
  }
}
