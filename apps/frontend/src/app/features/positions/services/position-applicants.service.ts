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
  assigned_template: number | null;
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

interface TemplateDto {
  id: number;
  name: string;
}

export interface PositionApplicant {
  applicationId: number;
  candidateId: number;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  appliedAt: string;
  assignedTemplateId: number | null;
  assignedTemplateName: string | null;
}

export interface AssignApplicantTestPayload {
  templateId: number;
}

function asList<T>(value: T[] | Paginated<T>): T[] {
  return Array.isArray(value) ? value : value.results;
}

@Injectable({ providedIn: 'root' })
export class PositionApplicantsService {
  private readonly http = inject(HttpClient);

  private readonly applicationsUrl = '/api/jobapplications/';
  private readonly candidatesUrl = '/api/candidates/';
  private readonly templatesUrl = '/api/templates/';

  listByPosition(positionId: number): Observable<PositionApplicant[]> {
    return forkJoin({
      applications: this.http
        .get<JobApplicationDto[] | Paginated<JobApplicationDto>>(this.applicationsUrl)
        .pipe(map(asList)),
      candidates: this.http
        .get<CandidateDto[] | Paginated<CandidateDto>>(this.candidatesUrl)
        .pipe(map(asList)),
      templates: this.http
        .get<TemplateDto[] | Paginated<TemplateDto>>(this.templatesUrl)
        .pipe(map(asList)),
    }).pipe(
      map(({ applications, candidates, templates }) => {
        const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
        const templateById = new Map(templates.map((template) => [template.id, template]));

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
              assignedTemplateId: application.assigned_template,
              assignedTemplateName: application.assigned_template
                ? templateById.get(application.assigned_template)?.name ?? null
                : null,
            };
          });
      }),
    );
  }

  listTests(): Observable<TemplateDto[]> {
    return this.http
      .get<TemplateDto[] | Paginated<TemplateDto>>(this.templatesUrl)
      .pipe(map(asList));
  }

  assignTestToApplicant(
    applicationId: number,
    payload: AssignApplicantTestPayload,
  ): Observable<void> {
    return this.http
      .patch<void>(`${this.applicationsUrl}${applicationId}/`, {
        assigned_template: payload.templateId,
      });
  }
}
