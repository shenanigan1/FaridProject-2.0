import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

import { CandidateDto } from '@features/candidates/services/candidates-api.service';
import { PositionDto } from '@features/positions/services/positions-api.service';
import {
  InProgressTestItem,
  PositionApplicantsService,
} from '@features/positions/services/position-applicants.service';

interface Paginated<T> {
  results: T[];
}

export interface DashboardApplicationDto {
  id: number;
  candidate: number;
  position: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardSnapshot {
  positions: PositionDto[];
  candidates: CandidateDto[];
  applications: DashboardApplicationDto[];
  inProgressTests: InProgressTestItem[];
}

function asArray<T>(payload: T[] | Paginated<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results;
}

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly http = inject(HttpClient);
  private readonly applicants = inject(PositionApplicantsService);

  loadRecruitmentSnapshot(): Observable<DashboardSnapshot> {
    return forkJoin({
      positions: this.http.get<PositionDto[] | Paginated<PositionDto>>('/api/positions/').pipe(map(asArray)),
      candidates: this.http
        .get<CandidateDto[] | Paginated<CandidateDto>>('/api/candidates/')
        .pipe(map(asArray)),
      applications: this.http
        .get<DashboardApplicationDto[] | Paginated<DashboardApplicationDto>>('/api/jobapplications/')
        .pipe(map(asArray)),
      inProgressTests: this.applicants.listInProgressTests(),
    });
  }
}
