import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QuestionPool } from '@pools/models/question-pool.model';

export type CreatePoolDto = Pick<QuestionPool, 'code' | 'name' | 'description'>;
export type UpdatePoolDto = Partial<Pick<QuestionPool, 'code' | 'name' | 'description'>>;

@Injectable({ providedIn: 'root' })
export class PoolsApiService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = '/api/questionpools/';

  list(): Observable<QuestionPool[]> {
    return this.http.get<QuestionPool[]>(this.baseUrl);
  }

  get(id: string): Observable<QuestionPool> {
    return this.http.get<QuestionPool>(`${this.baseUrl}${id}/`);
  }

  create(dto: CreatePoolDto): Observable<QuestionPool> {
    return this.http.post<QuestionPool>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdatePoolDto): Observable<QuestionPool> {
    return this.http.patch<QuestionPool>(`${this.baseUrl}${id}/`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
