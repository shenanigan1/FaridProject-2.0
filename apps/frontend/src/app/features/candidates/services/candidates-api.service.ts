import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CandidateUserDto {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export interface CandidateDto {
  id: number;
  user: CandidateUserDto;
  status: string;
  flag: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  results: T[];
}

@Injectable({ providedIn: 'root' })
export class CandidatesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/candidates/';

  list(): Observable<CandidateDto[] | PaginatedResponse<CandidateDto>> {
    return this.http.get<CandidateDto[] | PaginatedResponse<CandidateDto>>(this.baseUrl);
  }
}
