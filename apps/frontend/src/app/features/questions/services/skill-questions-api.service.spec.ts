import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SkillQuestionDto } from '@features/questions/models/skill-question.model';

export type CreateSkillQuestionDto = Pick<
  SkillQuestionDto,
  | 'format'
  | 'title'
  | 'text'
  | 'explanation'
  | 'rubric'
  | 'is_mandatory'
  | 'points'
  | 'difficulty'
  | 'order'
  | 'pool'
>;

export type UpdateSkillQuestionDto = Partial<CreateSkillQuestionDto>;

@Injectable({ providedIn: 'root' })
export class SkillQuestionsApiService {
  private readonly http = inject(HttpClient);

  private readonly poolsBaseUrl = '/api/questionpools/';
  private readonly questionsBaseUrl = '/api/skillquestions/';

  listByPool(poolId: string): Observable<SkillQuestionDto[]> {
    return this.http.get<SkillQuestionDto[]>(`${this.poolsBaseUrl}${poolId}/questions/`);
  }

  createInPool(poolId: string, dto: UpdateSkillQuestionDto): Observable<SkillQuestionDto> {
    return this.http.post<SkillQuestionDto>(`${this.poolsBaseUrl}${poolId}/questions/`, dto);
  }

  get(id: string): Observable<SkillQuestionDto> {
    return this.http.get<SkillQuestionDto>(`${this.questionsBaseUrl}${id}/`);
  }

  update(id: string, dto: UpdateSkillQuestionDto): Observable<SkillQuestionDto> {
    return this.http.patch<SkillQuestionDto>(`${this.questionsBaseUrl}${id}/`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.questionsBaseUrl}${id}/`);
  }
}
