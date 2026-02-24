import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class PositionsApiService {
  private readonly baseUrl = '/api/positions/';

  constructor(private readonly http: HttpClient) {}

  create(payload: PositionCreatePayload): Observable<PositionDto> {
    return this.http.post<PositionDto>(this.baseUrl, payload);
  }

  list(): Observable<PositionDto[]> {
    return this.http.get<PositionDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<PositionDto> {
    return this.http.get<PositionDto>(`${this.baseUrl}${id}/`);
  }

  patch(id: number, payload: Partial<PositionCreatePayload>): Observable<PositionDto> {
    return this.http.patch<PositionDto>(`${this.baseUrl}${id}/`, payload);
  }
}
