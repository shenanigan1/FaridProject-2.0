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

interface PositionDto {
  id: number;
  title: string;
}

interface EvaluationDto {
  id: number;
  application: number | null;
  status: string;
  updated_at: string;
}

export interface PositionApplicant {
  applicationId: number;
  candidateId: number;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  appliedAt: string;
  ongoingTestsCount: number;
  ongoingTestIds: number[];
}

export interface InProgressTestItem {
  evaluationId: number;
  applicationId: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  positionId: number;
  positionTitle: string;
  updatedAt: string;
}

function asList<T>(value: T[] | Paginated<T>): T[] {
  return Array.isArray(value) ? value : value.results;
}

@Injectable({ providedIn: 'root' })
export class PositionApplicantsService {
  private readonly http = inject(HttpClient);

  private readonly applicationsUrl = '/api/jobapplications/';
  private readonly candidatesUrl = '/api/candidates/';
  private readonly evaluationsUrl = '/api/evaluations/';
  private readonly positionsUrl = '/api/positions/';

  listByPosition(positionId: number): Observable<PositionApplicant[]> {
    return forkJoin({
      applications: this.http
        .get<JobApplicationDto[] | Paginated<JobApplicationDto>>(this.applicationsUrl)
        .pipe(map(asList)),
      candidates: this.http
        .get<CandidateDto[] | Paginated<CandidateDto>>(this.candidatesUrl)
        .pipe(map(asList)),
      evaluations: this.http
        .get<EvaluationDto[] | Paginated<EvaluationDto>>(this.evaluationsUrl)
        .pipe(map(asList)),
    }).pipe(
      map(({ applications, candidates, evaluations }) => {
        const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
        const ongoingTestsByApplication = this.getOngoingTestsByApplication(evaluations);

        return applications
          .filter((application) => application.position === positionId)
          .sort((left, right) => right.created_at.localeCompare(left.created_at))
          .map((application) => {
            const candidate = candidateById.get(application.candidate);
            const ongoingTests = ongoingTestsByApplication.get(application.id) ?? [];

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
              ongoingTestsCount: ongoingTests.length,
              ongoingTestIds: ongoingTests.map((item) => item.id),
            };
          });
      }),
    );
  }

  listInProgressTests(): Observable<InProgressTestItem[]> {
    return forkJoin({
      applications: this.http
        .get<JobApplicationDto[] | Paginated<JobApplicationDto>>(this.applicationsUrl)
        .pipe(map(asList)),
      candidates: this.http
        .get<CandidateDto[] | Paginated<CandidateDto>>(this.candidatesUrl)
        .pipe(map(asList)),
      evaluations: this.http
        .get<EvaluationDto[] | Paginated<EvaluationDto>>(this.evaluationsUrl)
        .pipe(map(asList)),
      positions: this.http
        .get<PositionDto[] | Paginated<PositionDto>>(this.positionsUrl)
        .pipe(map(asList)),
    }).pipe(
      map(({ applications, candidates, evaluations, positions }) => {
        const applicationById = new Map(applications.map((application) => [application.id, application]));
        const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
        const positionById = new Map(positions.map((position) => [position.id, position]));

        return evaluations
          .filter((evaluation) => evaluation.status === 'in_progress' && evaluation.application !== null)
          .map((evaluation) => {
            const application = evaluation.application ? applicationById.get(evaluation.application) : undefined;
            if (!application) {
              return null;
            }

            const candidate = candidateById.get(application.candidate);
            const position = positionById.get(application.position);
            const candidateName = candidate
              ? `${candidate.user.first_name} ${candidate.user.last_name}`.trim()
              : `Candidate #${application.candidate}`;

            return {
              evaluationId: evaluation.id,
              applicationId: application.id,
              candidateId: application.candidate,
              candidateName,
              candidateEmail: candidate?.user.email ?? 'Unknown email',
              positionId: application.position,
              positionTitle: position?.title ?? `Position #${application.position}`,
              updatedAt: evaluation.updated_at,
            };
          })
          .filter((item): item is InProgressTestItem => item !== null)
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      }),
    );
  }

  private getOngoingTestsByApplication(
    evaluations: EvaluationDto[],
  ): Map<number, EvaluationDto[]> {
    const byApplication = new Map<number, EvaluationDto[]>();

    for (const evaluation of evaluations) {
      if (evaluation.status !== 'in_progress' || evaluation.application === null) {
        continue;
      }

      const appId = evaluation.application;
      const existing = byApplication.get(appId) ?? [];
      existing.push(evaluation);
      byApplication.set(appId, existing);
    }

    return byApplication;
  }
}
