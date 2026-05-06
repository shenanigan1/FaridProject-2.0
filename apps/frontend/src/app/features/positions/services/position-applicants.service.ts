import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, expand, forkJoin, map, reduce } from 'rxjs';

interface Paginated<T> {
  results: T[];
  next?: string | null;
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

interface TemplateDto {
  id: number;
  name: string;
}

export interface LaunchTemplateSection {
  id: number;
  title: string;
  description?: string;
}

interface TemplateDetailDto extends TemplateDto {
  sections: LaunchTemplateSection[];
}

interface EvaluationDto {
  id: number;
  application: number | null;
  status: string;
  updated_at: string;
  template_name?: string;
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
  templateName: string;
  updatedAt: string;
}

export interface QuestionnaireQuestion {
  question_id: number;
  title: string;
  text: string;
  is_mandatory: boolean;
  points: number;
  candidate_answer: string;
  manager_comment: string;
  score: number | null;
}

export interface EvaluationQuestionnaire {
  evaluation_id: number;
  template_name: string;
  questions: QuestionnaireQuestion[];
}

export interface LaunchableTemplate {
  id: number;
  name: string;
}

export interface ManagerOption {
  id: number;
  full_name: string;
  email: string;
}

interface LaunchEvaluationPayload {
  application_id: number;
  template_id?: number;
  assigned_to_id?: number;
  section_assignments?: {
    section_id: number;
    manager_id: number;
  }[];
}

interface LaunchEvaluationResponse {
  id: number;
  application: number;
  status: string;
}

function isPaginatedPayload<T>(value: unknown): value is Paginated<T> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return Array.isArray((value as Paginated<T>).results);
}

@Injectable({ providedIn: 'root' })
export class PositionApplicantsService {
  private readonly http = inject(HttpClient);

  private readonly applicationsUrl = '/api/jobapplications/';
  private readonly candidatesUrl = '/api/candidates/';
  private readonly evaluationsUrl = '/api/evaluations/';
  private readonly positionsUrl = '/api/positions/';
  private readonly templatesUrl = '/api/templates/';

  private fetchAllPages<T>(url: string): Observable<T[]> {
    return this.http.get<T[] | Paginated<T>>(url).pipe(
      expand((payload) => {
        if (!isPaginatedPayload<T>(payload) || !payload.next) {
          return EMPTY;
        }
        return this.http.get<T[] | Paginated<T>>(payload.next);
      }),
      map((payload) => (isPaginatedPayload<T>(payload) ? payload.results : payload)),
      reduce((allRows, pageRows) => [...allRows, ...pageRows], [] as T[]),
    );
  }

  listByPosition(positionId: number): Observable<PositionApplicant[]> {
    return forkJoin({
      applications: this.fetchAllPages<JobApplicationDto>(this.applicationsUrl),
      candidates: this.fetchAllPages<CandidateDto>(this.candidatesUrl),
      evaluations: this.fetchAllPages<EvaluationDto>(this.evaluationsUrl),
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
      applications: this.fetchAllPages<JobApplicationDto>(this.applicationsUrl),
      candidates: this.fetchAllPages<CandidateDto>(this.candidatesUrl),
      evaluations: this.fetchAllPages<EvaluationDto>(this.evaluationsUrl),
      positions: this.fetchAllPages<PositionDto>(this.positionsUrl),
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
              templateName: evaluation.template_name ?? 'Template',
              updatedAt: evaluation.updated_at,
            };
          })
          .filter((item): item is InProgressTestItem => item !== null)
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      }),
    );
  }

  listLaunchableTemplates(): Observable<LaunchableTemplate[]> {
    return this.fetchAllPages<TemplateDto>(this.templatesUrl).pipe(
      map((templates) =>
        templates.map((template) => ({ id: template.id, name: template.name })),
      ),
    );
  }

  getLaunchTemplateDetail(templateId: number): Observable<TemplateDetailDto> {
    return this.http.get<TemplateDetailDto>(`${this.templatesUrl}${templateId}/`);
  }

  launchTestForApplication(
    applicationId: number,
    templateId?: number,
    sectionAssignments: { section_id: number; manager_id: number }[] = [],
  ): Observable<LaunchEvaluationResponse[]> {
    const payload: LaunchEvaluationPayload = {
      application_id: applicationId,
    };
    if (templateId !== undefined) {
      payload.template_id = templateId;
    }
    if (sectionAssignments.length > 0) {
      payload.section_assignments = sectionAssignments;
    }

    return this.http
      .post<LaunchEvaluationResponse | LaunchEvaluationResponse[]>(
        '/api/evaluations/launch/',
        payload,
      )
      .pipe(map((response) => (Array.isArray(response) ? response : [response])));
  }

  rejectApplication(applicationId: number): Observable<{ id: number; status: string }> {
    return this.http.patch<{ id: number; status: string }>(
      `${this.applicationsUrl}${applicationId}/`,
      { status: 'rejected' },
    );
  }

  assignManagerToEvaluation(
    evaluationId: number,
    managerId: number,
  ): Observable<{ id: number; assigned_to: number | null }> {
    return this.http.patch<{ id: number; assigned_to: number | null }>(
      `/api/evaluations/${evaluationId}/`,
      { assigned_to: managerId },
    );
  }

  listManagers(query = ''): Observable<ManagerOption[]> {
    const normalized = query.trim();
    const url = normalized
      ? `/api/evaluations/managers/?q=${encodeURIComponent(normalized)}`
      : '/api/evaluations/managers/';
    return this.http.get<ManagerOption[]>(url);
  }

  getEvaluationQuestionnaire(evaluationId: number): Observable<EvaluationQuestionnaire> {
    return this.http.get<EvaluationQuestionnaire>(
      `/api/evaluations/${evaluationId}/questionnaire/`,
    );
  }

  saveEvaluationQuestionnaire(
    evaluationId: number,
    answers: {
      question_id: number;
      candidate_answer: string;
      manager_comment: string;
      score: number | null;
    }[],
  ): Observable<EvaluationQuestionnaire> {
    return this.http.post<EvaluationQuestionnaire>(
      `/api/evaluations/${evaluationId}/questionnaire/`,
      { answers },
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
