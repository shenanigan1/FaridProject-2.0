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

function asArray<T>(value: T[] | Paginated<T>): T[] {
  return Array.isArray(value) ? value : value.results;
}

@Injectable({ providedIn: 'root' })
export class PositionsApiService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = '/api/positions/';
  private readonly jobApplicationsUrl = '/api/jobapplications/';

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
}
