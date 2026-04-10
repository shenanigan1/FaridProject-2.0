import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface PositionCreatePayload {
  company: number;
  title: string;
  description?: string;
  department: string;
  contract_type: string;
  location?: string;
  salary?: number | null;
  is_active?: boolean;
}

export interface PositionDto extends PositionCreatePayload {
  id: number;
  created_at: string;
  updated_at: string;
}

/** Generic paginated API shape: { results: [...] } */
export interface Paginated<T> {
  results: T[];
}

interface JobApplicationLiteDto {
  position: number;
}

export interface TemplateOptionDto {
  id: number;
  name: string;
}

export interface PositionTemplateAssignmentDto {
  id: number;
  position: number;
  template: number;
  template_name: string;
  manager_id: number | null;
  manager_name: string | null;
  order: number;
}

export interface PositionTemplateAssignmentInput {
  template_id: number;
  manager_id?: number | null;
  order?: number;
}

function asArray<T>(value: T[] | Paginated<T>): T[] {
  return Array.isArray(value) ? value : value.results;
}

@Injectable({ providedIn: 'root' })
export class PositionsApiService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = '/api/positions/';
  private readonly jobApplicationsUrl = '/api/jobapplications/';
  private readonly templatesUrl = '/api/templates/';

  create(payload: PositionCreatePayload): Observable<PositionDto> {
    return this.http.post<PositionDto>(this.baseUrl, payload);
  }

  /** Some backends return PositionDto[] OR { results: PositionDto[] } */
  list(): Observable<PositionDto[] | Paginated<PositionDto>> {
    return this.http.get<PositionDto[] | Paginated<PositionDto>>(this.baseUrl);
  }

  getById(id: number): Observable<PositionDto> {
    return this.http.get<PositionDto>(`${this.baseUrl}${id}/`);
  }

  patch(id: number, payload: Partial<PositionCreatePayload>): Observable<PositionDto> {
    return this.http.patch<PositionDto>(`${this.baseUrl}${id}/`, payload);
  }

  listApplicationCounts(): Observable<Record<number, number>> {
    return this.http
      .get<JobApplicationLiteDto[] | Paginated<JobApplicationLiteDto>>(this.jobApplicationsUrl)
      .pipe(
        map((payload) => {
          const counts: Record<number, number> = {};
          for (const application of asArray(payload)) {
            counts[application.position] = (counts[application.position] ?? 0) + 1;
          }
          return counts;
        }),
      );
  }

  listTemplates(): Observable<TemplateOptionDto[]> {
    return this.http
      .get<TemplateOptionDto[] | Paginated<TemplateOptionDto>>(this.templatesUrl)
      .pipe(map(asArray));
  }

  getPositionTemplateAssignments(positionId: number): Observable<PositionTemplateAssignmentDto[]> {
    return this.http.get<PositionTemplateAssignmentDto[]>(
      `${this.baseUrl}${positionId}/test-templates/`,
    );
  }

  setPositionTemplateAssignments(
    positionId: number,
    assignments: PositionTemplateAssignmentInput[],
  ): Observable<PositionTemplateAssignmentDto[]> {
    return this.http.put<PositionTemplateAssignmentDto[]>(
      `${this.baseUrl}${positionId}/test-templates/`,
      { assignments },
    );
  }
}
