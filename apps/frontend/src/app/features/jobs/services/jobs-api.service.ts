import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

import { PositionCreatePayload, PositionDto } from '@features/positions/services/positions-api.service';

export interface Paginated<T> {
  results: T[];
}

export interface CompanyDto {
  id: number;
  name: string;
  created_at: string;
}

interface JobApplicationLiteDto {
  position: number;
}

export interface JobsWorkspace {
  positions: PositionDto[];
  applicationCounts: Record<number, number>;
  companies: CompanyDto[];
}

export interface JobSearchCriteria {
  query: string;
  location: string;
  contractType: string;
  status: string;
}

function asArray<T>(payload: T[] | Paginated<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results;
}

export function matchesJobSearch(position: PositionDto, criteria: JobSearchCriteria): boolean {
  const query = criteria.query.trim().toLowerCase();
  const location = criteria.location;
  const contractType = criteria.contractType;
  const status = criteria.status;

  const searchable = [
    position.title,
    position.location,
    position.contract_type,
    position.department,
    position.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchesQuery = !query || searchable.includes(query);
  const positionLocation = (position.location ?? '').toLowerCase();
  const matchesLocation = location === 'all' || positionLocation.includes(location);
  const matchesContractType =
    contractType === 'all' || position.contract_type.toLowerCase() === contractType;

  const computedStatus = getJobStatus(position);
  const matchesStatus = status === 'all' || computedStatus === status;

  return matchesQuery && matchesLocation && matchesContractType && matchesStatus;
}

export function getJobStatus(position: PositionDto): 'active' | 'draft' {
  if (position.is_active === false) {
    return 'draft';
  }

  return 'active';
}

@Injectable({ providedIn: 'root' })
export class JobsApiService {
  private readonly http = inject(HttpClient);

  private readonly positionsUrl = '/api/positions/';
  private readonly applicationsUrl = '/api/jobapplications/';
  private readonly companiesUrl = '/api/companies/';

  loadWorkspace(): Observable<JobsWorkspace> {
    return forkJoin({
      positions: this.listPositions(),
      applicationCounts: this.listApplicationCounts(),
      companies: this.listCompanies(),
    });
  }

  listPositions(): Observable<PositionDto[]> {
    return this.http
      .get<PositionDto[] | Paginated<PositionDto>>(this.positionsUrl)
      .pipe(map(asArray));
  }

  listApplicationCounts(): Observable<Record<number, number>> {
    return this.http
      .get<JobApplicationLiteDto[] | Paginated<JobApplicationLiteDto>>(this.applicationsUrl)
      .pipe(
        map((payload) =>
          asArray(payload).reduce<Record<number, number>>((counts, application) => {
            counts[application.position] = (counts[application.position] ?? 0) + 1;
            return counts;
          }, {}),
        ),
      );
  }

  listCompanies(): Observable<CompanyDto[]> {
    return this.http.get<CompanyDto[] | Paginated<CompanyDto>>(this.companiesUrl).pipe(map(asArray));
  }

  createPosition(payload: PositionCreatePayload): Observable<PositionDto> {
    return this.http.post<PositionDto>(this.positionsUrl, payload);
  }

  updatePosition(id: number, payload: Partial<PositionCreatePayload>): Observable<PositionDto> {
    return this.http.patch<PositionDto>(`${this.positionsUrl}${id}/`, payload);
  }

  archivePosition(id: number): Observable<PositionDto> {
    return this.updatePosition(id, { is_active: false });
  }
}
