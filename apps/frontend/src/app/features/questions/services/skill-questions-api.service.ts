import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SkillQuestionDto } from 'src/app/features/questions/models/skill-question.model';


export type CreateSkillQuestionDto = Partial<Pick<
  SkillQuestionDto,
  'format' | 'title' | 'text' | 'explanation' | 'rubric' | 'is_mandatory' | 'points' | 'difficulty' | 'order' | 'pool'
>>;

export type UpdateSkillQuestionDto = CreateSkillQuestionDto;

@Injectable({ providedIn: 'root' })
export class SkillQuestionsApiService {
  private readonly http = inject(HttpClient);

  listByPool(poolId: string): Observable<SkillQuestionDto[]> {
    return this.http.get<SkillQuestionDto[]>(`/api/questionpools/${poolId}/questions/`);
  }

  createInPool(poolId: string, dto: CreateSkillQuestionDto): Observable<SkillQuestionDto> {
    return this.http.post<SkillQuestionDto>(`/api/questionpools/${poolId}/questions/`, dto);
  }

  get(id: string): Observable<SkillQuestionDto> {
    return this.http.get<SkillQuestionDto>(`/api/skillquestions/${id}/`);
  }

  update(id: string, dto: UpdateSkillQuestionDto): Observable<SkillQuestionDto> {
    return this.http.patch<SkillQuestionDto>(`/api/skillquestions/${id}/`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/skillquestions/${id}/`);
  }
}
